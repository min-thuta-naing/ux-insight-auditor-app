import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { HeuristicDef, Persona, UsabilityReport, AuditScope, WcagLevel, Finding } from "../types";

// Initialize Gemini API
// Note: In a production app, you should use a backend to proxy these requests to keep your API key secure.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeImage = async (
  base64Image: string,
  heuristic: HeuristicDef,
  persona: Persona,
  scope: AuditScope = 'UX',
  wcagLevel: WcagLevel = 'AA'
): Promise<UsabilityReport> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env.local file.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const isInclusive = scope === 'Inclusive';

  const prompt = `
    You are a world-class UX Auditor and Accessibility Expert. 
    Perform a professional UX audit on the attached website screenshot.
    
    TARGET PERSONA: ${persona}
    SPECIFIC HEURISTIC TO AUDIT: ${heuristic.id} - ${heuristic.name}
    HEURISTIC DEFINITION: ${heuristic.definition}
    AUDIT FOCUS: ${heuristic.instruction}
    
    ${isInclusive ? `ACCESSIBILITY SCOPE: Include WCAG 2.2 Level ${wcagLevel} audit findings.` : 'SCOPE: UX ONLY. Do not include any WCAG or accessibility-related findings.'}

    INSTRUCTIONS:
    1. Analyze the image carefully based on the specified heuristic and persona.
    2. Identify specific UI elements that violate the heuristic${isInclusive ? ' or accessibility standards' : ''}.
    3. For each issue, provide:
       - element_name: Name of the UI component.
       - location_box: [ymin, xmin, ymax, xmax] - normalized coordinates (0-1000) surrounding the element.
       - issue_category: Short category (e.g., "Visibility", "Contrast", "Navigation").
       - issue_description: Clear description of what is wrong.
       - severity: "Critical", "High", "Medium", or "Low".
       - reasoning: Why this is an issue for the ${persona}.
       - suggestion: How to fix it.
    4. Calculate an overall UX score (0-100) for the page relative to this heuristic.
    ${isInclusive ? '5. Calculate an accessibility score (0-100).' : ''}
    6. Provide a concise executive summary.

    RESPONSE FORMAT:
    The response MUST be a JSON object following this interface:
    {
      "overall_score": number,
      "accessibility_score"?: number,
      "violation_count": number,
      "executive_summary": string,
      "findings": [
        {
          "category": "UX" | "WCAG",
          "rule_id": string (the heuristic ID or WCAG criteria ID),
          "element_name": string,
          "location_box": { "ymin": number, "xmin": number, "ymax": number, "xmax": number },
          "issue_category": string,
          "issue_description": string,
          "severity": "Critical" | "High" | "Medium" | "Low",
          "reasoning": string,
          "suggestion": string
        }
      ]
    }
  `;

  try {
    const imagePart: Part = {
      inlineData: {
        data: base64Image,
        mimeType: "image/png" // Assuming PNG, but Gemini handles most formats
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    const rawFindings = parsedData.findings || [];
    const filteredFindings = isInclusive
      ? rawFindings
      : rawFindings.filter((f: any) => f.category !== 'WCAG');

    const findingsWithIds = filteredFindings.map((f: any, index: number) => ({
      ...f,
      id: `${heuristic.id}-${index + 1}`
    }));

    const criticalIssues = findingsWithIds.filter((f: any) => f.severity === 'Critical' || f.severity === 'High').length;
    const baseScore = parsedData.overall_score || 0;

    return {
      audit_id: `gemini-${Date.now()}`,
      audit_timestamp: new Date().toISOString(),
      heuristic_id: heuristic.id,
      heuristic_name: heuristic.name,
      overall_score: baseScore,
      accessibility_score: parsedData.accessibility_score,
      violation_count: findingsWithIds.length,
      critical_issues: criticalIssues,
      risk_level: baseScore > 80 ? 'Pass' : baseScore > 60 ? 'Warning' : 'Fail',
      executive_summary: parsedData.executive_summary,
      findings: findingsWithIds
    };
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze image with Gemini";
    
    // Check for rate limit / quota errors
    if (errorMessage.toLowerCase().includes("429") || 
        errorMessage.toLowerCase().includes("quota") || 
        errorMessage.toLowerCase().includes("limit") ||
        errorMessage.toLowerCase().includes("credit")) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Tests the Gemini API connection with a minimal prompt
 * Returns 'success', 'quota_exceeded', or 'error'
 */
export const testGeminiConnection = async (): Promise<'success' | 'quota_exceeded' | 'error'> => {
  if (!API_KEY) return 'error';
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent("ping");
    const text = result.response.text();
    return text ? 'success' : 'error';
  } catch (error: any) {
    console.error("Gemini Connection Test Failed:", error);
    const errorMessage = error?.message?.toLowerCase() || "";
    // Check for both quota exhaustion (429) and credit-related failures
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("limit") || errorMessage.includes("credit")) {
      return 'quota_exceeded';
    }
    return 'error';
  }
};
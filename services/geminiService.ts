import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { HeuristicDef, Persona, UsabilityReport, AuditScope, WcagLevel, Finding } from "../types";
import { loadGuidelines } from "../utils/csvParser";

// Initialize Gemini API
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

  // Load local knowledge base to inject into the prompt
  const uxGuidelines = await loadGuidelines('ux');
  const webGuidelines = await loadGuidelines('web');
  const reasoningGuidelines = await loadGuidelines('reasoning');
  
  // We take a slice of the most relevant rules to keep the prompt size manageable
  const localRules = JSON.stringify([...uxGuidelines, ...webGuidelines, ...reasoningGuidelines].slice(0, 60));

  const isInclusive = scope === 'Inclusive';

  const prompt = `
    You are a professional UI/UX Auditor. You are auditing a student's work based on specific internal design guidelines.
    
    INTERNAL DESIGN GUIDELINES (Knowledge Base):
    ${localRules}

    AUDIT PARAMETERS:
    - Target Persona: ${persona}
    - Specific Heuristic: ${heuristic.id} - ${heuristic.name}
    - Heuristic Definition: ${heuristic.definition}
    - Audit Focus: ${heuristic.instruction}
    - Scope: ${isInclusive ? `UX + WCAG 2.2 Level ${wcagLevel}` : 'UX ONLY'}

    INSTRUCTIONS:
    1. Look at the attached UI screenshot. 
    2. Check for violations specifically mentioned in the INTERNAL DESIGN GUIDELINES.
    3. Use your visual reasoning to identify if the layout is cluttered, unorganized, or has poor visual hierarchy (especially if it looks like the messy Arngren.net style).
    4. For each finding, you MUST provide accurate coordinates (ymin, xmin, ymax, xmax) in 0-1000 normalized format.
    5. Severity levels: "Critical", "High", "Medium", "Low".
    
    RESPONSE JSON FORMAT:
    {
      "overall_score": number (0-100),
      "accessibility_score"?: number (0-100),
      "executive_summary": string,
      "findings": [
        {
          "category": "UX" | "WCAG",
          "rule_id": string (The ID or Name from the guidelines or heuristic),
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
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    const rawFindings = parsedData.findings || [];
    const findingsWithIds = rawFindings.map((f: any, index: number) => ({
      ...f,
      id: `${heuristic.id}-${index + 1}`
    }));

    const criticalIssues = findingsWithIds.filter((f: any) => f.severity === 'Critical' || f.severity === 'High').length;
    const baseScore = parsedData.overall_score || 0;

    return {
      audit_id: `gemini-local-${Date.now()}`,
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
    console.error("Gemini Hybrid Analysis Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Analysis failed";
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent("ping");
    const text = result.response.text();
    return text ? 'success' : 'error';
  } catch (error: any) {
    console.error("Gemini Connection Test Failed:", error);
    const errorMessage = error?.message?.toLowerCase() || "";
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("limit") || errorMessage.includes("credit")) {
      return 'quota_exceeded';
    }
    return 'error';
  }
};
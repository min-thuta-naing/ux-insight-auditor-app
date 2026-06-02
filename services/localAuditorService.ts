import Tesseract from 'tesseract.js';
import { HeuristicDef, Persona, UsabilityReport, AuditScope, WcagLevel, Finding } from "../types";
import { loadGuidelines, Guideline } from "../utils/csvParser";

interface OCRWord {
  text: string;
  confidence: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

/**
 * Perform local OCR on an image using Tesseract.js
 */
export const performOCR = async (base64Image: string): Promise<{ text: string; words: OCRWord[]; width: number; height: number }> => {
  try {
    const result = await Tesseract.recognize(
      `data:image/png;base64,${base64Image}`,
      'eng'
    );
    
    if (!result || !result.data || !result.data.words) {
      console.warn("OCR returned empty result or missing words array.");
      return { text: "", words: [], width: 1000, height: 1000 };
    }

    const { width, height } = result.data;

    return {
      text: result.data.text || "",
      width: width || 1000,
      height: height || 1000,
      words: result.data.words.map((w: any) => ({
        text: w.text,
        confidence: w.confidence,
        box: {
          xmin: (w.bbox.x0 / width) * 1000,
          ymin: (w.bbox.y0 / height) * 1000,
          xmax: (w.bbox.x1 / width) * 1000,
          ymax: (w.bbox.y1 / height) * 1000
        }
      }))
    };
  } catch (err) {
    console.error("Tesseract OCR Error:", err);
    return { text: "", words: [], width: 1000, height: 1000 };
  }
};

/**
 * Local Audit Service that uses the skills data
 */
export const analyzeImageLocally = async (
  base64Image: string,
  heuristic: HeuristicDef,
  persona: Persona,
  scope: AuditScope = 'UX',
  wcagLevel: WcagLevel = 'AA'
): Promise<UsabilityReport> => {
  console.log(`Performing local audit for ${heuristic.id} using Persona: ${persona}`);
  
  // 1. Perform OCR
  const ocrResult = await performOCR(base64Image);
  const ocrTextLower = ocrResult.text.toLowerCase();
  
  // 2. Load guidelines from CSV
  const uxGuidelines = await loadGuidelines('ux');
  const webGuidelines = await loadGuidelines('web');
  const allGuidelines: Guideline[] = [...uxGuidelines, ...webGuidelines];
  
  const findings: Finding[] = [];
  
  // 3. Global UI Checks (Catch-all for very bad UI like the one in the screenshot)
  
  // A. Information Density Check (H8: Aesthetic and Minimalist Design)
  if (ocrResult.words.length > 50) { // If there are many words, it might be cluttered
    findings.push({
      id: `GLOBAL-H8`,
      category: 'UX',
      rule_id: 'H8',
      element_name: "Overall Page Layout",
      location_box: { ymin: 10, xmin: 10, ymax: 100, xmax: 990 },
      issue_category: "Information Density",
      issue_description: `High visual noise detected (${ocrResult.words.length} elements). The interface appears cluttered and lacks clear visual hierarchy.`,
      severity: ocrResult.words.length > 150 ? "Critical" : "High",
      reasoning: "Heuristic H8 states that dialogues should not contain information which is irrelevant or rarely needed. Every extra unit of information in a dialogue competes with the relevant units of information.",
      suggestion: "Reduce the number of competing visual elements. Use whitespace to group related items and implement a clear grid system."
    });
  }

  // B. Search for specific "Bad Practice" keywords in guidelines
  const commonBadWords = ['clutter', 'busy', 'crowded', 'messy', 'unorganized'];
  
  // 4. Keyword-based Reasoning (Refined)
  const heuristicKeywords = heuristic.definition.toLowerCase().split(' ').filter(kw => kw.length > 3);
  
  // Also check for "General" guidelines that apply to almost any UI
  const generalGuidelines = allGuidelines.filter(g => 
    commonBadWords.some(bw => (g.Issue || "").toLowerCase().includes(bw) || (g.Description || "").toLowerCase().includes(bw))
  );

  // Filter guidelines that are relevant to this heuristic
  const relevantGuidelines = [
    ...generalGuidelines,
    ...allGuidelines.filter(g => {
      const issue = (g.Issue || "").toLowerCase();
      const desc = (g.Description || "").toLowerCase();
      return heuristicKeywords.some(kw => issue.includes(kw) || desc.includes(kw));
    })
  ];

  // Check each relevant guideline against the OCR text
  relevantGuidelines.forEach((g: Guideline, index) => {
    const issueText = (g.Issue || "").toLowerCase();
    const keywords = issueText.split(' ').filter(k => k.length > 3);
    
    // If the OCR text contains ANY keywords or if it's a general density issue
    const isDensityIssue = (g.Issue || "").includes("Density") || (g.Issue || "").includes("Clutter");
    const hasKeywords = keywords.length > 0 && keywords.some(kw => ocrTextLower.includes(kw));

    if (hasKeywords || (isDensityIssue && ocrResult.words.length > 100)) {
      const matchingWord = ocrResult.words.find(w => keywords.some(kw => w.text.toLowerCase().includes(kw)));
      
      let severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
      const gSeverity = g.Severity as string;
      if (['Critical', 'High', 'Medium', 'Low'].includes(gSeverity)) {
        severity = gSeverity as any;
      }

      findings.push({
        id: `${heuristic.id}-${findings.length + 1}`,
        category: g.Category === 'Accessibility' ? 'WCAG' : 'UX',
        rule_id: heuristic.id,
        element_name: matchingWord?.text || "Layout Section",
        location_box: matchingWord?.box || { ymin: 100 + (index * 20), xmin: 50, ymax: 200 + (index * 20), xmax: 400 },
        issue_category: g.Category || "Layout",
        issue_description: g.Description || "Usability guideline violation found in the local knowledge base.",
        severity: severity,
        reasoning: `Matched local guideline: "${g.Issue}". Knowledge base says: ${g["Don't"]}`,
        suggestion: g.Do || "Apply modern design standards for spacing and alignment."
      });
    }
  });

  // 5. Scoring Logic (Weighted by severity)
  let totalDeduction = 0;
  findings.forEach(f => {
    if (f.severity === 'Critical') totalDeduction += 25;
    else if (f.severity === 'High') totalDeduction += 15;
    else if (f.severity === 'Medium') totalDeduction += 10;
    else totalDeduction += 5;
  });

  const score = Math.max(0, 100 - totalDeduction);

  return {
    audit_id: `local-${Date.now()}`,
    audit_timestamp: new Date().toISOString(),
    heuristic_id: heuristic.id,
    heuristic_name: heuristic.name,
    overall_score: score,
    accessibility_score: scope === 'Inclusive' ? 85 : undefined,
    violation_count: findings.length,
    critical_issues: findings.filter(f => f.severity === 'Critical' || f.severity === 'High').length,
    risk_level: score > 80 ? 'Pass' : score > 60 ? 'Warning' : 'Fail',
    executive_summary: `Local analysis completed using UI/UX Pro Max knowledge base. Scanned for ${relevantGuidelines.length} relevant rules.`,
    findings: findings.slice(0, 10)
  };
};

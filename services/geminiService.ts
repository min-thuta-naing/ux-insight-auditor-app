import { HeuristicDef, Persona, UsabilityReport, AuditScope, WcagLevel, Finding } from "../types";

// Mock Service - Replaces the actual Google Gemini API integration
// This ensures the application remains functional for demonstration purposes without requiring an API key.

export const analyzeImage = async (
  base64Image: string,
  heuristic: HeuristicDef,
  persona: Persona,
  scope: AuditScope = 'UX',
  wcagLevel: WcagLevel = 'AA'
): Promise<UsabilityReport> => {

  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 2000));

  const isInclusive = scope === 'Inclusive';

  // Generate some random score to make it feel dynamic
  const baseScore = Math.floor(Math.random() * (95 - 65) + 65);

  const mockFindings: Finding[] = [
    {
      id: `${heuristic.id}-1`,
      category: 'UX',
      rule_id: heuristic.id,
      element_name: "Primary Action Button",
      location_box: { ymin: 300, xmin: 300, ymax: 450, xmax: 700 },
      issue_category: "Visibility",
      issue_description: `Potential visibility issue detected relevant to ${heuristic.name}. The element hierarchy might be unclear for ${persona}.`,
      severity: 'Medium',
      reasoning: "The visual weight of the button competes with secondary elements, potentially causing confusion.",
      suggestion: "Increase the contrast of the primary button or reduce the prominence of surrounding elements."
    },
    {
      id: `${heuristic.id}-2`,
      category: 'UX',
      rule_id: heuristic.id,
      element_name: "Navigation Menu",
      location_box: { ymin: 20, xmin: 20, ymax: 80, xmax: 980 },
      issue_category: "Consistency",
      issue_description: "Navigation items may not align with standard patterns expected by users.",
      severity: 'Low',
      reasoning: "Users typically expect the logo on the far left and profile actions on the far right. The current spacing is irregular.",
      suggestion: "Align navigation items using a standard grid system to improve scanability."
    }
  ];

  if (isInclusive) {
    mockFindings.push({
      id: "WCAG-1",
      category: 'WCAG',
      rule_id: "1.4.3",
      element_name: "Body Text / Captions",
      location_box: { ymin: 500, xmin: 100, ymax: 600, xmax: 900 },
      issue_category: "Contrast",
      issue_description: `Text contrast appears insufficient for WCAG 2.2 Level ${wcagLevel} standards.`,
      severity: 'High',
      reasoning: "Grey text on a white background often fails the required contrast ratio (4.5:1), making it difficult for visually impaired users.",
      suggestion: "Darken the text color to #555555 or black to ensure readability."
    });
  }

  // Randomly generate a critical issue occasionally
  if (Math.random() > 0.7) {
    mockFindings.push({
      id: `${heuristic.id}-CRIT`,
      category: 'UX',
      rule_id: heuristic.id,
      element_name: "System Feedback",
      location_box: { ymin: 400, xmin: 400, ymax: 600, xmax: 600 },
      issue_category: "Error Prevention",
      issue_description: "Critical flow blocker detected. Users may not receive confirmation after an action.",
      severity: 'Critical',
      reasoning: "Lack of feedback leaves users guessing if their action was successful, leading to frustration or duplicate submissions.",
      suggestion: "Add a clear success toast or modal confirmation immediately after the action."
    });
  }

  return {
    audit_id: `mock-${Date.now()}`,
    audit_timestamp: new Date().toISOString(),
    heuristic_id: heuristic.id,
    heuristic_name: heuristic.name,
    overall_score: baseScore,
    ...(isInclusive ? { accessibility_score: Math.floor(Math.random() * (90 - 50) + 50) } : {}),
    violation_count: mockFindings.length,
    critical_issues: mockFindings.filter(f => f.severity === 'Critical' || f.severity === 'High').length,
    risk_level: baseScore > 80 ? 'Pass' : baseScore > 60 ? 'Warning' : 'Fail',
    executive_summary: "SIMULATION MODE: The AI analysis API has been removed. This is a generated mock report for demonstration purposes. In a real environment, this would call the Gemini API to analyze the uploaded image.",
    findings: mockFindings
  };
};
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UX Auditor Processor - Replaces Gemini reasoning with local CSV-based logic.
Maps UI elements and their properties to Nielsen's 10 Heuristics using 
the UI/UX Pro Max knowledge base.
"""

import json
import sys
import re
from pathlib import Path
from core import search, DATA_DIR

# Nielsen Heuristic Mapping to CSV Keywords
HEURISTIC_MAP = {
    "H1": {
        "name": "Visibility of system status",
        "keywords": ["loading", "feedback", "progress", "status", "indicator", "confirmation"],
        "csv_domain": "ux"
    },
    "H2": {
        "name": "Match between system and the real world",
        "keywords": ["language", "icons", "mapping", "convention", "metaphor"],
        "csv_domain": "ui-reasoning"
    },
    "H3": {
        "name": "User control and freedom",
        "keywords": ["back", "cancel", "undo", "redo", "skip", "exit"],
        "csv_domain": "ux"
    },
    "H4": {
        "name": "Consistency and standards",
        "keywords": ["consistency", "standard", "pattern", "design system", "platform"],
        "csv_domain": "styles"
    },
    "H5": {
        "name": "Error prevention",
        "keywords": ["error prevention", "confirmation", "validation", "disabled", "required"],
        "csv_domain": "ux"
    },
    "H6": {
        "name": "Recognition rather than recall",
        "keywords": ["recognition", "visible", "menu", "history", "breadcrumbs"],
        "csv_domain": "web"
    },
    "H7": {
        "name": "Flexibility and efficiency of use",
        "keywords": ["shortcut", "accelerator", "bulk", "advanced", "efficiency"],
        "csv_domain": "ux"
    },
    "H8": {
        "name": "Aesthetic and minimalist design",
        "keywords": ["minimalism", "noise", "clutter", "hierarchy", "whitespace"],
        "csv_domain": "styles"
    },
    "H9": {
        "name": "Help users recognize, diagnose, and recover from errors",
        "keywords": ["error message", "recovery", "troubleshoot", "fix"],
        "csv_domain": "ux"
    },
    "H10": {
        "name": "Help and documentation",
        "keywords": ["help", "documentation", "guide", "tutorial", "faq"],
        "csv_domain": "ux"
    }
}

class LocalUXAuditor:
    def __init__(self):
        self.data_dir = DATA_DIR

    def analyze_ui_elements(self, elements, heuristic_id):
        """
        Analyze a list of UI elements against a specific Nielsen Heuristic.
        
        elements: list of dicts {text: str, box: {ymin, xmin, ymax, xmax}, type: str}
        heuristic_id: str (H1-H10)
        """
        heuristic = HEURISTIC_MAP.get(heuristic_id)
        if not heuristic:
            return {"error": f"Unknown heuristic: {heuristic_id}"}

        # 1. Search our local knowledge base for guidelines related to this heuristic
        query = " ".join(heuristic["keywords"])
        guidelines = search(query, domain="ux", max_results=10)["results"]
        guidelines += search(query, domain="web", max_results=5)["results"]
        
        findings = []
        violation_count = 0
        
        # 2. Heuristic-specific logic (simulated reasoning)
        for element in elements:
            element_text = element.get("text", "").lower()
            element_type = element.get("type", "element")
            
            # Example logic for H5: Error Prevention
            if heuristic_id == "H5":
                if "delete" in element_text or "remove" in element_text:
                    # Check if there's a pattern in guidelines for deletion confirmation
                    match = self._find_matching_guideline(guidelines, "confirmation")
                    if match:
                        findings.append({
                            "category": "UX",
                            "rule_id": heuristic_id,
                            "element_name": element.get("text", "Button"),
                            "location_box": element.get("box"),
                            "issue_category": "Error Prevention",
                            "issue_description": f"Destructive action '{element_text}' might lack confirmation.",
                            "severity": "High",
                            "reasoning": "Users may accidentally trigger destructive actions if no confirmation step exists.",
                            "suggestion": match.get("Do", "Add a confirmation dialog.")
                        })
                        violation_count += 1

            # Example logic for H8: Aesthetic and Minimalist Design
            if heuristic_id == "H8":
                if len(element_text) > 200: # Very long text block
                    findings.append({
                        "category": "UX",
                        "rule_id": heuristic_id,
                        "element_name": "Text Block",
                        "location_box": element.get("box"),
                        "issue_category": "Minimalism",
                        "issue_description": "Excessive text content can overwhelm users.",
                        "severity": "Medium",
                        "reasoning": "Minimalist design focuses on essential information.",
                        "suggestion": "Break text into bullet points or use progressive disclosure."
                    })
                    violation_count += 1

            # Check for generic violations found in CSV
            for g in guidelines:
                issue_kw = g.get("Issue", "").lower()
                if issue_kw and issue_kw in element_text:
                    findings.append({
                        "category": "UX",
                        "rule_id": heuristic_id,
                        "element_name": element.get("text", "Element"),
                        "location_box": element.get("box"),
                        "issue_category": g.get("Category", "General"),
                        "issue_description": g.get("Description", ""),
                        "severity": g.get("Severity", "Medium"),
                        "reasoning": f"Element matches known UX issue: {issue_kw}",
                        "suggestion": g.get("Do", "Follow platform standards.")
                    })
                    violation_count += 1
                    break

        # Calculate score
        score = max(0, 100 - (violation_count * 15))
        
        return {
            "overall_score": score,
            "violation_count": violation_count,
            "executive_summary": f"Audit completed for {heuristic['name']}. Found {violation_count} potential issues based on local design guidelines.",
            "findings": findings
        }

    def _find_matching_guideline(self, guidelines, keyword):
        for g in guidelines:
            if keyword in str(g).lower():
                return g
        return None

def main():
    try:
        # Expecting JSON input from stdin
        input_data = json.load(sys.stdin)
        elements = input_data.get("elements", [])
        heuristic_id = input_data.get("heuristic_id", "H1")
        
        auditor = LocalUXAuditor()
        result = auditor.analyze_ui_elements(elements, heuristic_id)
        
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()

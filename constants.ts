import { HeuristicDef } from './types';

export const HEURISTICS: Record<string, HeuristicDef> = {
  "H1": {
    id: "H1",
    name: "Visibility of System Status",
    definition: "The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time.",
    instruction: "AUDIT FOCUS: FEEDBACK & STATE INDICATORS. 1. Scan for interactive elements and current system states. 2. Analyze if it's clear where the user is or if processes have progress trackers. 3. Evaluate and flag issues where system status is ambiguous."
  },
  "H2": {
    id: "H2",
    name: "Match Between System and Real World",
    definition: "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon.",
    instruction: "AUDIT FOCUS: LANGUAGE & METAPHORS. 1. Scan text labels and icons. 2. Analyze for technical jargon or unclear icons. 3. Evaluate and flag jargon or unnatural workflows."
  },
  "H3": {
    id: "H3",
    name: "User Control and Freedom",
    definition: "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action without having to go through an extended process.",
    instruction: "AUDIT FOCUS: EXITS & UNDO. 1. Scan for navigation controls and modals. 2. Analyze for clear exits (X, Cancel) and Undo options. 3. Evaluate and flag traps where users get stuck."
  },
  "H4": {
    id: "H4",
    name: "Consistency and Standards",
    definition: "Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform and industry conventions.",
    instruction: "AUDIT FOCUS: PATTERNS & CONVENTIONS. 1. Scan repeating elements (Buttons, Fonts). 2. Analyze internal consistency and platform conventions. 3. Evaluate and flag elements breaking patterns."
  },
  "H5": {
    id: "H5",
    name: "Error Prevention",
    definition: "Good error messages are important, but the best designs carefully prevent problems from occurring in the first place.",
    instruction: "AUDIT FOCUS: CONSTRAINTS & SAFEGUARDS. 1. Scan inputs and destructive actions. 2. Analyze constraints and confirmation steps. 3. Evaluate and flag error-prone areas."
  },
  "H6": {
    id: "H6",
    name: "Recognition Rather Than Recall",
    definition: "Minimize the user's memory load. Elements, actions, and options should be visible.",
    instruction: "AUDIT FOCUS: VISIBILITY & UNIVERSAL CONVENTIONS. 1. Scan icons and elements. 2. Analyze if icons are universally recognized. 3. Evaluate and flag ambiguous icons requiring memory."
  },
  "H7": {
    id: "H7",
    name: "Flexibility and Efficiency of Use",
    definition: "Shortcuts — hidden from novice users — may speed up the interaction for the expert user so that the design can cater to both inexperienced and experienced users.",
    instruction: "AUDIT FOCUS: SHORTCUTS & CUSTOMIZATION. 1. Scan for accelerators and defaults. 2. Analyze efficiency features. 3. Evaluate lack of shortcuts for complex tasks."
  },
  "H8": {
    id: "H8",
    name: "Aesthetic and Minimalist Design",
    definition: "Interfaces should not contain information which is irrelevant or rarely needed. Every extra unit of information in an interface competes with the relevant units of information.",
    instruction: "AUDIT FOCUS: SIGNAL-TO-NOISE RATIO. 1. Scan layout, whitespace, and colors. 2. Analyze clutter, hierarchy, and alignment. 3. Evaluate visual noise and information density."
  },
  "H9": {
    id: "H9",
    name: "Help Users Recognize, Diagnose, and Recover from Errors",
    definition: "Error messages should be expressed in plain language (no error codes), precisely indicate the problem, and constructively suggest a solution.",
    instruction: "AUDIT FOCUS: ERROR MESSAGES. 1. Scan for error states. 2. Analyze language clarity and recovery suggestions. 3. Evaluate vague or technical error messages."
  },
  "H10": {
    id: "H10",
    name: "Help and Documentation",
    definition: "It’s best if the system doesn’t need any additional explanation. However, it may be necessary to provide documentation to help users understand how to complete their tasks.",
    instruction: "AUDIT FOCUS: SUPPORT & ONBOARDING. 1. Scan for help entry points. 2. Analyze availability and context. 3. Evaluate absence of help mechanisms."
  }
};
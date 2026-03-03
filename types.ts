export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export type IssueCategory = 'UX' | 'WCAG';

export interface Finding {
  id: string;
  category: IssueCategory;
  rule_id: string; // e.g., "H1" or "1.4.3"
  element_name: string;
  location_box: BoundingBox;
  issue_category: string; // "Visibility" or "Contrast"
  issue_description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  reasoning: string;
  suggestion: string;
  heuristic_id?: string; // Legacy support for internal mapping
}

export interface UsabilityReport {
  audit_id: string;
  audit_timestamp: string;
  heuristic_id: string;
  heuristic_name: string;
  overall_score: number;
  accessibility_score?: number; // New field
  violation_count: number;
  critical_issues: number;
  risk_level: 'Pass' | 'Warning' | 'Fail';
  executive_summary: string;
  findings: Finding[];
}

export interface HeuristicDef {
  id: string;
  name: string;
  definition: string;
  instruction: string;
}

export type Persona = 'General Public' | 'Elderly/Novice' | 'Developer/Expert';
export type AuditScope = 'UX' | 'Inclusive';
export type WcagLevel = 'A' | 'AA' | 'AAA';

export interface SavedAudit {
  id: string;
  timestamp: number;
  imageSrc: string; // Base64
  reports: UsabilityReport[];
  heuristicMode: string;
  persona: Persona;
  auditScope: AuditScope;
  wcagLevel: WcagLevel;
}

// --- New Types for Platform Features ---

export interface Assignment {
  id: string;
  professorId: string;
  title: string;
  code: string;
  description: string;
  createdAt: number;
  status: 'active' | 'archived';
}

export interface StudentSubmission {
  id?: string; // Firestore ID
  refCode: string; // UX-XXXX format
  studentName: string;
  studentId: string; // Optional
  assignmentId: string;
  professorId: string;
  timestamp: number;
  auditData: SavedAudit;
}

export interface ClassStats {
  totalSubmissions: number;
  averageScore: number;
  topFailedHeuristics: { name: string; count: number }[];
  submissions: StudentSubmission[];
}

export type InstitutionType = 'University' | 'Company' | 'Freelance' | 'Other';

export interface ProfessorProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  profession: string;
  institutionType: InstitutionType;
  institutionName: string;
  updatedAt: number;
}
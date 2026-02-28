import { SavedAudit, StudentSubmission } from '../types';

const LOCAL_STORAGE_KEY = 'ux_auditor_history_v1';
const MOCK_DB_KEY = 'ux_auditor_central_db_v1'; // Simulates the professor's database

// --- Local Student History (Client Side) ---

export const getSavedAudits = (): SavedAudit[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load audits from storage", e);
    return [];
  }
};

export const saveAudit = (audit: SavedAudit): void => {
  try {
    const current = getSavedAudits();
    const updated = [audit, ...current];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      throw new Error("Storage is full. Please delete some old audits to save new ones.");
    }
    throw e;
  }
};

export const deleteAudit = (id: string): SavedAudit[] => {
  try {
    const current = getSavedAudits();
    const updated = current.filter(a => a.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to delete audit", e);
    return [];
  }
};

// --- Central Database Simulation (Server Side) ---

export const submitAssignment = (
  studentName: string, 
  studentId: string, 
  assignmentId: string, 
  auditData: SavedAudit
): StudentSubmission => {
  
  // Generate Reference Code
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const refCode = `UX-${randomSuffix}`;

  const submission: StudentSubmission = {
    refCode,
    studentName,
    studentId,
    assignmentId,
    timestamp: Date.now(),
    auditData
  };

  try {
    // Get existing DB data
    const dbDataStr = localStorage.getItem(MOCK_DB_KEY);
    const dbData: StudentSubmission[] = dbDataStr ? JSON.parse(dbDataStr) : [];
    
    // Add new submission
    dbData.push(submission);
    
    // Save back to "DB"
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(dbData));
    
    return submission;
  } catch (e) {
    throw new Error("Failed to submit assignment. Server/Storage might be full.");
  }
};

export const getProfessorSubmissions = (): StudentSubmission[] => {
  try {
    const dbDataStr = localStorage.getItem(MOCK_DB_KEY);
    return dbDataStr ? JSON.parse(dbDataStr) : [];
  } catch (e) {
    return [];
  }
};

export const clearAllSubmissions = (): void => {
    localStorage.removeItem(MOCK_DB_KEY);
};
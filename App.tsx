import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Persona, UsabilityReport, SavedAudit, AuditScope, WcagLevel, StudentSubmission } from './types';
import { getSavedAudits, deleteAudit } from './services/storageService';
import { subscribeToAuthChanges } from './services/authService';
import { getSubmissionsByAssignment, getAssignmentById } from './services/firestoreService';
import { User } from 'firebase/auth';

// Page Components
import { LandingPage } from './pages/LandingPage';
import { StudentOnboardingPage } from './pages/StudentOnboardingPage';
import { AuditorPage } from './pages/AuditorPage';
import { SubmissionSuccessPage } from './pages/SubmissionSuccessPage';
import { ProfessorLoginPage } from './pages/ProfessorLoginPage';
import { ProfessorDashboardPage } from './pages/ProfessorDashboardPage';
import { ProfessorAssignmentsPage } from './pages/ProfessorAssignmentsPage';
import { ProfessorProfilePage } from './pages/ProfessorProfilePage';
import { ProfessorSubmissionDetailPage } from './pages/ProfessorSubmissionDetailPage';
import { ProfessorLayout } from './pages/ProfessorLayout';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(() => (localStorage.getItem('ux_auth_mode') as 'login' | 'signup') || 'login');

  // --- Student Session State ---
  const [studentName, setStudentName] = useState(() => localStorage.getItem('ux_student_name') || "");
  const [studentId, setStudentId] = useState(() => localStorage.getItem('ux_student_id') || "");
  const [assignmentCode, setAssignmentCode] = useState(() => localStorage.getItem('ux_assignment_code') || "");
  const [assignmentId, setAssignmentId] = useState(() => localStorage.getItem('ux_assignment_id') || "");
  const [assignmentTitle, setAssignmentTitle] = useState(() => localStorage.getItem('ux_assignment_title') || "");
  const [professorId, setProfessorId] = useState(() => localStorage.getItem('ux_professor_id') || "");
  const [lastSubmission, setLastSubmission] = useState<StudentSubmission | null>(null);

  // --- Auditor State (Shared) ---
  const [selectedImage, setSelectedImage] = useState<string | null>(() => localStorage.getItem('ux_selected_image'));
  const [selectedHeuristic, setSelectedHeuristic] = useState<string>(() => localStorage.getItem('ux_selected_heuristic') || "H8");
  const [selectedPersona, setSelectedPersona] = useState<Persona>(() => (localStorage.getItem('ux_selected_persona') as Persona) || "General Public");
  const [auditScope, setAuditScope] = useState<AuditScope>(() => (localStorage.getItem('ux_audit_scope') as AuditScope) || 'UX');
  const [wcagLevel, setWcagLevel] = useState<WcagLevel>(() => (localStorage.getItem('ux_wcag_level') as WcagLevel) || 'AA');
  const [reports, setReports] = useState<UsabilityReport[]>(() => {
    const saved = localStorage.getItem('ux_reports');
    return saved ? JSON.parse(saved) : [];
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);

  // --- Professor State ---
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [currentProfessorSubmission, setCurrentProfessorSubmission] = useState<StudentSubmission | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Persistence Sync ---
  useEffect(() => {
    localStorage.setItem('ux_auth_mode', authMode);
    localStorage.setItem('ux_student_name', studentName);
    localStorage.setItem('ux_student_id', studentId);
    localStorage.setItem('ux_assignment_code', assignmentCode);
    localStorage.setItem('ux_assignment_id', assignmentId);
    localStorage.setItem('ux_assignment_title', assignmentTitle);
    localStorage.setItem('ux_professor_id', professorId);
    if (selectedImage) localStorage.setItem('ux_selected_image', selectedImage);
    else localStorage.removeItem('ux_selected_image');
    localStorage.setItem('ux_selected_heuristic', selectedHeuristic);
    localStorage.setItem('ux_selected_persona', selectedPersona);
    localStorage.setItem('ux_audit_scope', auditScope);
    localStorage.setItem('ux_wcag_level', wcagLevel);
    localStorage.setItem('ux_reports', JSON.stringify(reports));
  }, [studentName, studentId, assignmentCode, assignmentId, assignmentTitle, professorId, selectedImage, reports, selectedHeuristic, selectedPersona, auditScope, wcagLevel, authMode]);

  useEffect(() => {
    setSavedAudits(getSavedAudits());
    if (user && assignmentId) {
      const loadSubmissions = async () => {
        const subs = await getSubmissionsByAssignment(assignmentId);
        setSubmissions(subs);

        const asg = await getAssignmentById(assignmentId);
        if (asg) {
          setAssignmentTitle(asg.title);
          setAssignmentCode(asg.code);
        }
      };
      loadSubmissions();
    }
  }, [user, assignmentId]);

  const handleLoadAudit = (audit: SavedAudit) => {
    setSelectedImage(audit.imageSrc);
    setReports(audit.reports);
    setSelectedHeuristic(audit.heuristicMode);
    setSelectedPersona(audit.persona);
    setAuditScope(audit.auditScope || 'UX');
    setWcagLevel(audit.wcagLevel || 'AA');
    setIsHistoryOpen(false);
  };

  const handleDeleteAudit = (id: string) => {
    if (window.confirm("Are you sure you want to delete this audit?")) {
      setSavedAudits(deleteAudit(id));
    }
  };

  const handleLoadSubmission = (sub: StudentSubmission) => {
    setCurrentProfessorSubmission(sub);
    navigate('/professor/submission');
  };

  // Reset Password Logic
  const params = new URLSearchParams(location.search);
  const resetCode = params.get('oobCode');
  const isResetPath = params.get('mode') === 'resetPassword' && resetCode;

  if (isResetPath) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <ResetPasswordPage
          oobCode={resetCode}
          onSuccess={() => {
            window.history.replaceState({}, document.title, "/");
            // Navigation would follow
          }}
          onBack={() => {
            window.history.replaceState({}, document.title, "/");
          }}
        />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        <LandingPage
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          savedAudits={savedAudits}
          onLoadAudit={handleLoadAudit}
          onDeleteAudit={handleDeleteAudit}
          setAuthMode={setAuthMode}
        />
      } />

      <Route path="/student/onboarding" element={
        <StudentOnboardingPage
          studentName={studentName}
          setStudentName={setStudentName}
          studentId={studentId}
          setStudentId={setStudentId}
          assignmentCode={assignmentCode}
          setAssignmentCode={setAssignmentCode}
          setAssignmentId={setAssignmentId}
          setAssignmentTitle={setAssignmentTitle}
          setProfessorId={setProfessorId}
        />
      } />

      <Route path="/student/auditor" element={
        <AuditorPage
          studentName={studentName}
          studentId={studentId}
          assignmentId={assignmentId}
          professorId={professorId}
          setLastSubmission={setLastSubmission}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          reports={reports}
          setReports={setReports}
          selectedHeuristic={selectedHeuristic}
          setSelectedHeuristic={setSelectedHeuristic}
          selectedPersona={selectedPersona}
          setSelectedPersona={setSelectedPersona}
          auditScope={auditScope}
          setAuditScope={setAuditScope}
          wcagLevel={wcagLevel}
          setWcagLevel={setWcagLevel}
        />
      } />

      <Route path="/student/success" element={
        <SubmissionSuccessPage
          lastSubmission={lastSubmission}
          studentName={studentName}
          studentId={studentId}
          setReports={setReports}
          setSelectedImage={setSelectedImage}
        />
      } />

      <Route path="/professor/login" element={
        <ProfessorLoginPage authMode={authMode} />
      } />

      <Route path="/professor" element={
        <ProtectedRoute user={user} loading={authLoading}>
          <ProfessorLayout
            user={user}
            assignmentCode={assignmentCode}
            isPresentationOpen={isPresentationOpen}
            setIsPresentationOpen={setIsPresentationOpen}
          />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/professor/dashboard" replace />} />
        <Route path="dashboard" element={
          <ProfessorDashboardPage
            submissions={submissions}
            setSubmissions={setSubmissions}
            assignmentTitle={assignmentTitle}
            assignmentCode={assignmentCode}
            assignmentId={assignmentId}
            handleLoadSubmission={handleLoadSubmission}
            setIsPresentationOpen={setIsPresentationOpen}
          />
        } />
        <Route path="assignments" element={
          <ProfessorAssignmentsPage
            professorId={user?.uid || ""}
            onSelectAssignment={(id) => setAssignmentId(id)}
          />
        } />
        <Route path="profile" element={
          <ProfessorProfilePage user={user} />
        } />
        <Route path="submission" element={
          <ProfessorSubmissionDetailPage submission={currentProfessorSubmission} />
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
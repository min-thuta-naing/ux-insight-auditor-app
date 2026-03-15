import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Persona, UsabilityReport, SavedAudit, AuditScope, WcagLevel, StudentSubmission } from './types';
import { getSavedAudits, deleteAudit } from './services/storageService';
import { subscribeToAuthChanges } from './services/authService';
import { getSubmissionsByAssignment, getAssignmentById, getStudentProfile } from './services/firestoreService';
import { User } from 'firebase/auth';

// Page Components
import { LandingPage } from './pages/LandingPage';
import { StudentJoinPage } from './pages/StudentJoinPage';
import { AuditorPage } from './pages/AuditorPage';
import { SubmissionSuccessPage } from './pages/SubmissionSuccessPage';
import { ProfessorLoginPage } from './pages/ProfessorLoginPage';
import { ProfessorDashboardPage } from './pages/ProfessorDashboardPage';
import { ProfessorAssignmentsPage } from './pages/ProfessorAssignmentsPage';
import { ProfessorProfilePage } from './pages/ProfessorProfilePage';
import { ProfessorSubmissionDetailPage } from './pages/ProfessorSubmissionDetailPage';
import { ProfessorLayout } from './pages/ProfessorLayout';
import { ProfessorLandingPage } from './pages/ProfessorLandingPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { VerifyEmailPage } from './components/VerifyEmailPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StudentSignupPage } from './pages/StudentSignupPage';
import { StudentProfilePage } from './pages/StudentProfilePage';

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
    
    const loadData = async () => {
      if (user) {
        // Try to load student profile if it exists
        const profile = await getStudentProfile(user.uid);
        if (profile) {
          setStudentName(`${profile.firstName} ${profile.lastName}`);
          setStudentId(profile.studentId || "");
        }

        if (assignmentId) {
          const subs = await getSubmissionsByAssignment(assignmentId);
          setSubmissions(subs);

          const asg = await getAssignmentById(assignmentId);
          if (asg) {
            setAssignmentTitle(asg.title);
            setAssignmentCode(asg.code);
          }
        }
      }
    };
    loadData();
  }, [user, assignmentId]);

  const handleLoadAudit = (audit: SavedAudit) => {
    setSelectedImage(audit.imageSrc);
    setReports(audit.reports);
    setSelectedHeuristic(audit.heuristicMode);
    setSelectedPersona(audit.persona);
    setAuditScope(audit.auditScope || 'UX');
    setWcagLevel(audit.wcagLevel || 'AA');
    setIsHistoryOpen(false);
    navigate('/student/auditor');
  };

  const handleDeleteAudit = (id: string) => {
    if (window.confirm("Are you sure you want to delete this audit?")) {
      setSavedAudits(deleteAudit(id));
    }
  };

  const handleLoadSubmission = (sub: StudentSubmission) => {
    setCurrentProfessorSubmission(sub);
    navigate('/instructor-auth-research-2026/portal/submission');
  };

  const params = new URLSearchParams(location.search);
  const oobCode = params.get('oobCode');
  const mode = params.get('mode');

  if (mode === 'resetPassword' && oobCode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <ResetPasswordPage
          oobCode={oobCode}
          onSuccess={() => {
            window.history.replaceState({}, document.title, "/");
          }}
          onBack={() => {
            window.history.replaceState({}, document.title, "/");
          }}
        />
      </div>
    );
  }

  if (mode === 'verifyEmail' && oobCode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <VerifyEmailPage
          oobCode={oobCode}
          onSuccess={() => {
            window.history.replaceState({}, document.title, "/");
            navigate('/instructor-auth-research-2026/login');
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

      <Route path="/student/join" element={
        <ProtectedRoute user={user} loading={authLoading} requiredRole="student">
          <StudentJoinPage
            user={user}
            studentName={studentName}
            setAssignmentId={setAssignmentId}
            setAssignmentTitle={setAssignmentTitle}
            setProfessorId={setProfessorId}
            setSelectedImage={setSelectedImage}
            setReports={setReports}
            setSelectedHeuristic={setSelectedHeuristic}
            setSelectedPersona={setSelectedPersona}
            setAuditScope={setAuditScope}
            setWcagLevel={setWcagLevel}
          />
        </ProtectedRoute>
      } />

      <Route path="/student/auditor/:assignmentId" element={
        <ProtectedRoute user={user} loading={authLoading} requiredRole="student">
          <AuditorPage
            user={user}
            studentName={studentName}
            studentId={studentId}
            assignmentId={assignmentId}
            assignmentTitle={assignmentTitle}
            professorId={professorId}
            setAssignmentId={setAssignmentId}
            setAssignmentTitle={setAssignmentTitle}
            setProfessorId={setProfessorId}
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
        </ProtectedRoute>
      } />


      <Route path="/student/success" element={
        <ProtectedRoute user={user} loading={authLoading} requiredRole="student">
          <SubmissionSuccessPage
            lastSubmission={lastSubmission}
            studentName={studentName}
            studentId={studentId}
            setReports={setReports}
            setSelectedImage={setSelectedImage}
          />
        </ProtectedRoute>
      } />

      <Route path="/instructor-auth-research-2026" element={
        <ProfessorLandingPage />
      } />

      <Route path="/instructor-auth-research-2026/login" element={
        <ProfessorLoginPage authMode={authMode} />
      } />

      <Route path="/student/login" element={
        <StudentLoginPage />
      } />

      <Route path="/student/signup" element={
        <StudentSignupPage />
      } />

      <Route path="/student/profile" element={
        <ProtectedRoute user={user} loading={authLoading} requiredRole="student">
          <StudentProfilePage user={user} />
        </ProtectedRoute>
      } />

      <Route path="/instructor-auth-research-2026/portal" element={
        <ProtectedRoute user={user} loading={authLoading} requiredRole="professor">
          <ProfessorLayout
            user={user}
            assignmentCode={assignmentCode}
            isPresentationOpen={isPresentationOpen}
            setIsPresentationOpen={setIsPresentationOpen}
          />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/instructor-auth-research-2026/portal/dashboard" replace />} />
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
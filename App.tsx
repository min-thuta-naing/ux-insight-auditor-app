import React, { useState, useEffect } from 'react';
import { HEURISTICS } from './constants';
import { HeuristicDef, Persona, UsabilityReport, SavedAudit, AuditScope, WcagLevel, StudentSubmission } from './types';
import { analyzeImage } from './services/geminiService';
import { getSavedAudits, saveAudit, deleteAudit, submitAssignment, getProfessorSubmissions, clearAllSubmissions } from './services/storageService';
import { subscribeToAuthChanges, logout as firebaseLogout } from './services/authService';
import { FindingsList } from './components/FindingsList';
import { ImageViewer } from './components/ImageViewer';
import { HistoryModal } from './components/HistoryModal';
import { AuthForm } from './components/AuthForm';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { Sidebar } from './components/Sidebar';
import { AssignmentManagement } from './components/AssignmentManagement';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie, Legend } from 'recharts';
import { User } from 'firebase/auth';
import { getSubmissionsByAssignment, submitToFirestore, getAssignmentByCode, getAssignmentById } from './services/firestoreService';

// --- View Types ---
type ViewState = 'LANDING' | 'STUDENT_ONBOARDING' | 'AUDITOR' | 'SUBMISSION_SUCCESS' | 'PROF_LOGIN' | 'PROF_DASHBOARD' | 'PROF_ASSIGNMENTS' | 'PROF_PROFILE' | 'RESET_PASSWORD';

const App: React.FC = () => {
  // --- Routing State ---
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'resetPassword' && params.get('oobCode')) {
      return 'RESET_PASSWORD';
    }
    return 'LANDING';
  });
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [resetCode, setResetCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('oobCode');
  });

  // --- Student Session State ---
  const [user, setUser] = useState<User | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [assignmentCode, setAssignmentCode] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [lastSubmission, setLastSubmission] = useState<StudentSubmission | null>(null);

  // --- Auditor State (Shared) ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedHeuristic, setSelectedHeuristic] = useState<string>("H8");
  const [selectedPersona, setSelectedPersona] = useState<Persona>("General Public");
  const [auditScope, setAuditScope] = useState<AuditScope>('UX');
  const [wcagLevel, setWcagLevel] = useState<WcagLevel>('AA');
  const [loading, setLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [reports, setReports] = useState<UsabilityReport[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [showUx, setShowUx] = useState(true);
  const [showWcag, setShowWcag] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);

  // --- Professor State ---
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      if (currentUser && currentView === 'PROF_LOGIN') {
        setCurrentView('PROF_DASHBOARD');
      }
    });
    return () => unsubscribe();
  }, [currentView]);

  useEffect(() => {
    setSavedAudits(getSavedAudits());
    if (currentView === 'PROF_DASHBOARD' && assignmentId) {
      const loadSubmissions = async () => {
        const subs = await getSubmissionsByAssignment(assignmentId);
        setSubmissions(subs);

        // Also fetch assignment details for display
        const asg = await getAssignmentById(assignmentId);
        if (asg) {
          setAssignmentTitle(asg.title);
          setAssignmentCode(asg.code);
        }
      };
      loadSubmissions();
    }
  }, [currentView, assignmentId]);

  // --- Actions ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        setReports([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAudit = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setError(null);
    setReports([]);
    setProgressMessage("");
    setShowUx(true);
    setShowWcag(true);

    try {
      const base64Data = selectedImage.split(',')[1];

      if (selectedHeuristic === "ALL") {
        const keys = Object.keys(HEURISTICS).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
        const newReports: UsabilityReport[] = [];

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const h = HEURISTICS[key];
          setProgressMessage(`Analyzing ${key}: ${h.name} (${i + 1}/${keys.length})...`);

          try {
            const currentScope = (auditScope === 'Inclusive' && i > 0) ? 'UX' : auditScope;
            const result = await analyzeImage(base64Data, h, selectedPersona, currentScope, wcagLevel);
            result.findings = result.findings.map(f => ({
              ...f,
              id: `${key}-${f.id}`,
              heuristic_id: key
            }));
            newReports.push(result);
            setReports([...newReports]);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            console.error(`Error auditing ${key}`, err);
          }
        }
      } else {
        setProgressMessage(`Analyzing ${HEURISTICS[selectedHeuristic].name}...`);
        const heuristic = HEURISTICS[selectedHeuristic];
        const result = await analyzeImage(base64Data, heuristic, selectedPersona, auditScope, wcagLevel);
        result.findings = result.findings.map(f => ({ ...f, heuristic_id: selectedHeuristic }));
        setReports([result]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image");
    } finally {
      setLoading(false);
      setProgressMessage("");
    }
  };

  const handleSaveAudit = () => {
    if (!selectedImage || reports.length === 0) return;
    try {
      const auditData: SavedAudit = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageSrc: selectedImage,
        reports: reports,
        heuristicMode: selectedHeuristic,
        persona: selectedPersona,
        auditScope: auditScope,
        wcagLevel: wcagLevel
      };
      saveAudit(auditData);
      setSavedAudits(getSavedAudits());
      alert("Session saved locally!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save session.");
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedImage || reports.length === 0) return;
    setLoading(true);
    try {
      const auditData: SavedAudit = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageSrc: selectedImage,
        reports: reports,
        heuristicMode: selectedHeuristic,
        persona: selectedPersona,
        auditScope: auditScope,
        wcagLevel: wcagLevel
      };

      // Generate Reference Code (keeping same logic as storageService for simplicity)
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refCode = `UX-${randomSuffix}`;

      const submission = {
        refCode,
        studentName,
        studentId,
        assignmentId,
        professorId,
        timestamp: Date.now(),
        auditData
      };

      const savedSubmission = await submitToFirestore(submission);
      setLastSubmission(savedSubmission as StudentSubmission);
      setCurrentView('SUBMISSION_SUCCESS');

      // Also save locally for history
      saveAudit(auditData);
      setSavedAudits(getSavedAudits());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit assignment.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSubmission = (sub: StudentSubmission) => {
    const audit = sub.auditData;
    setSelectedImage(audit.imageSrc);
    setReports(audit.reports);
    setSelectedHeuristic(audit.heuristicMode);
    setSelectedPersona(audit.persona);
    setAuditScope(audit.auditScope || 'UX');
    setWcagLevel(audit.wcagLevel || 'AA');
    setCurrentView('AUDITOR');
  };

  const handleLoadAudit = (audit: SavedAudit) => {
    setSelectedImage(audit.imageSrc);
    setReports(audit.reports);
    setSelectedHeuristic(audit.heuristicMode);
    setSelectedPersona(audit.persona);
    setAuditScope(audit.auditScope || 'UX');
    setWcagLevel(audit.wcagLevel || 'AA');
    setIsHistoryOpen(false);
    setError(null);
    setCurrentView('AUDITOR');
  };

  const handleDeleteAudit = (id: string) => {
    if (window.confirm("Are you sure you want to delete this audit?")) {
      setSavedAudits(deleteAudit(id));
    }
  };

  // --- Helper Data ---
  const allFindings = reports.flatMap(r => r.findings);
  const visibleFindings = allFindings.filter(f => {
    if (f.category === 'WCAG') return showWcag;
    return showUx;
  });

  const avgUxScore = reports.length > 0
    ? Math.round(reports.reduce((acc, r) => acc + r.overall_score, 0) / reports.length)
    : 0;

  const validAccessScores = reports.filter(r => r.accessibility_score !== undefined && r.accessibility_score !== null);
  const avgAccessScore = validAccessScores.length > 0
    ? Math.round(validAccessScores.reduce((acc, r) => acc + (r.accessibility_score || 0), 0) / validAccessScores.length)
    : null;

  const severityData = [
    { name: 'Critical', count: allFindings.filter(f => f.severity === 'Critical').length, color: '#ef4444' },
    { name: 'High', count: allFindings.filter(f => f.severity === 'High').length, color: '#f97316' },
    { name: 'Medium', count: allFindings.filter(f => f.severity === 'Medium').length, color: '#eab308' },
    { name: 'Low', count: allFindings.filter(f => f.severity === 'Low').length, color: '#3b82f6' },
  ];

  const scoreBreakdownData = reports.map(r => ({
    name: r.heuristic_id,
    score: r.overall_score,
    full_name: r.heuristic_name
  }));

  // --- Views ---

  if (currentView === 'LANDING') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">UX</div>
              <h1 className="text-xl font-bold text-slate-800">Insight Auditor</h1>
            </div>
            <div className="flex gap-4">
              <button onClick={() => { setAuthMode('login'); setCurrentView('PROF_LOGIN'); }} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Login</button>
              <button onClick={() => { setAuthMode('signup'); setCurrentView('PROF_LOGIN'); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm">Sign Up</button>
            </div>
          </div>
        </header>
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <HistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            audits={savedAudits}
            onLoad={handleLoadAudit}
            onDelete={handleDeleteAudit}
          />
          <div className="max-w-4xl w-full text-center space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-2">UX Insight Auditor</h1>
              <p className="text-xl text-slate-600">AI-Powered Heuristic Evaluation Platform</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-indigo-500 transition-all cursor-pointer group" onClick={() => setCurrentView('STUDENT_ONBOARDING')}>
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-600 transition-colors">
                  <svg className="w-8 h-8 text-indigo-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">I am a Student</h2>
                <p className="text-slate-500">Join a session, run audits without login, and submit assignments directly to your professor.</p>
                <button className="mt-6 w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">Start Audit Session</button>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-violet-500 transition-all cursor-pointer group" onClick={() => { setAuthMode('login'); setCurrentView('PROF_LOGIN'); }}>
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-violet-600 transition-colors">
                  <svg className="w-8 h-8 text-violet-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">I am an Instructor</h2>
                <p className="text-slate-500">Manage assignments, view class analytics, and grade student submissions.</p>
                <button className="mt-6 w-full py-2 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700">Enter Instructor Portal</button>
              </div>
            </div>

            {savedAudits.length > 0 && (
              <div className="mt-8">
                <button onClick={() => setIsHistoryOpen(true)} className="text-sm text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-2 mx-auto">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Resume previous session ({savedAudits.length} saved)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'STUDENT_ONBOARDING') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Start Audit Session</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (Optional)</label>
              <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="650XXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assignment Code</label>
              <input
                type="text"
                value={assignmentCode}
                onChange={e => setAssignmentCode(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono tracking-wider"
                placeholder="e.g. 1234-STUDY"
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            <div className="pt-4 flex flex-col gap-3">
              <div className="flex gap-3">
                <button onClick={() => setCurrentView('LANDING')} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Back</button>
                <button
                  onClick={async () => {
                    if (!studentName || !assignmentCode) return;
                    setLoading(true);
                    setError(null);
                    try {
                      const asg = await getAssignmentByCode(assignmentCode);
                      if (asg) {
                        setAssignmentId(asg.id);
                        setAssignmentTitle(asg.title);
                        setProfessorId(asg.professorId);
                        setCurrentView('AUDITOR');
                      } else {
                        setError("Invalid or inactive assignment code.");
                      }
                    } catch (err) {
                      setError("Failed to verify code.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={!studentName || !assignmentCode || loading}
                  className={`flex-1 py-2 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${(!studentName || !assignmentCode || loading) ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {loading ? <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 'Start Auditing'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'SUBMISSION_SUCCESS') {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Submission Received!</h2>
          <p className="text-slate-600 mb-8">Your audit has been successfully submitted to the class dashboard.</p>

          <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 mb-8">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Reference Code</p>
            <p className="text-4xl font-mono font-bold text-indigo-600 tracking-wider">{lastSubmission?.refCode}</p>
            <p className="text-xs text-slate-400 mt-2">Save this code as proof of submission</p>
          </div>

          <div className="flex gap-4">
            <button onClick={() => { setReports([]); setSelectedImage(null); setCurrentView('LANDING'); }} className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Return Home</button>
            <button onClick={() => { setReports([]); setSelectedImage(null); setCurrentView('AUDITOR'); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">New Audit</button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView.startsWith('PROF_')) {
    if (currentView === 'PROF_LOGIN') {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <AuthForm
            onSuccess={() => setCurrentView('PROF_DASHBOARD')}
            onBack={() => setCurrentView('LANDING')}
            initialMode={authMode}
          />
        </div>
      );
    }

    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          onLogout={async () => { await firebaseLogout(); setCurrentView('LANDING'); }}
          userEmail={user?.email}
        />
        <main className="flex-1 overflow-y-auto">
          {currentView === 'PROF_DASHBOARD' && (
            <div className="p-8 space-y-6">
              {/* Professor Dashboard Content */}
              {(() => {
                const totalSubs = submissions.length;
                const avgScore = totalSubs > 0 ? Math.round(submissions.reduce((acc, s) => acc + s.auditData.reports.reduce((rAcc, r) => rAcc + r.overall_score, 0) / s.auditData.reports.length, 0) / totalSubs) : 0;

                const handleExport = () => {
                  const csvContent = "data:text/csv;charset=utf-8,"
                    + "Timestamp,RefCode,StudentName,AssignmentID,Score,RiskLevel\n"
                    + submissions.map(s => {
                      const score = Math.round(s.auditData.reports.reduce((acc, r) => acc + r.overall_score, 0) / s.auditData.reports.length);
                      const risk = s.auditData.reports.some(r => r.risk_level === 'Fail') ? 'Fail' : 'Pass';
                      return `${new Date(s.timestamp).toISOString()},${s.refCode},${s.studentName},${s.assignmentId},${score},${risk}`;
                    }).join("\n");

                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `ux_audit_${assignmentId}_submissions.csv`);
                  document.body.appendChild(link);
                  link.click();
                };

                return (
                  <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">{assignmentTitle || 'Assignment Overview'}</h1>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-mono font-bold border border-indigo-200 uppercase tracking-widest">{assignmentCode}</span>
                      </div>
                      <button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export CSV
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Submissions</h3>
                        <div className="text-4xl font-black text-slate-800 mt-2">{totalSubs}</div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Class Average</h3>
                        <div className={`text-4xl font-black mt-2 ${avgScore >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>{avgScore}%</div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Assignment Code</h3>
                        <div className="text-4xl font-mono font-black text-indigo-600 mt-2">{assignmentCode}</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800">Student Submissions</h3>
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{totalSubs}</span>
                        </div>
                        <button onClick={() => { if (confirm("Clear all data?")) { clearAllSubmissions(); setSubmissions([]); } }} className="text-xs text-red-500 font-bold hover:underline">Reset Data</button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Info</th>
                              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Ref Code</th>
                              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Audit Score</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {submissions.length === 0 ? (
                              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">No submissions for this assignment yet.</td></tr>
                            ) : (
                              submissions.map((sub, idx) => {
                                const score = Math.round(sub.auditData.reports.reduce((acc, r) => acc + r.overall_score, 0) / sub.auditData.reports.length);
                                return (
                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{new Date(sub.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-bold text-slate-900">{sub.studentName}</div>
                                      <div className="text-[10px] text-slate-400 font-mono tracking-tight">{sub.studentId || 'ID Not Provided'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-black font-mono tracking-wider">{sub.refCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-black rounded-lg ${score >= 80 ? 'bg-green-100 text-green-800' : score >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                        {score}%
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                      <button onClick={() => handleLoadSubmission(sub)} className="text-indigo-600 hover:text-indigo-900 font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">Details</button>
                                    </td>
                                  </tr>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {currentView === 'PROF_ASSIGNMENTS' && (
            <AssignmentManagement
              professorId={user?.uid || ""}
              onSelectAssignment={(id) => {
                setAssignmentId(id);
                setCurrentView('PROF_DASHBOARD');
              }}
            />
          )}

          {currentView === 'PROF_PROFILE' && (
            <div className="p-8 max-w-4xl mx-auto w-full">
              <h1 className="text-3xl font-bold text-slate-900 mb-8">Profile Settings</h1>
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-3xl text-white font-bold">
                    {user?.email?.[0].toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{user?.email || 'Professor'}</h2>
                    <p className="text-slate-500">Instructor Account</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">User ID</label>
                    <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 font-mono text-xs text-slate-400">{user?.uid}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                    <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-slate-700">{user?.email}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (currentView === 'RESET_PASSWORD') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        {resetCode ? (
          <ResetPasswordPage
            oobCode={resetCode}
            onSuccess={() => {
              window.history.replaceState({}, document.title, "/");
              setResetCode(null);
              setCurrentView('PROF_LOGIN');
              setAuthMode('login');
            }}
            onBack={() => {
              window.history.replaceState({}, document.title, "/");
              setCurrentView('LANDING');
            }}
          />
        ) : (
          <div className="text-white">Invalid Request</div>
        )}
      </div>
    );
  }

  // --- Main Application View (Auditor) ---
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('LANDING')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">UX</div>
            <h1 className="text-xl font-bold text-slate-800">Insight Auditor</h1>
          </div>
          <div className="flex items-center gap-4">
            {!user && (
              <div className="flex gap-4 border-r border-slate-200 pr-4 mr-2">
                <button onClick={() => { setAuthMode('login'); setCurrentView('PROF_LOGIN'); }} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Login</button>
                <button onClick={() => { setAuthMode('signup'); setCurrentView('PROF_LOGIN'); }} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Sign Up</button>
              </div>
            )}

            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              <span className="text-xs font-bold uppercase tracking-wide">Student</span>
              <span className="text-sm font-medium">{studentName || 'Guest'}</span>
            </div>

            <button onClick={() => setIsHistoryOpen(true)} className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              My History ({savedAudits.length})
            </button>
          </div>
        </div>
      </header>

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        audits={savedAudits}
        onLoad={handleLoadAudit}
        onDelete={handleDeleteAudit}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="col-span-1 md:col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">1. Upload UI Screenshot</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">2. Scope</label>
              <select value={auditScope} onChange={(e) => setAuditScope(e.target.value as AuditScope)} className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-8 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-slate-50 border">
                <option value="UX">UX Only</option>
                <option value="Inclusive">Inclusive (UX + WCAG)</option>
              </select>
            </div>

            {auditScope === 'Inclusive' && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">WCAG Level</label>
                <select value={wcagLevel} onChange={(e) => setWcagLevel(e.target.value as WcagLevel)} className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-8 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-slate-50 border">
                  <option value="A">Level A</option>
                  <option value="AA">Level AA</option>
                  <option value="AAA">Level AAA</option>
                </select>
              </div>
            )}

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Persona</label>
              <select value={selectedPersona} onChange={(e) => setSelectedPersona(e.target.value as Persona)} className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-8 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-slate-50 border">
                <option value="General Public">General Public</option>
                <option value="Elderly/Novice">Elderly / Novice</option>
                <option value="Developer/Expert">Developer / Expert</option>
              </select>
            </div>

            <div className={`col-span-1 ${auditScope === 'Inclusive' ? 'md:col-span-2' : 'md:col-span-4'}`}>
              <label className="block text-sm font-medium text-slate-700 mb-2">3. Heuristic / Rule</label>
              <select value={selectedHeuristic} onChange={(e) => setSelectedHeuristic(e.target.value)} className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-slate-50 border">
                <option value="ALL">✨ Full Audit (H1-H10)</option>
                <option disabled>──────────</option>
                {Object.values(HEURISTICS).map((h) => (
                  <option key={h.id} value={h.id}>{h.id}: {h.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-12 mt-4">
              <button onClick={handleRunAudit} disabled={!selectedImage || loading} className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!selectedImage || loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} transition-colors duration-200`}>
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {progressMessage || 'Auditing...'}
                  </span>
                ) : 'Run Audit'}
              </button>
            </div>
          </div>

          {loading && selectedHeuristic === "ALL" && (
            <div className="mt-4 w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${(reports.length / 10) * 100}%` }}></div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span>
          </div>
        )}

        {selectedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-24">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">Visual Analysis {reports.length > 0 && `(${visibleFindings.length} issues)`}</h2>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={showUx} onChange={e => setShowUx(e.target.checked)} className="sr-only peer" />
                      <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ms-2 text-xs font-medium text-gray-700">UX Issues</span>
                    </label>
                    {auditScope === 'Inclusive' && (
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={showWcag} onChange={e => setShowWcag(e.target.checked)} className="sr-only peer" />
                        <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                        <span className="ms-2 text-xs font-medium text-gray-700">WCAG Issues</span>
                      </label>
                    )}
                  </div>
                </div>

                <ImageViewer
                  imageSrc={selectedImage}
                  findings={visibleFindings}
                  selectedFindingId={selectedFindingId}
                  onSelectFinding={setSelectedFindingId}
                />

                <div className="mt-3 flex gap-4 justify-center text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> UX Issue</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500"></span> WCAG Issue</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {reports.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-500 mb-1">UX Score</h4>
                      <div className={`text-3xl font-bold ${avgUxScore >= 80 ? 'text-green-600' : avgUxScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {avgUxScore}<span className="text-sm text-slate-400 font-normal">/100</span>
                      </div>
                    </div>

                    {auditScope === 'Inclusive' && avgAccessScore !== null && (
                      <div className="text-center p-4 bg-violet-50 rounded-lg border border-violet-100">
                        <h4 className="text-sm font-semibold text-violet-600 mb-1">Accessibility</h4>
                        <div className={`text-3xl font-bold ${avgAccessScore >= 80 ? 'text-green-600' : avgAccessScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {avgAccessScore}<span className="text-sm text-slate-400 font-normal">/100</span>
                        </div>
                        <div className="text-[10px] text-violet-400 mt-1">WCAG 2.2 Level {wcagLevel}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Analysis Report</h3>
                    <div className="flex gap-2">
                      <button onClick={handleSaveAudit} className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-md flex items-center gap-1 shadow-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        Save Draft
                      </button>
                      <button onClick={handleSubmitAssignment} className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md flex items-center gap-1 shadow-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Submit Assignment
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="h-32 w-full">
                      <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Severity Distribution</div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={severityData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 11 }} interval={0} />
                          <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                            {severityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {reports.length > 1 && (
                      <div className="h-48 w-full border-t border-slate-100 pt-4">
                        <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Score by Heuristic</div>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={scoreBreakdownData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-2 border border-slate-200 shadow-lg rounded text-xs">
                                    <p className="font-bold">{label}: {payload[0].payload.full_name}</p>
                                    <p className="text-indigo-600">Score: {payload[0].value}</p>
                                  </div>
                                );
                              }
                              return null;
                            }} />
                            <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Detailed Findings</h3>
                {reports.length > 0 ? (
                  <FindingsList findings={visibleFindings} onSelectFinding={setSelectedFindingId} selectedFindingId={selectedFindingId} />
                ) : (
                  <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                    {loading ? (
                      <div className="flex flex-col items-center gap-2">
                        <span>Analysis in progress...</span>
                        <span className="text-xs">This may take up to a minute for a full audit.</span>
                      </div>
                    ) : 'Run an audit to see findings'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
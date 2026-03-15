import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { getAssignmentByCode, getDrafts, getSubmissionsByStudent, deleteDraft } from '../services/firestoreService';
import { StudentHeader } from '../components/StudentHeader';
import { HistoryModal } from '../components/HistoryModal';
import { SavedAudit, StudentSubmission } from '../types';
import { logout as firebaseLogout } from '../services/authService';

interface StudentJoinPageProps {
    user: User | null;
    studentName: string;
    setAssignmentId: (id: string) => void;
    setAssignmentTitle: (title: string) => void;
    setProfessorId: (id: string) => void;
    // For history loading
    setSelectedImage: (image: string | null) => void;
    setReports: (reports: any[]) => void;
    setSelectedHeuristic: (h: string) => void;
    setSelectedPersona: (p: any) => void;
    setAuditScope: (s: any) => void;
    setWcagLevel: (l: any) => void;
}

export const StudentJoinPage: React.FC<StudentJoinPageProps> = ({
    user,
    studentName,
    setAssignmentId,
    setAssignmentTitle,
    setProfessorId,
    setSelectedImage,
    setReports,
    setSelectedHeuristic,
    setSelectedPersona,
    setAuditScope,
    setWcagLevel
}) => {
    const navigate = useNavigate();
    const [assignmentCode, setAssignmentCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);
    const [submissionHistory, setSubmissionHistory] = useState<StudentSubmission[]>([]);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            if (user) {
                try {
                    const drafts = await getDrafts(user.uid);
                    setSavedAudits(drafts);
                    const submissions = await getSubmissionsByStudent(user.uid);
                    setSubmissionHistory(submissions);
                } catch (err) {
                    console.error("Failed to fetch history:", err);
                }
            }
        };
        fetchHistory();
    }, [user]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignmentCode.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const asg = await getAssignmentByCode(assignmentCode.trim());
            if (asg) {
                setAssignmentId(asg.id);
                setAssignmentTitle(asg.title);
                setProfessorId(asg.professorId);
                navigate(`/student/auditor/${asg.id}`);
            } else {
                setError("Invalid or inactive assignment code. Please check with your instructor.");
            }
        } catch (err) {
            setError("Failed to verify code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLoadAudit = (audit: SavedAudit) => {
        setSelectedImage(audit.imageSrc);
        setReports(audit.reports);
        setSelectedHeuristic(audit.heuristicMode);
        setSelectedPersona(audit.persona);
        setAuditScope(audit.auditScope || 'UX');
        setWcagLevel(audit.wcagLevel || 'AA');
        setIsHistoryOpen(false);
        const targetId = audit.assignmentId;
        console.log("Loading audit from join page. Target ID:", targetId);

        if (targetId) {
            navigate(`/student/auditor/${targetId}`);
        } else {
            console.error("Critical: Audit is missing assignmentId. Cannot navigate.");
            alert("This submission is missing assignment data and cannot be viewed. Please contact support.");
        }
    };

    const handleDeleteAudit = async (id: string) => {
        if (user) {
            try {
                await deleteDraft(id);
                const drafts = await getDrafts(user.uid);
                setSavedAudits(drafts);
            } catch (err) {
                alert("Failed to delete draft.");
            }
        }
    };

    const handleLogout = async () => {
        setIsLogoutConfirmOpen(false);
        navigate('/'); 
        await firebaseLogout();
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <StudentHeader
                user={user}
                studentName={studentName}
                historyCount={savedAudits.length + submissionHistory.length}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onOpenLogout={() => setIsLogoutConfirmOpen(true)}
            />

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                audits={savedAudits}
                submissions={submissionHistory}
                onLoad={handleLoadAudit}
                onDelete={handleDeleteAudit}
            />

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-student-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-student-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Join Assignment</h2>
                        <p className="text-slate-500 mt-2">Enter the code provided by your professor to start auditing.</p>
                    </div>

                    <form onSubmit={handleJoin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Assignment Code</label>
                            <input
                                type="text"
                                required
                                value={assignmentCode}
                                onChange={(e) => setAssignmentCode(e.target.value.toUpperCase())}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-student-500 focus:border-student-500 outline-none transition-all text-center font-mono text-xl tracking-widest uppercase"
                                placeholder="e.g. 1234-ABCD"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-start gap-2 animate-shake">
                                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !assignmentCode.trim()}
                            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                loading || !assignmentCode.trim()
                                    ? 'bg-slate-300 cursor-not-allowed'
                                    : 'bg-student-500 hover:bg-student-600'
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying Code...
                                </span>
                            ) : "Start Auditing"}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            </main>

            {/* Logout Confirmation Modal */}
            {isLogoutConfirmOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsLogoutConfirmOpen(false)} />
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 animate-in zoom-in slide-in-from-bottom-4 duration-300 border border-slate-100">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Logout Confirmation</h3>
                        <p className="text-slate-500 text-center mb-8 font-medium">Are you sure you want to log out of your student account?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsLogoutConfirmOpen(false)}
                                className="w-full py-4 px-6 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full py-4 px-6 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

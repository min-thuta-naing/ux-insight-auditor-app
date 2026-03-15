import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import {
    updateStudentProfile,
    getAssignmentByCode,
    getSubmissionsByStudent,
    getLatestSubmission,
    getDrafts,
    deleteDraft,
    getAssignmentById
} from '../services/firestoreService';
import { useToast } from '../components/Toast';
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
    const [joinMode, setJoinMode] = useState<'new' | 'next'>('new');
    const [assignmentCode, setAssignmentCode] = useState("");
    const [sessionCodeInput, setSessionCodeInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);
    const [submissionHistory, setSubmissionHistory] = useState<StudentSubmission[]>([]);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const { showToast } = useToast();

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

    const proceedToAssignment = useCallback((assignment: any) => {
        setAssignmentId(assignment.id);
        setAssignmentTitle(assignment.title);
        setProfessorId(assignment.professorId);
        navigate(`/student/auditor/${assignment.id}`);
    }, [setAssignmentId, setAssignmentTitle, setProfessorId, navigate]);

    const handleJoinNew = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignmentCode.trim() || !user) return;

        setLoading(true);
        setError(null);
        try {
            const assignment = await getAssignmentByCode(assignmentCode.trim());
            if (!assignment) {
                setError("Invalid assignment code. Please check with your instructor.");
                showToast("Invalid Assignment Code", "error", "Please check the code and try again.");
                return;
            }

            if (assignment.roundStatus === 'closed') {
                const round1Status = (assignment.roundStatuses && assignment.roundStatuses['1']) || assignment.roundStatus;
                if (round1Status === 'closed') {
                    setError("This assignment round is currently closed. Please wait for your instructor to open it.");
                    showToast("Round Closed", "error", "The instructor hasn't opened this round for submissions yet.");
                    return;
                }
            }

            // Check if student already started this assignment
            const latestSub = await getLatestSubmission(user.uid, assignment.id);
            if (latestSub) {
                showToast("Assignment already started", "info", "Use 'Continue Next Round' and your session code to progress.");
                setJoinMode('next');
                return;
            }

            proceedToAssignment(assignment);

        } catch (err) {
            showToast("Failed to join assignment", "error", "Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinNext = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionCodeInput.trim() || !user) return;

        setLoading(true);
        setError(null);
        try {
            // Find the submission with this session code
            const submissions = await getSubmissionsByStudent(user.uid);
            const subToContinue = submissions.find(s => s.sessionCode === sessionCodeInput.trim());

            if (!subToContinue) {
                setError("Invalid session code. Please enter the code from your previous submission.");
                showToast("Invalid Session Code", "error", "We couldn't find a submission with that code.");
                return;
            }

            const assignmentCodeToFetch = subToContinue.assignmentId;
            const fullAssignment = await getAssignmentById(assignmentCodeToFetch);

            if (!fullAssignment) {
                setError("Associated assignment not found.");
                return;
            }

            const currentRound = subToContinue.roundNumber + 1;
            const maxRounds = fullAssignment.roundsCount || 1;

            if (currentRound > maxRounds) {
                showToast("Assignment Completed", "info", "You have already submitted all available rounds for this assignment.");
                return;
            }

            const roundStatus = (fullAssignment.roundStatuses && fullAssignment.roundStatuses[currentRound.toString()]) || (currentRound === fullAssignment.currentRound ? fullAssignment.roundStatus : 'closed');

            if (roundStatus === 'closed') {
                setError(`Round ${currentRound} is currently closed. Please wait for your instructor to open it.`);
                showToast("Round Closed", "error", `The instructor hasn't opened Round ${currentRound} yet.`);
                return;
            }

            proceedToAssignment(fullAssignment);

        } catch (err) {
            showToast("Verification Failed", "error", "Please try again later.");
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
        <div className="h-screen flex flex-col bg-[#F9F8F6] overflow-hidden">
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

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-[calc(100vh-64px)] overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 h-full">
                    {/* Left Panel: Audit History (Independent Scroll) */}
                    <div className="lg:col-span-7 space-y-12 h-full overflow-y-auto pr-6 pt-12 pb-12 custom-scrollbar bg-[#F9F8F6]">
                        {/* Drafts Section */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <svg className="w-7 h-7 text-[#D97D55]/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Audit Drafts
                                </h3>
                                {savedAudits.length > 3 && (
                                    <button onClick={() => setIsHistoryOpen(true)} className="text-sm font-bold text-student-600 hover:text-student-700">view more</button>
                                )}
                            </div>
                            
                            {savedAudits.length === 0 ? (
                                <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-[#D4C9BE] text-center text-slate-600">
                                    <p>Saved drafts will appear here</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {savedAudits.slice(0, 3).map((audit) => (
                                        <div 
                                            key={audit.id} 
                                            className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#8C5A3C] flex gap-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group min-h-[160px]"
                                        >
                                            <div className="w-32 h-32 bg-slate-50 rounded-2xl overflow-hidden border border-[#D4C9BE]/20 flex-shrink-0">
                                                <img src={audit.imageSrc} alt="Audit" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="flex-1 flex flex-col pt-1">
                                                <h4 className="text-xl font-bold text-slate-900 group-hover:text-student-600 transition-colors uppercase tracking-tight leading-tight mb-2">
                                                    {audit.heuristicMode === 'ALL' ? 'Full Heuristic Audit' : `${audit.heuristicMode} Audit`}
                                                </h4>
                                                
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Persona</span>
                                                    <span className="text-xs font-bold text-slate-600 italic">{audit.persona}</span>
                                                </div>

                                                <div className="mt-auto">
                                                    <button 
                                                        onClick={() => handleLoadAudit(audit)}
                                                        className="text-sm font-black text-student-600 flex items-center gap-1 hover:gap-2 transition-all"
                                                    >
                                                        RESUME AUDIT <span className="text-lg">→</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="pt-1 flex flex-col items-end">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                    {new Date(audit.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Submissions Section */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <svg className="w-7 h-7 text-[#618264]/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Submitted Audits
                                </h3>
                                {submissionHistory.length > 3 && (
                                    <button onClick={() => { setIsHistoryOpen(true); /* Logic to switch tab would be nice but HistoryModal handles its own state */ }} className="text-sm font-bold text-student-600 hover:text-student-700">view more</button>
                                )}
                            </div>
                            
                            {submissionHistory.length === 0 ? (
                                <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-[#D4C9BE] text-center text-slate-600">
                                    <p>Completed audits will appear here</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {submissionHistory.slice(0, 3).map((sub) => {
                                        const avgScore = Math.round(sub.auditData.reports.reduce((acc, r) => acc + r.overall_score, 0) / sub.auditData.reports.length);
                                        return (
                                            <div 
                                                key={sub.id} 
                                                className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#8C5A3C] flex gap-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group min-h-[160px]"
                                            >
                                                <div className="w-32 h-32 bg-slate-50 rounded-2xl overflow-hidden border border-[#D4C9BE]/20 flex-shrink-0">
                                                    <img src={sub.auditData.imageSrc} alt="Audit" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="flex-1 flex flex-col pt-1">
                                                    <div className="flex items-center mb-2">
                                                        <span className="px-2 py-0.5 bg-[#D0E7D2] text-[#618264] text-[10px] font-black uppercase rounded-full border border-[#618264]/20">SUBMITTED</span>
                                                    </div>
                                                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-student-600 transition-colors uppercase tracking-tight leading-tight mb-2">
                                                        {sub.auditData.heuristicMode === 'ALL' ? 'Full Heuristic Audit' : `${sub.auditData.heuristicMode} Audit`}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref</span>
                                                        <span className="text-xs font-mono font-bold text-slate-700">{sub.refCode}</span>
                                                    </div>

                                                    <div className="mt-auto">
                                                        <button 
                                                            onClick={() => handleLoadAudit({ ...sub.auditData, assignmentId: sub.assignmentId })}
                                                            className="text-sm font-black text-student-600 hover:text-slate-900 transition-colors flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-tighter"
                                                        >
                                                            VIEW DETAILS <span className="text-lg">→</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="pt-1 flex flex-col items-end justify-between border-l border-slate-100/50 pl-4">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                        {new Date(sub.timestamp).toLocaleDateString()}
                                                    </span>
                                                    <div className="flex flex-col items-end">
                                                        <div className="text-4xl font-black text-student-600 leading-none">{avgScore}</div>
                                                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">SCORE</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Panel: Access Assignment (Centered vertically) */}
                    <div className="w-full lg:col-span-5 flex-shrink-0 flex flex-col justify-center h-full py-12">
                        <style dangerouslySetInnerHTML={{ __html: `
                            .custom-scrollbar::-webkit-scrollbar { width: 0px; display: none; }
                            .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                        `}} />
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-[#8C5A3C] animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center mb-8">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300 ${joinMode === 'new' ? 'bg-student-100 text-student-600' : 'bg-student-100 text-student-600'}`}>
                                    {joinMode === 'new' ? (
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    ) : (
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 text-nowrap">Check Your UX Here!</h2>
                                <p className="text-slate-500 mt-2 text-sm">Join a new audit board or continue your progress.</p>
                            </div>

                            {/* Mode Toggle */}
                            <div className="flex p-1 bg-slate-100 rounded-3xl mb-8">
                                <button
                                    onClick={() => { setJoinMode('new'); setError(null); }}
                                    className={`flex-1 py-3 rounded-3xl text-sm font-bold transition-all ${joinMode === 'new' ? 'bg-white border border-[#8C5A3C] text-student-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    New Assignment
                                </button>
                                <button
                                    onClick={() => { setJoinMode('next'); setError(null); }}
                                    className={`flex-1 py-3 rounded-3xl text-sm font-bold transition-all ${joinMode === 'next' ? 'bg-white border border-[#8C5A3C] text-student-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Next Round
                                </button>
                            </div>

                            <form onSubmit={joinMode === 'new' ? handleJoinNew : handleJoinNext} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 tracking-widest mb-3">
                                        {joinMode === 'new' ? 'Enter Assignment Code' : 'Enter Previous Round Session Key'}
                                    </label>
                                    {joinMode === 'new' ? (
                                        <input
                                            type="text"
                                            required
                                            value={assignmentCode}
                                            onChange={(e) => setAssignmentCode(e.target.value.toUpperCase())}
                                            className="w-full px-4 py-4 bg-slate-50 border-2 border-[#D4C9BE] rounded-xl focus:ring-4 focus:ring-student-500/10 focus:border-student-500 outline-none transition-all text-center font-mono text-2xl tracking-widest uppercase placeholder:text-slate-300"
                                            placeholder="0000-WORD"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={sessionCodeInput}
                                            onChange={(e) => setSessionCodeInput(e.target.value)}
                                            className="w-full px-4 py-4 bg-slate-50 border-2 border-[#D4C9BE] rounded-xl focus:ring-4 focus:ring-student-500/10 focus:border-student-500 outline-none transition-all text-center font-mono text-2xl tracking-widest placeholder:text-slate-300"
                                            placeholder="******"
                                        />
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-[#D4C9BE] rounded-xl text-sm text-red-600 flex items-start gap-3 animate-shake">
                                        <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || (joinMode === 'new' ? !assignmentCode.trim() : sessionCodeInput.length < 6)}
                                    className={`w-full py-4 rounded-lg text-white font-black text-lg shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                        loading || (joinMode === 'new' ? !assignmentCode.trim() : sessionCodeInput.length < 6)
                                            ? 'bg-slate-200 cursor-not-allowed shadow-none'
                                            : joinMode === 'new' 
                                                ? 'bg-student-600 hover:bg-student-700 shadow-student-200' 
                                                : 'bg-student-600 hover:bg-student-700 shadow-student-200'
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {joinMode === 'new' ? 'Verifying...' : 'Checking...'}
                                        </span>
                                    ) : (
                                        joinMode === 'new' ? 'Join Assignment' : 'Continue Next Round'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            {/* Logout Confirmation Modal */}
            {isLogoutConfirmOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsLogoutConfirmOpen(false)} />
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl relative z-10 animate-in zoom-in slide-in-from-bottom-4 duration-300 border border-[#D4C9BE]">
                        <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Logout Confirmation</h3>
                        <p className="text-slate-500 text-center mb-8 font-medium">Are you sure you want to log out of your student account?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsLogoutConfirmOpen(false)}
                                className="w-full py-4 px-6 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all border border-[#D4C9BE]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full py-4 px-6 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
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

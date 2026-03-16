import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from 'firebase/auth';
import { HEURISTICS } from '../constants';
import { HeuristicDef, Persona, UsabilityReport, SavedAudit, AuditScope, WcagLevel, StudentSubmission, ViolationCounts, SeverityCounts } from '../types';
import { logout as firebaseLogout } from '../services/authService';
import { analyzeImage } from '../services/geminiService';
import { 
    submitToFirestore, 
    saveDraft, 
    getDrafts, 
    deleteDraft, 
    getSubmissionsByStudent,
    getAssignmentById,
    getLatestSubmission
} from '../services/firestoreService';
import { useToast } from '../components/Toast';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { FindingsList } from '../components/FindingsList';
import { ImageViewer } from '../components/ImageViewer';
import { HistoryModal } from '../components/HistoryModal';
import { StudentHeader } from '../components/StudentHeader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface StudentSubmissionDetailPageProps {
    user: User | null;
    studentName: string;
    studentId: string;
    assignmentId: string;
    assignmentTitle: string;
    professorId: string;
    setAssignmentId: (id: string) => void;
    setAssignmentTitle: (title: string) => void;
    setProfessorId: (id: string) => void;
    setLastSubmission: (submission: StudentSubmission) => void;
    // Shared state that was in App.tsx
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    reports: UsabilityReport[];
    setReports: (reports: UsabilityReport[]) => void;
    selectedHeuristic: string;
    setSelectedHeuristic: (h: string) => void;
    selectedPersona: Persona;
    setSelectedPersona: (p: Persona) => void;
    auditScope: AuditScope;
    setAuditScope: (s: AuditScope) => void;
    wcagLevel: WcagLevel;
    setWcagLevel: (l: WcagLevel) => void;
}

export const StudentSubmissionDetailPage: React.FC<StudentSubmissionDetailPageProps> = ({
    user,
    studentName,
    studentId,
    assignmentId,
    professorId,
    setAssignmentId,
    setAssignmentTitle,
    setProfessorId,
    setLastSubmission,
    selectedImage,
    setSelectedImage,
    reports,
    setReports,
    selectedHeuristic,
    setSelectedHeuristic,
    selectedPersona,
    setSelectedPersona,
    auditScope,
    setAuditScope,
    wcagLevel,
    setWcagLevel
}) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState<boolean>(false);
    const [progressMessage, setProgressMessage] = useState<string>("");
    const [selectedFindingId, setSelectedFindingId] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const [showUx, setShowUx] = useState(true);
    const [showWcag, setShowWcag] = useState(true);
    const [showAllIssues, setShowAllIssues] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);
    const [submissionHistory, setSubmissionHistory] = useState<StudentSubmission[]>([]);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [roundNumber, setRoundNumber] = useState(1);
    const [roundsCount, setRoundsCount] = useState(1);
    const [assignmentStatus, setAssignmentStatus] = useState<'open' | 'closed'>('open');
    const [profCurrentRound, setProfCurrentRound] = useState(1);

    const { assignmentId: urlAssignmentId } = useParams<{ assignmentId: string }>();

    useEffect(() => {
        const checkAssignment = async () => {
            if (!urlAssignmentId) {
                console.log("No URL assignment ID, redirecting to join");
                navigate('/student/join');
                return;
            }

            if (assignmentId === urlAssignmentId) return;

            try {
                const asg = await getAssignmentById(urlAssignmentId);
                if (asg) {
                    setAssignmentId(asg.id);
                    setAssignmentTitle(asg.title);
                    setProfessorId(asg.professorId);
                    setRoundsCount(asg.roundsCount || 1);
                    setAssignmentStatus(asg.roundStatus || 'open');
                    setProfCurrentRound(asg.currentRound || 1);
                } else {
                    navigate('/student/join');
                }
            } catch (err) {
                console.error("Failed to fetch assignment details:", err);
                navigate('/student/join');
            }
        };

        checkAssignment();
    }, [urlAssignmentId, navigate, setAssignmentId, setAssignmentTitle, setProfessorId]);

    useEffect(() => {
        const detectRound = async () => {
            if (user && assignmentId) {
                try {
                    const asg = await getAssignmentById(assignmentId);
                    if (asg) {
                        setRoundsCount(asg.roundsCount || 1);
                        setProfCurrentRound(asg.currentRound || 1);
                        
                        const latest = await getLatestSubmission(user.uid, assignmentId);
                        const detected = latest ? latest.roundNumber + 1 : 1;
                        setRoundNumber(detected);
                        
                        // Set status based on specific round number
                        const specificStatus = (asg.roundStatuses && asg.roundStatuses[detected.toString()]) || 
                                             (detected === asg.currentRound ? asg.roundStatus : 'closed');
                        setAssignmentStatus(specificStatus);
                    }
                } catch (err) {
                    console.error("Failed to detect round:", err);
                }
            }
        };
        detectRound();
    }, [user, assignmentId]);

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

    const handleLoadAudit = (audit: SavedAudit) => {
        setSelectedImage(audit.imageSrc);
        setReports(audit.reports);
        setSelectedHeuristic(audit.heuristicMode);
        setSelectedPersona(audit.persona);
        setAuditScope(audit.auditScope || 'UX');
        setWcagLevel(audit.wcagLevel || 'AA');
        setIsHistoryOpen(false);
        
        const targetAssignmentId = audit.assignmentId || urlAssignmentId || assignmentId;
        console.log("Loading audit. Audit ID:", audit.id, "Target Assignment ID:", targetAssignmentId);

        // If loading a draft for a different assignment, navigate to its URL
        if (targetAssignmentId && targetAssignmentId !== urlAssignmentId) {
            console.log("Navigating to assignment:", targetAssignmentId);
            navigate(`/student/auditor/${targetAssignmentId}`);
        }
        setError(null);
        // Reset filters to ensure findings are visible
        setShowUx(true);
        setShowWcag(true);
        setShowAllIssues(true);
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

    const handleSelectFinding = (id: string) => {
        setSelectedFindingId(prev => prev === id ? undefined : id);
    };
    
    const handleLogout = async () => {
        setIsLogoutConfirmOpen(false);
        navigate('/'); 
        await firebaseLogout();
    };

    // --- Helper Data ---
    const allFindings = reports.flatMap(r => r.findings);
    const visibleFindings = allFindings.filter(f => {
        const matchesScope = f.category === 'WCAG' ? showWcag : showUx;
        const matchesSeverity = showAllIssues || f.severity === 'High' || f.severity === 'Critical';
        return matchesScope && matchesSeverity;
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

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F8F6]">
            <StudentHeader
                user={user}
                studentName={studentName}
                studentId={studentId}
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
                studentName={studentName}
                studentId={studentId}
            />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-3xl shadow-sm border border-[#D4C9BE] p-6 mb-8">
                    <div className="mt-2 flex flex-wrap items-center justify-between py-5 px-10 bg-slate-50/50 rounded-2xl border border-slate-100/80">
                        {/* Round Indicator */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100/50 border border-indigo-100/50">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Current Round</p>
                                <p className="text-sm font-bold text-indigo-900 leading-none">
                                    {roundNumber > profCurrentRound ? `Waiting for Round ${roundNumber}` : `Round ${roundNumber} of ${roundsCount}`}
                                </p>
                            </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border ${assignmentStatus === 'open' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100/50 border-emerald-100/50' : 'bg-rose-50 text-rose-600 shadow-rose-100/50 border-rose-100/50'}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    {assignmentStatus === 'open' 
                                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 00-2.25 2.25z" />
                                        : <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    }
                                </svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Round Status</p>
                                <p className={`text-sm font-bold leading-none ${assignmentStatus === 'open' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {assignmentStatus === 'open' ? 'Submissions Open' : 'Submissions Closed'}
                                </p>
                            </div>
                        </div>

                        {/* Verification Indicator */}
                        {roundNumber > 1 && (
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 shadow-sm shadow-violet-100/50 border border-violet-100/50">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Verification</p>
                                    <p className="text-sm font-bold text-violet-900 leading-none">Session Secured</p>
                                </div>
                            </div>
                        )}
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
                            <div className="bg-white rounded-3xl shadow-sm border border-[#D4C9BE] p-4 sticky top-24">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-slate-800">Visual Analysis {reports.length > 0 && `(${visibleFindings.length} issues)`}</h2>
                                    <div className="flex gap-4">
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={showAllIssues} onChange={e => setShowAllIssues(e.target.checked)} className="sr-only peer" />
                                            <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                            <span className="ms-2 text-[10px] font-bold text-gray-700 uppercase tracking-tight">Show All Issues</span>
                                        </label>
                                        <div className="w-[1px] h-4 bg-gray-200 mx-1 self-center"></div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={showUx} onChange={e => setShowUx(e.target.checked)} className="sr-only peer" />
                                            <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                            <span className="ms-2 text-[10px] font-bold text-gray-700 uppercase tracking-tight">UX Issues</span>
                                        </label>
                                        {auditScope === 'Inclusive' && (
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={showWcag} onChange={e => setShowWcag(e.target.checked)} className="sr-only peer" />
                                                <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                                                <span className="ms-2 text-[10px] font-bold text-gray-700 uppercase tracking-tight">WCAG Issues</span>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <ImageViewer
                                    imageSrc={selectedImage}
                                    findings={visibleFindings}
                                    selectedFindingId={selectedFindingId}
                                    onSelectFinding={handleSelectFinding}
                                />

                                <div className="mt-3 flex gap-4 justify-center text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> UX Issue</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500"></span> WCAG Issue</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 space-y-6">
                            {reports.length > 0 && (
                                <div className="bg-white rounded-3xl shadow-sm border border-[#D4C9BE] p-6">
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

                            <div className="bg-white rounded-3xl shadow-sm border border-[#D4C9BE] p-6 flex-1">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Detailed Findings</h3>
                                {reports.length > 0 ? (
                                    <FindingsList findings={visibleFindings} onSelectFinding={handleSelectFinding} selectedFindingId={selectedFindingId} />
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

            {/* Logout Confirmation Modal */}
            {isLogoutConfirmOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsLogoutConfirmOpen(false)} />
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 animate-in zoom-in slide-in-from-bottom-4 duration-300 border border-[#D4C9BE]">
                        <div className="w-16 h-16 bg-[#F6ECF0] rounded-full border border-[#AF3E3E]/50 flex items-center justify-center mb-6 mx-auto">
                            <svg className="w-8 h-8 text-[#AF3E3E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Logout Confirmation</h3>
                        <p className="text-slate-500 text-center mb-8 font-medium">Are you sure you want to log out of your student account?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsLogoutConfirmOpen(false)}
                                className="w-full py-3 px-6 bg-white text-slate-600 font-bold rounded-3xl hover:bg-slate-50 transition-all border border-[#AF3E3E]/50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 px-6 bg-[#F6ECF0] text-slate-600 font-bold rounded-3xl hover:bg-[#AF3E3E]/90 hover:text-white transition-all border border-[#AF3E3E]/50"
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

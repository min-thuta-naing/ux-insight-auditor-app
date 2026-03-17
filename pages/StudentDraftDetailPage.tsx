import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';
import { HEURISTICS } from '../constants';
import { HeuristicDef, Persona, UsabilityReport, SavedAudit, AuditScope, WcagLevel, StudentSubmission, ViolationCounts, SeverityCounts } from '../types';
import { getDrafts, getAssignmentById, getLatestSubmission } from '../services/firestoreService';
import { FindingsList } from '../components/FindingsList';
import { ImageViewer } from '../components/ImageViewer';
import { StudentHeader } from '../components/StudentHeader';
import { HistoryModal } from '../components/HistoryModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { useToast } from '../components/Toast';

export const StudentDraftDetailPage: React.FC<{ user: User | null; studentName: string; studentId: string }> = ({
    user,
    studentName,
    studentId
}) => {
    const navigate = useNavigate();
    const { draftId } = useParams<{ draftId: string }>();
    const { showToast } = useToast();
    const [draft, setDraft] = useState<SavedAudit | null>(null);
    const [loading, setLoading] = useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);
    const [submissionHistory, setSubmissionHistory] = useState<StudentSubmission[]>([]);
    const [assignment, setAssignment] = useState<any>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [selectedFindingId, setSelectedFindingId] = useState<string | undefined>(undefined);

    useEffect(() => {
        const loadDraft = async () => {
            if (!user || !draftId) return;
            try {
                const drafts = await getDrafts(user.uid);
                const found = drafts.find(d => d.id === draftId);
                if (found) {
                    setDraft(found);
                    
                    // Load assignment to check status
                    const asg = await getAssignmentById(found.assignmentId);
                    setAssignment(asg);

                    // Check if already submitted this round
                    if (asg && found.roundNumber) {
                        const latest = await getLatestSubmission(user.uid, asg.id);
                        if (latest && latest.roundNumber >= found.roundNumber) {
                            setIsReadOnly(true);
                        }
                    } else if (asg && !found.roundNumber) {
                        // Legacy drafts without roundNumber - compare with current assignment round
                        const latest = await getLatestSubmission(user.uid, asg.id);
                        if (latest) {
                             setIsReadOnly(true); // If any submission exists, assume legacy draft is from past
                        }
                    }
                } else {
                    showToast("Draft not found", "error");
                    navigate('/student/join');
                }
            } catch (err) {
                console.error("Failed to load draft:", err);
            } finally {
                setLoading(false);
            }
        };
        loadDraft();
    }, [user, draftId, navigate]);

    if (loading || !draft) {
        return <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6]">Loading draft...</div>;
    }

    const reports = draft.reports;
    const allFindings = reports.flatMap(r => r.findings);
    const avgUxScore = reports.length > 0
        ? Math.round(reports.reduce((acc, r) => acc + r.overall_score, 0) / reports.length)
        : 0;

    const severityData = [
        { name: 'Critical', count: allFindings.filter(f => f.severity === 'Critical').length, color: '#ef4444' },
        { name: 'High', count: allFindings.filter(f => f.severity === 'High').length, color: '#f97316' },
        { name: 'Medium', count: allFindings.filter(f => f.severity === 'Medium').length, color: '#eab308' },
        { name: 'Low', count: allFindings.filter(f => f.severity === 'Low').length, color: '#3b82f6' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F8F6]">
            <StudentHeader
                user={user}
                studentName={studentName}
                studentId={studentId}
                historyCount={0} // Simplified
                onOpenHistory={() => navigate('/student/join')}
                onOpenLogout={() => navigate('/')}
            />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
                <div className="bg-white rounded-3xl shadow-sm border border-[#D4C9BE] p-6 mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Historical Draft: {assignment?.title || 'Draft'}</h1>
                            <p className="text-sm text-slate-500">Round {draft.roundNumber || 'Unknown'} • Saved on {new Date(draft.timestamp).toLocaleString()}</p>
                        </div>
                        {isReadOnly && (
                            <div className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-semibold flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                READ ONLY: Round {draft.roundNumber} already submitted
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-3xl shadow-sm border border-[#D4C9BE] p-6 text-center flex flex-col justify-center min-h-[160px]">
                        <h4 className="text-sm font-semibold text-slate-500 mb-1">Draft Score</h4>
                        <div className={`text-5xl font-bold ${avgUxScore >= 80 ? 'text-green-600' : avgUxScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {avgUxScore}<span className="text-xl text-slate-400 font-normal">/100</span>
                        </div>
                    </div>

                    {!isReadOnly ? (
                        <div className="bg-student-50 border border-student-200 p-6 rounded-3xl text-center flex flex-col justify-center min-h-[160px]">
                            <p className="text-student-800 font-semibold mb-4 text-sm">This draft is not yet submitted. You can continue working on it in the Auditor.</p>
                            <button 
                                onClick={() => navigate(`/student/auditor/${draft.assignmentId}`)}
                                className="w-full py-3 bg-student-600 text-white rounded-2xl font-bold hover:bg-student-700 transition-colors"
                            >
                                Continue in Auditor
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl text-center flex flex-col justify-center min-h-[160px]">
                            <p className="text-slate-600 font-medium mb-2 text-sm">Assignment is already submitted. This draft is now read-only.</p>
                            <button disabled className="w-full py-3 bg-slate-200 text-slate-400 rounded-2xl font-bold cursor-not-allowed text-sm">Continue in Auditor (Disabled)</button>
                            {/* <div className="grid grid-cols-2 gap-3">
                                <button disabled className="w-full py-3 bg-slate-200 text-slate-400 rounded-2xl font-bold cursor-not-allowed text-sm">Run Audit (Disabled)</button>
                                <button disabled className="w-full py-3 bg-slate-200 text-slate-400 rounded-2xl font-bold cursor-not-allowed text-sm">Submit Assignment (Disabled)</button>
                            </div> */}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-3xl shadow-sm border border-[#D4C9BE] p-4">
                            <ImageViewer
                                imageSrc={draft.imageSrc}
                                findings={allFindings}
                                selectedFindingId={selectedFindingId}
                                onSelectFinding={setSelectedFindingId}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-6">

                        <div className="bg-white rounded-3xl shadow-sm border border-[#D4C9BE] p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Severity Distribution</h3>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={severityData} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                            {severityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-[#D4C9BE] p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Draft Findings</h3>
                            <FindingsList 
                                findings={allFindings} 
                                onSelectFinding={setSelectedFindingId} 
                                selectedFindingId={selectedFindingId} 
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

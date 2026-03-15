import React from 'react';
import { StudentSubmission, Assignment } from '../types';
import { clearAllSubmissions } from '../services/storageService';
import { getAssignmentById, updateRoundStatus, addNewRound } from '../services/firestoreService';
import { useToast } from '../components/Toast';

interface ProfessorDashboardPageProps {
    submissions: StudentSubmission[];
    setSubmissions: (subs: StudentSubmission[]) => void;
    assignmentTitle: string;
    assignmentCode: string;
    assignmentId: string;
    handleLoadSubmission: (sub: StudentSubmission) => void;
    setIsPresentationOpen: (open: boolean) => void;
}

export const ProfessorDashboardPage: React.FC<ProfessorDashboardPageProps> = ({
    submissions,
    setSubmissions,
    assignmentTitle,
    assignmentCode,
    assignmentId,
    handleLoadSubmission,
    setIsPresentationOpen
}) => {
    const { showToast } = useToast();
    const [assignment, setAssignment] = React.useState<Assignment | null>(null);
    const [updating, setUpdating] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState(1);

    React.useEffect(() => {
        const fetchAssignment = async () => {
            if (assignmentId) {
                const asg = await getAssignmentById(assignmentId);
                setAssignment(asg);
            }
        };
        fetchAssignment();
    }, [assignmentId]);

    const handleToggleStatus = async (rNum: number) => {
        if (!assignment) return;
        setUpdating(true);
        try {
            const currentStatus = (assignment.roundStatuses && assignment.roundStatuses[rNum.toString()]) || (rNum === assignment.currentRound ? assignment.roundStatus : 'closed');
            const newStatus = currentStatus === 'open' ? 'closed' : 'open';
            await updateRoundStatus(assignmentId, rNum, newStatus);
            
            // Local update for immediate feedback
            const updatedStatuses = { ...(assignment.roundStatuses || {}) };
            updatedStatuses[rNum.toString()] = newStatus;
            
            setAssignment({ 
                ...assignment, 
                roundStatuses: updatedStatuses,
                // Also update legacy field if it's the current/latest round
                roundStatus: rNum === assignment.roundsCount ? newStatus : assignment.roundStatus
            });
            
            showToast(`Round ${rNum} ${newStatus === 'open' ? 'Opened' : 'Closed'}`, 'success');
        } catch (err) {
            showToast("Failed to update status", "error");
        } finally {
            setUpdating(false);
        }
    };

    const handleAddRound = async () => {
        if (!assignment) return;
        if (assignment.roundsCount >= 2) {
            showToast("Maximum of 2 rounds reached.", "error");
            return;
        }
        if (!confirm(`Advance to Round ${assignment.roundsCount + 1}? Previous round will be finalized.`)) return;
        
        setUpdating(true);
        try {
            await addNewRound(assignmentId);
            const updatedAsg = await getAssignmentById(assignmentId);
            setAssignment(updatedAsg);
            showToast(`Round ${updatedAsg?.currentRound} Created and Opened`, 'success');
        } catch (err) {
            showToast("Failed to add round", "error");
        } finally {
            setUpdating(false);
        }
    };
    const totalSubs = submissions.length;
    const avgScore = totalSubs > 0 ? Math.round(submissions.reduce((acc, s) => acc + s.auditData.reports.reduce((rAcc, r) => rAcc + r.overall_score, 0) / s.auditData.reports.length, 0) / totalSubs) : 0;

    // Round-specific metrics
    const roundSubmissions = submissions.filter(s => (s.roundNumber || 1) === activeTab);
    const roundSubsCount = roundSubmissions.length;
    const roundAvgScore = roundSubsCount > 0 
        ? Math.round(roundSubmissions.reduce((acc, s) => acc + s.auditData.reports.reduce((rAcc, r) => rAcc + r.overall_score, 0) / s.auditData.reports.length, 0) / roundSubsCount) 
        : 0;

    const handleExport = (roundNum?: number) => {
        const filteredSubs = roundNum 
            ? submissions.filter(s => (s.roundNumber || 1) === roundNum)
            : submissions;

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Timestamp,RefCode,StudentName,AssignmentID,Score,RiskLevel,Round\n"
            + filteredSubs.map(s => {
                const score = Math.round(s.auditData.reports.reduce((acc, r) => acc + r.overall_score, 0) / s.auditData.reports.length);
                const risk = s.auditData.reports.some(r => r.risk_level === 'Fail') ? 'Fail' : 'Pass';
                return `${new Date(s.timestamp).toISOString()},${s.refCode},${s.studentName},${s.assignmentId},${score},${risk},${s.roundNumber || 1}`;
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const filename = roundNum ? `ux_audit_${assignmentId}_round_${roundNum}_submissions.csv` : `ux_audit_${assignmentId}_submissions.csv`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="p-8 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">{assignmentTitle || 'Assignment Overview'}</h1>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-mono font-bold border border-indigo-200 uppercase tracking-widest">{assignmentCode}</span>
                    </div>
                </div>

                {/* Round Management Controls */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Round Management</h3>
                            <p className="text-slate-500 text-sm">Open or close specific rounds for student submissions.</p>
                        </div>
                        <button
                            disabled={updating || (assignment?.roundsCount || 1) >= 2}
                            onClick={handleAddRound}
                            className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 text-sm ${
                                (assignment?.roundsCount || 1) >= 2 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            { (assignment?.roundsCount || 1) >= 2 ? 'Max Rounds Reached' : 'Add New Round' }
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: assignment?.roundsCount || 1 }).map((_, i) => {
                            const rNum = i + 1;
                            const status = (assignment?.roundStatuses && assignment.roundStatuses[rNum.toString()]) || (rNum === assignment?.currentRound ? assignment.roundStatus : 'closed');
                            const isOpen = status === 'open';
                            
                            return (
                                <div key={rNum} className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-3 ${isOpen ? 'border-green-100 bg-green-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Round</span>
                                            <span className="text-xl font-black text-slate-900">{rNum}</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${isOpen ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                            {status}
                                        </div>
                                    </div>
                                    
                                    <button
                                        disabled={updating}
                                        onClick={() => handleToggleStatus(rNum)}
                                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all border-2 flex items-center justify-center gap-2 ${
                                            isOpen 
                                            ? 'bg-white border-red-100 text-red-600 hover:bg-red-50' 
                                            : 'bg-white border-green-100 text-green-600 hover:bg-green-50'
                                        }`}
                                    >
                                        {isOpen ? (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                Close Round
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                                                Open Round
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-100 transition-colors">
                        <div className="flex justify-between items-start">
                            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Total Submissions</h3>
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded">R{activeTab}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-4xl font-black text-slate-800">{roundSubsCount}</span>
                            <span className="text-xs text-slate-400 font-bold">/ {totalSubs} Total</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-yellow-100 transition-colors">
                        <div className="flex justify-between items-start">
                            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Class Average</h3>
                            <span className="bg-yellow-50 text-yellow-700 text-[10px] font-black px-2 py-0.5 rounded">R{activeTab}</span>
                        </div>
                        <div className="text-4xl font-black mt-2 text-yellow-600">{roundAvgScore}%</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Assignment Code</h3>
                            <button onClick={() => setIsPresentationOpen(true)} className="text-indigo-600 hover:text-indigo-800 p-1 rounded-lg hover:bg-indigo-50 transition-colors" title="Display Fullscreen">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                            </button>
                        </div>
                        <div className="text-4xl font-mono font-black text-indigo-600 mt-2">{assignmentCode}</div>
                    </div>
                </div>

                {/* Submissions Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Student Submissions</h3>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                    {Array.from({ length: assignment?.roundsCount || 1 }).map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setActiveTab(i + 1)}
                                            className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${
                                                activeTab === i + 1 
                                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                                                : 'text-slate-400 hover:text-slate-600 underline decoration-transparent'
                                            }`}
                                        >
                                            Round {i + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button 
                                onClick={() => handleExport(activeTab)} 
                                className="text-white hover:bg-indigo-700 text-xs font-black flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download Round {activeTab} CSV
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Round</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Session Code</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Name</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Student ID</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Ref Code</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Audit Score</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {submissions.filter(s => (s.roundNumber || 1) === activeTab).length === 0 ? (
                                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium italic">No submissions for Round {activeTab} yet.</td></tr>
                                ) : (
                                    submissions
                                        .filter(s => (s.roundNumber || 1) === activeTab)
                                        .map((sub, idx) => {
                                            const score = Math.round(sub.auditData.reports.reduce((acc, r) => acc + r.overall_score, 0) / sub.auditData.reports.length);
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{new Date(sub.timestamp).toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-bold">R{sub.roundNumber || '1'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-bold text-slate-600 font-mono scale-95 origin-left inline-block bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{sub.sessionCode || '------'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-slate-900">{sub.studentName}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-slate-900">{sub.studentId || 'ID Not Provided'}</div>
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
        </div>
    );
};

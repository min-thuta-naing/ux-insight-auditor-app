import React from 'react';
import { StudentSubmission, Assignment } from '../types';
import { clearAllSubmissions } from '../services/storageService';
import { subscribeToAssignment, updateRoundStatus, addNewRound, updateRoundMaxAudits, testFirestoreConnection } from '../services/firestoreService';
import { testGeminiConnection } from '../services/geminiService';
import { useToast } from '../components/Toast';
import { RoundConfirmationModal } from '../components/RoundConfirmationModal';

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
    const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
    
    // API Status State
    const [geminiStatus, setGeminiStatus] = React.useState<'loading' | 'success' | 'error' | 'quota_exceeded'>('loading');
    const [firestoreStatus, setFirestoreStatus] = React.useState<'loading' | 'success' | 'error'>('loading');

    React.useEffect(() => {
        const checkConnections = async () => {
            const gStatus = await testGeminiConnection();
            setGeminiStatus(gStatus ? 'success' : 'error');
            
            const fStatus = await testFirestoreConnection();
            setFirestoreStatus(fStatus ? 'success' : 'error');
        };
        checkConnections();
    }, []);

    React.useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        if (assignmentId) {
            unsubscribe = subscribeToAssignment(assignmentId, (asg) => {
                setAssignment(asg);
            });
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
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

    const handleUpdateMaxAudits = async (rNum: number, currentMax: number, delta: number) => {
        if (!assignment) return;
        const newMax = Math.max(1, currentMax + delta);
        if (newMax === currentMax) return;
        
        setUpdating(true);
        try {
            await updateRoundMaxAudits(assignmentId, rNum, newMax);
            
            const updatedMaxAudits = { ...(assignment.roundMaxAudits || {}) };
            updatedMaxAudits[rNum.toString()] = newMax;
            
            setAssignment({
                ...assignment,
                roundMaxAudits: updatedMaxAudits
            });
            
            showToast(`Round ${rNum} Audit Limit updated to ${newMax}`, 'success');
        } catch (err) {
            showToast("Failed to update audit limit", "error");
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

        setIsConfirmModalOpen(true);
    };

    const confirmAddRound = async () => {
        if (!assignment) return;
        
        setIsConfirmModalOpen(false);
        setUpdating(true);
        try {
            await addNewRound(assignmentId);
            showToast(`Round Created and Opened`, 'success');
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

        const heuristicIds = Array.from({ length: 10 }, (_, i) => `H${i + 1}`);
        const findingFields = [
            "Rule ID", 
            "Category", 
            "Issue Category", 
            "Description", 
            "Reasoning", 
            "Severity", 
            "Suggestion"
        ];

        // 1. Calculate max findings PER heuristic to define column structure
        const maxFindingsPerH: Record<string, number> = {};
        heuristicIds.forEach(id => {
            let max = 0;
            filteredSubs.forEach(s => {
                const report = s.auditData.reports?.find(r => r.heuristic_id === id);
                const count = report?.findings?.length || 0;
                if (count > max) max = count;
            });
            maxFindingsPerH[id] = max;
        });

        // 2. Construct Headers
        const headers = [
            "Timestamp",
            "SessionCode",
            "RefCode",
            "StudentName",
            "StudentID",
            "Round",
            "Persona",
            "AuditScope",
            "WCAGLevel",
            "OverallScore",
            "RiskLevel"
        ];

        heuristicIds.forEach(hid => {
            headers.push(`${hid} Score`, `${hid} Summary`);
            const maxF = maxFindingsPerH[hid];
            for (let i = 1; i <= maxF; i++) {
                findingFields.forEach(field => {
                    headers.push(`${hid} Finding ${i} ${field}`);
                });
            }
        });

        const escapeCSV = (str: any) => {
            if (str === undefined || str === null) return '""';
            const stringified = String(str);
            const escaped = stringified.replace(/"/g, '""');
            return `"${escaped}"`;
        };

        // 3. Construct Rows
        const csvRows = filteredSubs.map(s => {
            const reports = s.auditData.reports || [];
            const avgScore = reports.length > 0 
                ? Math.round(reports.reduce((acc, r) => acc + r.overall_score, 0) / reports.length)
                : 0;
            const risk = reports.some(r => r.risk_level === 'Fail') ? 'Fail' : 'Pass';

            const row = [
                new Date(s.timestamp).toISOString(),
                escapeCSV(s.sessionCode || ""),
                escapeCSV(s.refCode),
                escapeCSV(s.studentName),
                escapeCSV(s.studentId || ""),
                s.roundNumber || 1,
                escapeCSV(s.auditData.persona),
                escapeCSV(s.auditData.auditScope),
                escapeCSV(s.auditData.wcagLevel),
                avgScore,
                risk
            ];

            heuristicIds.forEach(hid => {
                const report = reports.find(r => r.heuristic_id === hid);
                row.push(report ? report.overall_score : "N/A");
                row.push(escapeCSV(report?.executive_summary || ""));

                const findings = report?.findings || [];
                const maxF = maxFindingsPerH[hid];

                for (let i = 0; i < maxF; i++) {
                    const f = findings[i];
                    if (f) {
                        row.push(escapeCSV(f.rule_id));
                        row.push(escapeCSV(f.category));
                        row.push(escapeCSV(f.issue_category));
                        row.push(escapeCSV(f.issue_description));
                        row.push(escapeCSV(f.reasoning));
                        row.push(escapeCSV(f.severity));
                        row.push(escapeCSV(f.suggestion));
                    } else {
                        // Pad empty findings
                        for (let j = 0; j < findingFields.length; j++) row.push('""');
                    }
                }
            });

            return row.join(",");
        });

        const csvContent = headers.join(",") + "\n" + csvRows.join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const filename = roundNum ? `ux_audit_${assignmentId}_round_${roundNum}_db_export.csv` : `ux_audit_${assignmentId}_db_export.csv`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">{assignmentTitle || 'Assignment Overview'}</h1>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-mono font-bold border border-indigo-200 uppercase tracking-widest">{assignmentCode}</span>
                    </div>
                    
                    {/* API Status Indicators */}
                    <div className="flex gap-4 items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                geminiStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                geminiStatus === 'quota_exceeded' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                geminiStatus === 'error' ? 'bg-red-500' : 'bg-slate-300 animate-pulse'
                            }`} title={geminiStatus === 'quota_exceeded' ? "API Credit / Quota Exceeded" : ""} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {geminiStatus === 'quota_exceeded' ? 'Gemini (No Credit)' : 'Gemini AI'}
                            </span>
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                firestoreStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                firestoreStatus === 'error' ? 'bg-red-500' : 'bg-slate-300 animate-pulse'
                            }`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Firestore</span>
                        </div>
                    </div>
                </div>

                {/* Round Management Controls */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-300">
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

                    <div className="flex flex-col gap-4">
                        {Array.from({ length: assignment?.roundsCount || 1 }).map((_, i) => {
                            const rNum = i + 1;
                            const status = (assignment?.roundStatuses && assignment.roundStatuses[rNum.toString()]) || (rNum === assignment?.currentRound ? assignment.roundStatus : 'closed');
                            const isOpen = status === 'open';
                            const maxAudits = assignment?.roundMaxAudits?.[rNum.toString()] || 2;
                            
                            return (
                                <div key={rNum} className={`bg-white p-5 px-8 rounded-xl border transition-all duration-300 flex items-center justify-between gap-6 ${isOpen ? 'border-indigo-100 shadow-sm' : 'border-slate-200'}`}>
                                    
                                    {/* Round Section */}
                                    <div className="w-32 flex flex-col gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Round</span>
                                        <div className="w-16 h-12 flex items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-sm">
                                            {rNum}
                                        </div>
                                    </div>

                                    {/* Status Section */}
                                    <div className="w-48 flex flex-col gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Status</span>
                                        <div className={`w-full h-12 flex items-center justify-center rounded-2xl font-black text-xs uppercase tracking-[0.1em] border-2 ${
                                            isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                            {status}
                                        </div>
                                    </div>
                                    
                                    {/* Limit Section */}
                                    <div className="flex-1 flex flex-col gap-2 items-center">
                                        <div className="w-full flex justify-center">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Limit per student</span>
                                        </div>
                                        <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-2xl p-1 shadow-sm h-12 min-w-[160px]">
                                            <button
                                                disabled={updating || maxAudits <= 1}
                                                onClick={() => handleUpdateMaxAudits(rNum, maxAudits, -1)}
                                                className={`w-10 h-full flex items-center justify-center transition-all ${maxAudits <= 1 ? 'text-slate-300' : 'text-slate-700 hover:text-indigo-600'}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                                            </button>
                                            <div className="flex-1 flex flex-col items-center justify-center px-4 border-x-2 border-slate-100">
                                                <span className="text-xl font-black text-slate-900 leading-none">{maxAudits}</span>
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Audits</span>
                                            </div>
                                            <button
                                                disabled={updating}
                                                onClick={() => handleUpdateMaxAudits(rNum, maxAudits, 1)}
                                                className="w-10 h-full flex items-center justify-center text-slate-700 hover:text-indigo-600 transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Button Section */}
                                    <div className="w-48 flex flex-col justify-end pt-6">
                                        <button
                                            disabled={updating}
                                            onClick={() => handleToggleStatus(rNum)}
                                            className={`h-12 w-full flex items-center justify-center gap-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 border-2 ${
                                                isOpen 
                                                ? 'bg-red-50 border-red-100 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-500' 
                                                : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 hover:shadow-indigo-100'
                                            }`}
                                        >
                                            {isOpen ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                    Close Round
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                                    Open Round
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-300 hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start">
                            <h3 className="text-slate-700 text-[10px] font-black uppercase tracking-[0.2em]">Total Submissions</h3>
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded">R{activeTab}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-4xl font-black text-slate-900">{roundSubsCount}</span>
                            <span className="text-xs text-slate-500 font-bold">/ {totalSubs} Total</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-300 hover:border-yellow-300 transition-colors">
                        <div className="flex justify-between items-start">
                            <h3 className="text-slate-700 text-[10px] font-black uppercase tracking-[0.2em]">Class Average</h3>
                            <span className="bg-yellow-100 text-yellow-800 text-[10px] font-black px-2 py-0.5 rounded">R{activeTab}</span>
                        </div>
                        <div className="text-4xl font-black mt-2 text-yellow-700">{roundAvgScore}%</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-300 transition-colors">
                        <div className="flex justify-between items-center">
                            <h3 className="text-slate-700 text-sm font-bold uppercase tracking-wider">Assignment Code</h3>
                            <button onClick={() => setIsPresentationOpen(true)} className="text-indigo-600 hover:text-indigo-800 p-1 rounded-lg hover:bg-indigo-50 transition-colors" title="Display Fullscreen">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                            </button>
                        </div>
                        <div className="text-4xl font-mono font-black text-indigo-700 mt-2">{assignmentCode}</div>
                    </div>
                </div>

                {/* Submissions Section */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-300 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 bg-slate-100/30">
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
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-700 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-700 uppercase tracking-widest">Round</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-700 uppercase tracking-widest">Session Code</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-700 uppercase tracking-widest">Student Name</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-700 uppercase tracking-widest">Student ID</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-700 uppercase tracking-widest">Ref Code</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-700 uppercase tracking-widest">Audit Score</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-700 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {submissions.filter(s => (s.roundNumber || 1) === activeTab).length === 0 ? (
                                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium italic">No submissions for Round {activeTab} yet.</td></tr>
                                ) : (
                                    submissions
                                        .filter(s => (s.roundNumber || 1) === activeTab)
                                        .map((sub, idx) => {
                                            const score = Math.round(sub.auditData.reports.reduce((acc, r) => acc + r.overall_score, 0) / sub.auditData.reports.length);
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">{new Date(sub.timestamp).toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-bold">R{sub.roundNumber || '1'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-bold text-slate-700 font-mono scale-95 origin-left inline-block bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{sub.sessionCode || '------'}</span>
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

            <RoundConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmAddRound}
                roundNumber={(assignment?.roundsCount || 1) + 1}
                isUpdating={updating}
            />
        </div>
    );
};

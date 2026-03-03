import React from 'react';
import { StudentSubmission } from '../types';
import { clearAllSubmissions } from '../services/storageService';

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
        <div className="p-8 space-y-6">
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
                        <div className="flex justify-between items-center">
                            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Assignment Code</h3>
                            <button onClick={() => setIsPresentationOpen(true)} className="text-indigo-600 hover:text-indigo-800 p-1 rounded-lg hover:bg-indigo-50 transition-colors" title="Display Fullscreen">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                            </button>
                        </div>
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
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Name</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Student ID</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Ref Code</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Audit Score</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {submissions.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">No submissions for this assignment yet.</td></tr>
                                ) : (
                                    submissions.map((sub, idx) => {
                                        const score = Math.round(sub.auditData.reports.reduce((acc, r) => acc + r.overall_score, 0) / sub.auditData.reports.length);
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{new Date(sub.timestamp).toLocaleString()}</td>
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

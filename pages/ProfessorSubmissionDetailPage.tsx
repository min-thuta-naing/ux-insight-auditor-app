import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSubmission, UsabilityReport } from '../types';
import { FindingsList } from '../components/FindingsList';
import { ImageViewer } from '../components/ImageViewer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface ProfessorSubmissionDetailPageProps {
    submission: StudentSubmission | null;
}

export const ProfessorSubmissionDetailPage: React.FC<ProfessorSubmissionDetailPageProps> = ({ submission }) => {
    const navigate = useNavigate();
    const [selectedFindingId, setSelectedFindingId] = useState<string | undefined>(undefined);
    const [showUx, setShowUx] = useState(true);
    const [showWcag, setShowWcag] = useState(true);

    if (!submission) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <p className="text-xl font-medium mb-4">No submission selected</p>
                <button onClick={() => navigate('/professor/dashboard')} className="text-indigo-600 hover:underline font-bold">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const { auditData, studentName, studentId, refCode, timestamp } = submission;
    const { reports, imageSrc, auditScope, wcagLevel, persona, heuristicMode } = auditData;

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

    return (
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
            {/* Student Header */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex flex-wrap justify-between items-start gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{studentName}</h1>
                            <p className="text-slate-500 font-medium">Student ID: {studentId || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-[120px]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ref Code</p>
                            <p className="text-sm font-black text-indigo-600 font-mono">{refCode}</p>
                        </div>
                        <div className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-[120px]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Submitted On</p>
                            <p className="text-sm font-bold text-slate-700">{new Date(timestamp).toLocaleDateString()}</p>
                        </div>
                        <div className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-[120px]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score</p>
                            <p className={`text-sm font-bold ${avgUxScore >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>{avgUxScore}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Analysis */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-800">Visual Analysis</h2>
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
                            imageSrc={imageSrc}
                            findings={visibleFindings}
                            selectedFindingId={selectedFindingId}
                            onSelectFinding={setSelectedFindingId}
                        />
                    </div>
                </div>

                {/* Report and Findings */}
                <div className="lg:col-span-5 space-y-6">
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

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Detailed Findings</h3>
                        <FindingsList findings={visibleFindings} onSelectFinding={setSelectedFindingId} selectedFindingId={selectedFindingId} />
                    </div>
                </div>
            </div>
        </div>
    );
};

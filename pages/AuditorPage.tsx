import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HEURISTICS } from '../constants';
import { HeuristicDef, Persona, UsabilityReport, SavedAudit, AuditScope, WcagLevel, StudentSubmission } from '../types';
import { analyzeImage } from '../services/geminiService';
import { saveAudit, getSavedAudits, deleteAudit } from '../services/storageService';
import { submitToFirestore } from '../services/firestoreService';
import { FindingsList } from '../components/FindingsList';
import { ImageViewer } from '../components/ImageViewer';
import { HistoryModal } from '../components/HistoryModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface AuditorPageProps {
    studentName: string;
    studentId: string;
    assignmentId: string;
    professorId: string;
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

export const AuditorPage: React.FC<AuditorPageProps> = ({
    studentName,
    studentId,
    assignmentId,
    professorId,
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
    const [loading, setLoading] = useState<boolean>(false);
    const [progressMessage, setProgressMessage] = useState<string>("");
    const [selectedFindingId, setSelectedFindingId] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const [showUx, setShowUx] = useState(true);
    const [showWcag, setShowWcag] = useState(true);
    const [showAllIssues, setShowAllIssues] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);

    useEffect(() => {
        setSavedAudits(getSavedAudits());
    }, []);

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
        setShowAllIssues(false); // Reset to default when running new audit

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
            navigate('/student/success');

            saveAudit(auditData);
            setSavedAudits(getSavedAudits());
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to submit assignment.");
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
        setError(null);
    };

    const handleDeleteAudit = (id: string) => {
        if (window.confirm("Are you sure you want to delete this audit?")) {
            setSavedAudits(deleteAudit(id));
        }
    };

    const handleSelectFinding = (id: string) => {
        setSelectedFindingId(prev => prev === id ? undefined : id);
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
        <div className="min-h-screen flex flex-col bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">UX</div>
                        <h1 className="text-xl font-bold text-slate-800">Insight Auditor</h1>
                    </div>
                    <div className="flex items-center gap-4">
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
                                            <input type="checkbox" checked={showAllIssues} onChange={e => setShowAllIssues(e.target.checked)} className="sr-only peer" />
                                            <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                            <span className="ms-2 text-[10px] font-bold text-gray-700 uppercase tracking-tighter">Show All Issues</span>
                                        </label>
                                        <div className="w-[1px] h-4 bg-gray-200 mx-1 self-center"></div>
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
        </div>
    );
};

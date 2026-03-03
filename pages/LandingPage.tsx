import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HistoryModal } from '../components/HistoryModal';
import { SavedAudit } from '../types';

interface LandingPageProps {
    isHistoryOpen: boolean;
    setIsHistoryOpen: (open: boolean) => void;
    savedAudits: SavedAudit[];
    onLoadAudit: (audit: SavedAudit) => void;
    onDeleteAudit: (id: string) => void;
    setAuthMode: (mode: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
    isHistoryOpen,
    setIsHistoryOpen,
    savedAudits,
    onLoadAudit,
    onDeleteAudit,
    setAuthMode
}) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">UX</div>
                        <h1 className="text-xl font-bold text-slate-800">Insight Auditor</h1>
                    </div>
                </div>
            </header>
            <div className="flex-1 flex flex-col justify-center items-center p-4">
                <HistoryModal
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    audits={savedAudits}
                    onLoad={onLoadAudit}
                    onDelete={onDeleteAudit}
                />
                <div className="max-w-4xl w-full text-center space-y-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">UX Insight Auditor</h1>
                        <p className="text-xl text-slate-600">AI-Powered Heuristic Evaluation Platform</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-indigo-500 transition-all cursor-pointer group" onClick={() => navigate('/student/onboarding')}>
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-600 transition-colors">
                                <svg className="w-8 h-8 text-indigo-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">I am a Student</h2>
                            <p className="text-slate-500">Join a session, run audits without login, and submit assignments directly to your professor.</p>
                            <button className="mt-6 w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">Start Audit Session</button>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-violet-500 transition-all cursor-pointer group" onClick={() => { setAuthMode('login'); navigate('/professor/login'); }}>
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
};

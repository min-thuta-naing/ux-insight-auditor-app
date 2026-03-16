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
        <div className="min-h-screen bg-[#F9F8F6] flex flex-col">
            {/* <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">UX Insight Auditor</h1>
                    </div>
                </div>
            </header> */}
            <div className="flex-1 flex flex-col justify-center items-center p-6">
                <HistoryModal
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    audits={savedAudits}
                    onLoad={onLoadAudit}
                    onDelete={onDeleteAudit}
                />
                <div className="max-w-4xl w-full text-center space-y-12">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                            UX Insight <span className="text-student-500">Auditor</span>
                        </h1>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            Master heuristic evaluation with AI-powered insights. Analyze interfaces, discover usability issues, and submit professional reports.
                        </p>
                    </div>

                    <div className="max-w-md mx-auto">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-[#8C5A3C] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="w-20 h-20 bg-student-100 rounded-[8rem] flex items-center justify-center mx-auto shadow-sm">
                                <svg className="w-10 h-10 text-student-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            
                            <div className="space-y-4">
                                <button 
                                    onClick={() => navigate('/student/login')}
                                    className="w-full py-4 bg-student-600 text-white rounded-2xl font-black text-lg hover:bg-student-700 transition-all shadow-xl shadow-student-200/50 active:scale-95"
                                >
                                    Log In to Account
                                </button>
                                <button 
                                    onClick={() => navigate('/student/signup')}
                                    className="w-full py-4 bg-white border-2 border-[#D4C9BE] text-student-600 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Create New Account
                                </button>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

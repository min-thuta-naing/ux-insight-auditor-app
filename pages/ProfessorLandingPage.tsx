import React from 'react';
import { useNavigate } from 'react-router-dom';

export const ProfessorLandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold">UX</div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Insight Auditor <span className="text-violet-400 font-medium">Instructor</span></h1>
                    </div>
                </div>
            </header>
            
            <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/20">
                <div className="max-w-4xl w-full text-center space-y-12">
                    <div className="space-y-4">
                        <div className="inline-block px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-sm font-bold tracking-widest uppercase mb-4">
                            For Educators
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white leading-tight">
                            Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">UX Teaching</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Deploy AI-powered heuristic evaluation tools for your students, manage assignments, and gain deep insights into class performance.
                        </p>
                    </div>

                    <div className="max-w-md mx-auto">
                        <div className="bg-slate-800/50 backdrop-blur-xl p-10 rounded-3xl border border-slate-700 shadow-2xl space-y-8 transform hover:scale-[1.01] transition-all">
                            <div className="w-20 h-20 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-violet-500/20">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            
                            <div className="space-y-4">
                                <button 
                                    onClick={() => navigate('/instructor-auth-research-2026/login?mode=login')}
                                    className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-lg hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/10 active:scale-95"
                                >
                                    Log In to Portal
                                </button>
                                <button 
                                    onClick={() => navigate('/instructor-auth-research-2026/login?mode=signup')}
                                    className="w-full py-4 bg-transparent border-2 border-slate-700 text-slate-300 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all active:scale-95"
                                >
                                    Create Instructor Account
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <button 
                            onClick={() => navigate('/')}
                            className="text-slate-500 hover:text-slate-300 text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Student Portal
                        </button>
                    </div>
                </div>
            </div>
            
            <footer className="py-8 bg-slate-900 border-t border-slate-800">
                <p className="text-center text-slate-600 text-sm font-medium tracking-tight">
                    &copy; 2026 UX Insight Auditor. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

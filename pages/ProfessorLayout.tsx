import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { logout as firebaseLogout } from '../services/authService';
import { User } from 'firebase/auth';

interface ProfessorLayoutProps {
    user: User | null;
    assignmentCode: string;
    isPresentationOpen: boolean;
    setIsPresentationOpen: (open: boolean) => void;
}

export const ProfessorLayout: React.FC<ProfessorLayoutProps> = ({
    user,
    assignmentCode,
    isPresentationOpen,
    setIsPresentationOpen
}) => {
    const navigate = useNavigate();
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);

    const handleLogout = async () => {
        setIsLogoutConfirmOpen(false);
        navigate('/instructor-auth-research-2026'); // Navigate to professor landing page FIRST
        await firebaseLogout();
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar
                onLogout={() => setIsLogoutConfirmOpen(true)}
                userEmail={user?.email}
            />
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>

            {/* Logout Confirmation Modal */}
            {isLogoutConfirmOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsLogoutConfirmOpen(false)} />
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 animate-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Logout Confirmation</h3>
                        <p className="text-slate-500 text-center mb-8 font-medium">Are you sure you want to log out of your account?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsLogoutConfirmOpen(false)}
                                className="w-full py-4 px-6 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full py-4 px-6 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Presentation Modal */}
            {isPresentationOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                    <button
                        onClick={() => setIsPresentationOpen(false)}
                        className="absolute top-8 right-8 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-all"
                    >
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="space-y-12 max-w-5xl">
                        <h2 className="text-slate-400 text-2xl font-bold uppercase tracking-[0.3em]">Join the Audit Session</h2>

                        <div className="space-y-4">
                            <p className="text-slate-500 text-xl font-bold">here is the assignment code</p>
                            <div className="text-[7rem] md:text-[9rem] font-mono font-black text-white tracking-tight leading-none">
                                {assignmentCode}
                            </div>
                        </div>

                        <p className="text-white text-3xl font-bold max-w-2xl mx-auto">
                            please put the code in the audit session to continue
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

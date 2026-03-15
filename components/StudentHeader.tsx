import React from 'react';
import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

interface StudentHeaderProps {
    user: User | null;
    studentName: string;
    historyCount: number;
    onOpenHistory: () => void;
    onOpenLogout: () => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
    user,
    studentName,
    historyCount,
    onOpenHistory,
    onOpenLogout
}) => {
    const navigate = useNavigate();

    return (
        /* HEADER COLOR: You can change the background color below (e.g., bg-white) */
        <header className="bg-[#F9F8F6] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    {/* <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold">UX</div> */}
                    <h1 className="text-2xl font-bold text-slate-800">UX Insight Auditor</h1>
                </div>
                <div className="flex items-center gap-3">
                    {studentName || user ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-full border border-[#8C5A3C] shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#030303]/50">Student</span>
                                <span className="text-sm font-bold border-l border-[#8C5A3C]/70 pl-2">{studentName || user?.displayName || 'Student'}</span>
                            </div>

                            {/* History Button (Green) */}
                            <button 
                                onClick={onOpenHistory}
                                className="group flex items-center h-10 px-3 bg-[#D0E7D2] text-[#618264] rounded-full border border-[#618264]/50 hover:[#618264] transition-all duration-300 ease-out overflow-hidden shadow-sm"
                                title="View History"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out font-bold text-sm">
                                    History ({historyCount})
                                </span>
                            </button>

                            {/* Profile Button (Blue) */}
                            <button
                                onClick={() => navigate('/student/profile')}
                                className="group flex items-center h-10 px-3 bg-[#DAEAF1] text-[#6096B4] rounded-full border border-[#6096B4]/50 hover:[#6096B4] transition-all duration-300 ease-out overflow-hidden shadow-sm"
                                title="View Profile"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out font-bold text-sm">
                                    Profile
                                </span>
                            </button>

                            {/* Logout Button (Red) */}
                            <button
                                onClick={onOpenLogout}
                                className="group flex items-center h-10 px-3 bg-[#F6ECF0] text-[#AF3E3E] rounded-full border border-[#AF3E3E]/50 hover:[#AF3E3E] transition-all duration-300 ease-out overflow-hidden shadow-sm"
                                title="Logout"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out font-bold text-sm">
                                    Log out
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-full border border-[#D4C9BE] font-bold text-xs uppercase tracking-widest">
                            Guest
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

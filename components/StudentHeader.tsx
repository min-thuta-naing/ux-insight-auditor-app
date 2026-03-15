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
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">UX</div>
                    <h1 className="text-xl font-bold text-slate-800">Insight Auditor</h1>
                </div>
                <div className="flex items-center gap-4">
                    {studentName || user ? (
                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-student-50 text-student-600 rounded-full border border-student-200">
                                <span className="text-xs font-bold uppercase tracking-wide">Student</span>
                                <span className="text-sm font-medium">{studentName || user?.displayName || 'Student'}</span>
                            </div>
                            <button
                                onClick={() => navigate('/student/profile')}
                                className="p-2 bg-student-100 text-student-700 rounded-xl border border-student-200 hover:bg-student-200 transition-all shadow-sm group"
                                title="View Profile"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>
                            <button
                                onClick={onOpenLogout}
                                className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-100 transition-all shadow-sm group ml-1"
                                title="Logout"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                            <span className="text-xs font-bold uppercase tracking-wide">Guest</span>
                        </div>
                    )}
                    <button onClick={onOpenHistory} className="text-sm font-medium text-slate-600 hover:text-student-500 flex items-center gap-1 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        My History ({historyCount})
                    </button>
                </div>
            </div>
        </header>
    );
};

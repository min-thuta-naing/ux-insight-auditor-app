import React from 'react';
import { User } from 'firebase/auth';

interface ProfessorProfilePageProps {
    user: User | null;
}

export const ProfessorProfilePage: React.FC<ProfessorProfilePageProps> = ({ user }) => {
    return (
        <div className="p-8 max-w-4xl mx-auto w-full">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Profile Settings</h1>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-6 mb-10">
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-3xl text-white font-bold">
                        {user?.email?.[0].toUpperCase() || 'P'}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{user?.email || 'Professor'}</h2>
                        <p className="text-slate-500">Instructor Account</p>
                    </div>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">User ID</label>
                        <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 font-mono text-xs text-slate-400">{user?.uid}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                        <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-slate-700">{user?.email}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';

export const StudentLoginPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 text-slate-900">
                    <h2 className="text-2xl font-black tracking-tight">Student Portal</h2>
                </div>
                <AuthForm
                    onSuccess={() => navigate('/student/join')}
                    onBack={() => navigate('/')}
                    initialMode="login"
                    role="student"
                />
            </div>
        </div>
    );
};

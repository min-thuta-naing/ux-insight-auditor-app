import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';

export const StudentSignupPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-6 text-slate-900">
                    <h2 className="text-2xl font-bold">Student Portal</h2>
                    <p className="text-student-600 font-medium">Create a new student account</p>
                </div>
                <AuthForm
                    onSuccess={() => navigate('/student/login')}
                    onBack={() => navigate('/')}
                    initialMode="signup"
                    role="student"
                />
            </div>
        </div>
    );
};

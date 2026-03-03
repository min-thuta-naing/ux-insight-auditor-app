import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';

interface ProfessorLoginPageProps {
    authMode: 'login' | 'signup';
}

export const ProfessorLoginPage: React.FC<ProfessorLoginPageProps> = ({ authMode }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <AuthForm
                onSuccess={() => navigate('/professor/dashboard')}
                onBack={() => navigate('/')}
                initialMode={authMode}
            />
        </div>
    );
};

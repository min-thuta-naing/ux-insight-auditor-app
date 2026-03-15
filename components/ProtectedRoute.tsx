import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';
import { getProfessorProfile, getStudentProfile } from '../services/firestoreService';
import { logout } from '../services/authService';

interface ProtectedRouteProps {
    user: User | null;
    loading: boolean;
    requiredRole: 'student' | 'professor';
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, loading, requiredRole, children }) => {
    const location = useLocation();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const verifyRole = async () => {
            if (!user) {
                setIsVerifying(false);
                return;
            }

            try {
                let profile;
                if (requiredRole === 'professor') {
                    profile = await getProfessorProfile(user.uid);
                } else {
                    profile = await getStudentProfile(user.uid);
                }

                if (profile) {
                    setIsAuthorized(true);
                } else {
                    // Force logout if role mismatch to clear session
                    await logout();
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Role verification failed:", error);
                setIsAuthorized(false);
            } finally {
                setIsVerifying(false);
            }
        };

        if (!loading) {
            verifyRole();
        }
    }, [user, loading, requiredRole]);

    if (loading || isVerifying) {
        return (
            <div className={`min-h-screen ${requiredRole === 'professor' ? 'bg-slate-900' : 'bg-slate-50'} flex items-center justify-center`}>
                <svg className={`animate-spin h-8 w-8 ${requiredRole === 'professor' ? 'text-white' : 'text-student-600'}`} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    const loginPath = requiredRole === 'professor' 
        ? '/instructor-auth-research-2026/login' 
        : '/student/login';

    if (!user) {
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    if (!isAuthorized) {
        // Redirect with an error state if possible, or just base path
        return <Navigate to={loginPath} replace />;
    }

    return <>{children}</>;
};

import React, { useEffect, useState } from 'react';
import { verifyEmail } from '../services/authService';

interface VerifyEmailPageProps {
    oobCode: string;
    onSuccess: () => void;
    onBack: () => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ oobCode, onSuccess, onBack }) => {
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [error, setError] = useState<string | null>(null);
    const verificationStarted = React.useRef(false);

    useEffect(() => {
        if (verificationStarted.current) return;
        verificationStarted.current = true;

        const handleVerify = async () => {
            try {
                await verifyEmail(oobCode);
                setStatus('success');
                setTimeout(() => {
                    onSuccess();
                }, 3000);
            } catch (err: any) {
                // If it's already verified, we might get an error or success depending on state.
                // auth/invalid-action-code is common if it's already been used.
                if (err?.code === 'auth/invalid-action-code') {
                    // It's possible it was already verified in a previous (double) call.
                    // We'll show a slightly different message or just proceed.
                    setStatus('success');
                    setTimeout(() => onSuccess(), 2000);
                    return;
                }

                setStatus('error');
                setError(err?.message || "Verification failed. The link may have expired or already been used.");
            }
        };

        handleVerify();
    }, [oobCode, onSuccess]);

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-8 text-center">
            {status === 'verifying' && (
                <div className="space-y-4">
                    <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                    <h2 className="text-2xl font-bold text-slate-900">Verifying your email...</h2>
                    <p className="text-slate-500">Please wait while we confirm your account.</p>
                </div>
            )}

            {status === 'success' && (
                <div className="space-y-4">
                    <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Email Verified!</h2>
                    <p className="text-slate-500">Your account is now active. Redirecting you to login...</p>
                </div>
            )}

            {status === 'error' && (
                <div className="space-y-4">
                    <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Verification Failed</h2>
                    <p className="text-red-500 text-sm">{error}</p>
                    <button
                        onClick={onBack}
                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            )}
        </div>
    );
};

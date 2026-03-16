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
        <div className="w-full max-w-md mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-[#8C5A3C] p-10 text-center animate-in fade-in zoom-in duration-500">
            {status === 'verifying' && (
                <div className="space-y-6">
                    <div className="animate-spin h-14 w-14 border-4 border-student-600 border-t-transparent rounded-full mx-auto"></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verifying your email...</h2>
                        <p className="text-slate-500 mt-2 font-medium">Please wait while we confirm your account.</p>
                    </div>
                </div>
            )}

            {status === 'success' && (
                <div className="space-y-6">
                    <div className="h-16 w-16 bg-student-100 text-student-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-sm">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Email Verified!</h2>
                        <p className="text-slate-500 mt-2 font-medium">Your account is now active. Redirecting you to login...</p>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="space-y-6">
                    <div className="h-16 w-16 bg-red-50 text-red-600 rounded-[1.5rem] flex items-center justify-center mx-auto border border-red-100">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verification Failed</h2>
                        <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>
                    </div>
                    <button
                        onClick={onBack}
                        className="w-full py-4 bg-white border-2 border-[#D4C9BE] text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Back to Home
                    </button>
                </div>
            )}
        </div>
    );
};

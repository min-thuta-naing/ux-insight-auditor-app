import React, { useState, useEffect } from 'react';
import { verifyResetCode, confirmReset } from '../services/authService';

interface ResetPasswordPageProps {
    oobCode: string;
    onSuccess: () => void;
    onBack: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ oobCode, onSuccess, onBack }) => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        const verify = async () => {
            try {
                const userEmail = await verifyResetCode(oobCode);
                setEmail(userEmail);
            } catch (err: any) {
                setError("Invalid or expired reset link. Please request a new one.");
            } finally {
                setVerifying(false);
            }
        };
        verify();
    }, [oobCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await confirmReset(oobCode, newPassword);
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Failed to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100">
                <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-600 font-medium">Verifying reset link...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="p-8 bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Password Reset!</h2>
                <p className="text-slate-600 mb-8">Your password has been successfully updated. Redirecting to login...</p>
                <button
                    onClick={onSuccess}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all"
                >
                    Go to login
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900">New Password</h2>
                    <p className="text-slate-500 mt-2">
                        {email ? `Resetting password for ${email}` : "Enter your new password below"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </span>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </span>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-start gap-2">
                            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'}`}
                    >
                        {loading ? "Updating..." : "Reset Password"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={onBack}
                        className="text-sm text-indigo-600 font-bold hover:underline"
                    >
                        Back to Log In
                    </button>
                </div>
            </div>
        </div>
    );
};

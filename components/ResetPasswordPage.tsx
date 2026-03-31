import React, { useState, useEffect } from 'react';
import { verifyResetCode, confirmReset } from '../services/authService';

interface ResetPasswordPageProps {
    oobCode: string;
    onSuccess: (email: string) => void;
    onBack: (email?: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ oobCode, onSuccess, onBack }) => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState<string | null>(null);

    // Password requirements state
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false
    });

    const validatePassword = (pass: string) => {
        const requirements = {
            length: pass.length >= 6,
            lowercase: /[a-z]/.test(pass),
            uppercase: /[A-Z]/.test(pass),
            number: /[0-9]/.test(pass),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
        };
        setPasswordRequirements(requirements);
        return Object.values(requirements).every(Boolean);
    };

    const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

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
        
        if (!isPasswordValid) {
            setError("Please meet all password requirements");
            return;
        }

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
                onSuccess(email!);
            }, 3000);
        } catch (err: any) {
            let message = err.message || "Failed to reset password. Please try again.";
            if (message.startsWith("Firebase: ")) {
                message = message.replace("Firebase: ", "").trim();
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2.5rem] shadow-xl max-w-md w-full border border-[#8C5A3C] animate-in fade-in zoom-in duration-500">
                <div className="animate-spin h-12 w-12 border-4 border-student-600 border-t-transparent rounded-full mb-6"></div>
                <p className="text-slate-600 font-bold tracking-tight">Verifying reset link...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="p-12 bg-white rounded-[2.5rem] shadow-xl max-w-md w-full border border-[#8C5A3C] text-center animate-in fade-in scale-in duration-500">
                <div className="w-20 h-20 bg-student-100 text-student-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Password Reset!</h2>
                <p className="text-slate-500 mb-10 font-medium font-medium leading-relaxed">Your password has been successfully updated. Redirecting to login...</p>
                <button
                    onClick={() => onSuccess(email!)}
                    className="w-full py-4 px-4 rounded-2xl bg-student-600 text-white font-black text-lg hover:bg-student-700 shadow-xl shadow-student-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    Go to login
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-[#8C5A3C] p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Password</h2>
                    <p className="text-slate-500 mt-2 font-medium">
                        {email ? `Resetting password for ${email}` : "Enter your new password below"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">New Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </span>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    validatePassword(e.target.value);
                                }}
                                className={`w-full pl-10 pr-4 py-4 bg-slate-50 border-2 outline-none transition-all placeholder:text-slate-300 rounded-3xl ${newPassword.length > 0 && !isPasswordValid
                                    ? 'border-red-400 focus:ring-4 focus:ring-red-500/10'
                                    : 'border-[#D4C9BE] focus:ring-4 focus:ring-student-500/10 focus:border-student-500'
                                    }`}
                                placeholder="••••••••"
                            />
                        </div>

                        {newPassword.length > 0 && (
                            <div className="mt-4 space-y-3 animate-fadeIn">
                                <p className={`text-sm font-medium transition-colors ${!isPasswordValid ? 'text-red-800' : 'text-slate-600'}`}>
                                    Please create a password that meets all requirements below
                                </p>

                                <div className="space-y-2 ml-1">
                                    <RequirementItem
                                        met={passwordRequirements.length}
                                        text="At least 6 characters"
                                    />
                                    <RequirementItem
                                        met={passwordRequirements.lowercase}
                                        text="1 lowercase letter"
                                    />
                                    <RequirementItem
                                        met={passwordRequirements.uppercase}
                                        text="1 uppercase letter"
                                    />
                                    <RequirementItem
                                        met={passwordRequirements.number}
                                        text="1 number"
                                    />
                                    <RequirementItem
                                        met={passwordRequirements.special}
                                        text="1 special character"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Confirm New Password</label>
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
                                className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-[#D4C9BE] rounded-3xl focus:ring-4 focus:ring-student-500/10 focus:border-student-500 outline-none transition-all placeholder:text-slate-300"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 flex items-start gap-3 animate-shake">
                            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 px-4 rounded-2xl text-white font-black text-lg shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] ${loading ? 'bg-slate-200 cursor-not-allowed shadow-none' : 'bg-student-600 hover:bg-student-700 shadow-student-200/50'}`}
                    >
                        {loading ? "Updating..." : "Reset Password"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => onBack(email || undefined)}
                        className="text-xs text-slate-400 hover:text-slate-600 uppercase tracking-widest font-black"
                    >
                        Back to Log In
                    </button>
                </div>
            </div>
        </div>
    );
};

const RequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <div className="flex items-center gap-3 group">
        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${met ? 'bg-emerald-600' : 'bg-slate-300'}`}>
            {met ? (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            )}
        </div>
        <span className={`text-sm font-medium transition-colors duration-300 ${met ? 'text-emerald-700' : 'text-slate-500'}`}>
            {text}
        </span>
    </div>
);

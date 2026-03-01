import React, { useState } from 'react';
import { signIn, signUp, resetPassword } from '../services/authService';

interface AuthFormProps {
    onSuccess: () => void;
    onBack: () => void;
    initialMode?: 'login' | 'signup';
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, onBack, initialMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (mode === 'login') {
                await signIn(email, password);
                onSuccess();
            } else if (mode === 'signup') {
                await signUp(email, password);
                onSuccess();
            } else {
                await resetPassword(email);
                setSuccessMessage("Password reset email sent! Please check your inbox.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900">
                        {mode === 'login' ? "Welcome Back" : mode === 'signup' ? "Create Account" : "Reset Password"}
                    </h2>
                    <p className="text-slate-500 mt-2">
                        {mode === 'login' ? "Sign in to access the dashboard" :
                            mode === 'signup' ? "Sign up to start auditing your projects" :
                                "Enter your email to receive a reset link"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    {mode !== 'reset' && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-slate-700">Password</label>
                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => setMode('reset')}
                                        className="text-xs text-indigo-600 hover:underline font-medium"
                                    >
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-start gap-2 animate-shake">
                            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-600 flex items-start gap-2">
                            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{successMessage}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {mode === 'reset' ? 'Sending...' : 'Authenticating...'}
                            </span>
                        ) : (
                            mode === 'login' ? "Sign In" : mode === 'signup' ? "Get Started" : "Send Reset Link"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-sm text-slate-500">
                        {mode === 'reset' ? (
                            <button
                                onClick={() => setMode('login')}
                                className="text-indigo-600 font-bold hover:underline"
                            >
                                Back to Log In
                            </button>
                        ) : (
                            <>
                                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{" "}
                                <button
                                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                    className="text-indigo-600 font-bold hover:underline"
                                >
                                    {mode === 'login' ? "Sign Up" : "Log In"}
                                </button>
                            </>
                        )}
                    </p>
                    <button
                        onClick={onBack}
                        className="text-xs text-slate-400 hover:text-slate-600 uppercase tracking-widest font-semibold"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

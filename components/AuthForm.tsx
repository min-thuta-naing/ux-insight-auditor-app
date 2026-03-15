import React, { useState } from 'react';
import { signIn, signUp, resetPassword } from '../services/authService';
import { 
    updateProfessorProfile, 
    updateStudentProfile,
    getProfessorProfile,
    getStudentProfile 
} from '../services/firestoreService';

interface AuthFormProps {
    onSuccess: () => void;
    onBack: () => void;
    initialMode?: 'login' | 'signup';
    role?: 'professor' | 'student';
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, onBack, initialMode = 'login', role = 'professor' }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Profile fields for student signup
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [studentId, setStudentId] = useState("");
    const [institutionName, setInstitutionName] = useState("");

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

    const getFriendlyErrorMessage = (err: any) => {
        const code = err?.code || "";
        switch (code) {
            case 'auth/invalid-credential':
                return "Invalid email or password. Please try again.";
            case 'auth/user-not-found':
                return "No account found with this email.";
            case 'auth/wrong-password':
                return "Incorrect password. Please try again.";
            case 'auth/invalid-email':
                return "Please enter a valid email address.";
            case 'auth/email-already-in-use':
                return "An account already exists with this email.";
            case 'auth/weak-password':
                return "Password should be at least 6 characters.";
            case 'auth/too-many-requests':
                return "Too many failed attempts. Please try again later.";
            case 'auth/network-request-failed':
                return "Network error. Please check your connection.";
            default:
                // Strip "Firebase: " prefix if it exists but we don't have a specific mapping
                let message = err?.message || "An unexpected error occurred";
                if (message.startsWith("Firebase: ")) {
                    message = message.replace("Firebase: ", "").trim();
                }
                return message;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (mode === 'login') {
                const userCredential = await signIn(email, password);
                
                // Role verification
                let profile;
                if (role === 'professor') {
                    profile = await getProfessorProfile(userCredential.user.uid);
                } else {
                    profile = await getStudentProfile(userCredential.user.uid);
                }

                if (!profile) {
                    const { logout } = await import('../services/authService');
                    await logout();
                    setError(`Access denied. This account is not registered for the ${role === 'professor' ? 'Professor' : 'Student'} portal.`);
                    return;
                }

                if (!userCredential.user.emailVerified) {
                    setError("Your email is not verified yet. Please check your inbox for the verification link.");
                    setSuccessMessage(null);
                    return;
                }
                onSuccess();
            } else if (mode === 'signup') {
                if (!isPasswordValid) {
                    setError("Please meet all password requirements.");
                    setLoading(false);
                    return;
                }
                const userCredential = await signUp(email, password);
                
                // Create skeleton profile based on role
                if (role === 'professor') {
                    await updateProfessorProfile({
                        uid: userCredential.user.uid,
                        email: email,
                        firstName: "",
                        lastName: "",
                        profession: "",
                        institutionType: 'University',
                        institutionName: "",
                        updatedAt: Date.now()
                    });
                } else {
                    await updateStudentProfile({
                        uid: userCredential.user.uid,
                        email: email,
                        firstName: firstName,
                        lastName: lastName,
                        studentId: studentId,
                        institutionName: institutionName,
                        updatedAt: Date.now()
                    });
                }

                const { logout } = await import('../services/authService');
                await logout();
                setSuccessMessage("Account created! Please check your email to verify your account before logging in.");
                setMode('login'); // Switch to login mode after signup
            } else {
                await resetPassword(email);
                setSuccessMessage("Password reset email sent! Please check your inbox.");
            }
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err));
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
                                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ${role === 'student' ? 'focus:ring-student-500 focus:border-student-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} outline-none transition-all`}
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    {mode === 'signup' && role === 'student' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ${role === 'student' ? 'focus:ring-student-500 focus:border-student-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} outline-none transition-all`}
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ${role === 'student' ? 'focus:ring-student-500 focus:border-student-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} outline-none transition-all`}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Student ID</label>
                                <input
                                    type="text"
                                    required
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ${role === 'student' ? 'focus:ring-student-500 focus:border-student-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} outline-none transition-all`}
                                    placeholder="65XXXXXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Institution Name</label>
                                <input
                                    type="text"
                                    required
                                    value={institutionName}
                                    onChange={(e) => setInstitutionName(e.target.value)}
                                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ${role === 'student' ? 'focus:ring-student-500 focus:border-student-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} outline-none transition-all`}
                                    placeholder="e.g. Stanford University"
                                />
                            </div>
                        </>
                    )}

                    {mode !== 'reset' && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-slate-700">Password</label>
                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => setMode('reset')}
                                        className={`text-xs ${role === 'student' ? 'text-student-600' : 'text-indigo-600'} hover:underline font-medium`}
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
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (mode === 'signup') validatePassword(e.target.value);
                                    }}
                                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all ${mode === 'signup' && password.length > 0 && !isPasswordValid
                                        ? 'border-red-400 focus:ring-2 focus:ring-red-500'
                                        : `border-slate-200 focus:ring-2 ${role === 'student' ? 'focus:ring-student-500' : 'focus:ring-indigo-500'}`
                                        }`}
                                    placeholder="••••••••"
                                />
                            </div>

                            {mode === 'signup' && (
                                <div className="mt-4 space-y-3 animate-fadeIn">
                                    <p className={`text-sm font-medium transition-colors ${!isPasswordValid && password.length > 0 ? 'text-red-800' : 'text-slate-600'}`}>
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
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex flex-col gap-2 animate-shake">
                            <div className="flex items-start gap-2">
                                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                            {(error.toLowerCase().includes("verify") || error.toLowerCase().includes("verification")) && (
                                <div className="flex gap-4 items-center">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                setLoading(true);
                                                const { sendVerificationEmail } = await import('../services/authService');
                                                await sendVerificationEmail();
                                                setSuccessMessage("Verification email resent!");
                                                setError(null);
                                            } catch (e: any) {
                                                setError("Could not resend email: " + (e?.message || "unknown error"));
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className={`text-xs ${role === 'student' ? 'text-student-600' : 'text-indigo-600'} font-bold hover:underline mt-1`}
                                    >
                                        Resend Verification Email
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const { logout } = await import('../services/authService');
                                            await logout();
                                            window.location.reload();
                                        }}
                                        className="text-xs text-slate-500 font-bold hover:underline mt-1"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
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
                        className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            loading 
                                ? 'bg-slate-400 cursor-not-allowed' 
                                : role === 'student' 
                                    ? 'bg-student-100 text-student-700 hover:bg-student-200 border border-student-200' 
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className={`animate-spin h-5 w-5 ${role === 'student' ? 'text-student-600' : 'text-white'}`} fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {mode === 'reset' ? 'Sending...' : 'Authenticating...'}
                            </span>
                        ) : (
                            mode === 'login' ? "Sign In" : mode === 'signup' ? (isPasswordValid ? "Get Started" : "Check Requirements") : "Send Reset Link"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-sm text-slate-500">
                        {mode === 'reset' ? (
                            <button
                                onClick={() => setMode('login')}
                                className={`font-bold hover:underline ${role === 'student' ? 'text-student-600' : 'text-indigo-600'}`}
                            >
                                Back to Log In
                            </button>
                        ) : (
                            <>
                                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{" "}
                                <button
                                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                    className={`font-bold hover:underline ${role === 'student' ? 'text-student-600' : 'text-indigo-600'}`}
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

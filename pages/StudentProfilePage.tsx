import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getStudentProfile, updateStudentProfile } from '../services/firestoreService';
import { StudentProfile } from '../types';
import { useNavigate } from 'react-router-dom';

interface StudentProfilePageProps {
    user: User | null;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ user }) => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<StudentProfile | null>(null);

    // Form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [studentId, setStudentId] = useState("");
    const [institutionName, setInstitutionName] = useState("");

    useEffect(() => {
        if (user?.uid) {
            loadProfile();
        }
    }, [user?.uid]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await getStudentProfile(user!.uid);
            if (data) {
                setProfile(data);
                setFirstName(data.firstName || "");
                setLastName(data.lastName || "");
                setStudentId(data.studentId || "");
                setInstitutionName(data.institutionName || "");
            } else {
                // If no profile exists, enter editing mode immediately
                setIsEditing(true);
            }
        } catch (err) {
            console.error("Failed to load profile", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const newProfile: StudentProfile = {
                uid: user.uid,
                email: user.email || "",
                firstName,
                lastName,
                studentId,
                institutionName,
                updatedAt: Date.now()
            };
            await updateStudentProfile(newProfile);
            setProfile(newProfile);
            setIsEditing(false);
        } catch (err) {
            alert("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const initials = (firstName || lastName)
        ? `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
        : user?.email?.[0].toUpperCase() || 'S';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-student-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm group"
                            title="Go Back"
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-3xl font-bold text-slate-900">Student Profile</h1>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center gap-6 mb-10">
                        <div className="w-20 h-20 bg-student-500 rounded-2xl flex items-center justify-center text-3xl text-white font-bold">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (user?.email || 'Student')}
                            </h2>
                            <p className="text-slate-500 font-medium">
                                {profile?.studentId ? `ID: ${profile.studentId}` : 'Student Account'}
                            </p>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-student-500 outline-none transition-all"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-student-500 outline-none transition-all"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Student ID</label>
                                <input
                                    type="text"
                                    value={studentId}
                                    onChange={e => setStudentId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-student-500 outline-none transition-all"
                                    placeholder="65XXXXXXXX"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Institution Name</label>
                                <input
                                    type="text"
                                    value={institutionName}
                                    onChange={e => setInstitutionName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-student-500 outline-none transition-all"
                                    placeholder="e.g. Stanford University"
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                {profile && (
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        disabled={saving}
                                        className="flex-1 py-3 px-6 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-3 px-6 bg-student-500 text-white font-bold rounded-2xl hover:bg-student-600 transition-all shadow-lg shadow-student-100 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Saving...
                                        </>
                                    ) : 'Save Profile'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">First Name</label>
                                    <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-slate-700 font-medium">
                                        {profile?.firstName || <span className="text-slate-400 italic">Not provided</span>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">Last Name</label>
                                    <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-slate-700 font-medium">
                                        {profile?.lastName || <span className="text-slate-400 italic">Not provided</span>}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">Student ID</label>
                                <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-slate-700 font-medium">
                                    {profile?.studentId || <span className="text-slate-400 italic">Not provided</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">Institution Name</label>
                                <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-slate-700 font-medium">
                                    {profile?.institutionName || <span className="text-slate-400 italic">Not provided</span>}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 py-3 px-6 bg-white text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                                >
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

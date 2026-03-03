import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getProfessorProfile, updateProfessorProfile } from '../services/firestoreService';
import { ProfessorProfile, InstitutionType } from '../types';

interface ProfessorProfilePageProps {
    user: User | null;
}

export const ProfessorProfilePage: React.FC<ProfessorProfilePageProps> = ({ user }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfessorProfile | null>(null);

    // Form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [profession, setProfession] = useState("");
    const [institutionType, setInstitutionType] = useState<InstitutionType>('University');
    const [institutionName, setInstitutionName] = useState("");

    useEffect(() => {
        if (user?.uid) {
            loadProfile();
        }
    }, [user?.uid]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await getProfessorProfile(user!.uid);
            if (data) {
                setProfile(data);
                setFirstName(data.firstName || "");
                setLastName(data.lastName || "");
                setProfession(data.profession || "");
                setInstitutionType(data.institutionType || 'University');
                setInstitutionName(data.institutionName || "");
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
            const newProfile: ProfessorProfile = {
                uid: user.uid,
                email: user.email || "",
                firstName,
                lastName,
                profession,
                institutionType,
                institutionName,
                updatedAt: Date.now()
            };
            await updateProfessorProfile(newProfile);
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
        : user?.email?.[0].toUpperCase() || 'P';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Profile
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-6 mb-10">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl text-white font-bold">
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (user?.email || 'Professor')}
                        </h2>
                        <p className="text-slate-500 font-medium">
                            {profile?.profession || 'Instructor Account'}
                            {profile?.institutionName && ` at ${profile.institutionName}`}
                        </p>
                    </div>
                </div>

                {isEditing ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Professional Role</label>
                            <input
                                type="text"
                                value={profession}
                                onChange={e => setProfession(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="e.g. UX Design Professor"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Institution Type</label>
                                <select
                                    value={institutionType}
                                    onChange={e => setInstitutionType(e.target.value as InstitutionType)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                >
                                    <option value="University">University / College</option>
                                    <option value="Company">Company / Agency</option>
                                    <option value="Freelance">Independent / Freelance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Institution Name</label>
                                <input
                                    type="text"
                                    value={institutionName}
                                    onChange={e => setInstitutionName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="e.g. Stanford University"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                disabled={saving}
                                className="flex-1 py-3 px-6 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 px-6 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Saving...
                                    </>
                                ) : 'Save Changes'}
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
                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">Professional Role</label>
                            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-slate-700 font-medium">
                                {profile?.profession || <span className="text-slate-400 italic">Not provided</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">Institution Type</label>
                                <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-slate-700 font-medium">
                                    {profile?.institutionType || <span className="text-slate-400 italic">Not provided</span>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">Institution Name</label>
                                <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-slate-700 font-medium">
                                    {profile?.institutionName || <span className="text-slate-400 italic">Not provided</span>}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-slate-400 text-sm">
                                {user?.email}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


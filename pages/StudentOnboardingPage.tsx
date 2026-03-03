import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssignmentByCode } from '../services/firestoreService';

interface StudentOnboardingPageProps {
    studentName: string;
    setStudentName: (name: string) => void;
    studentId: string;
    setStudentId: (id: string) => void;
    assignmentCode: string;
    setAssignmentCode: (code: string) => void;
    setAssignmentId: (id: string) => void;
    setAssignmentTitle: (title: string) => void;
    setProfessorId: (id: string) => void;
}

export const StudentOnboardingPage: React.FC<StudentOnboardingPageProps> = ({
    studentName,
    setStudentName,
    studentId,
    setStudentId,
    assignmentCode,
    setAssignmentCode,
    setAssignmentId,
    setAssignmentTitle,
    setProfessorId
}) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartAuditing = async () => {
        if (!studentName || !assignmentCode) return;
        setLoading(true);
        setError(null);
        try {
            const asg = await getAssignmentByCode(assignmentCode);
            if (asg) {
                setAssignmentId(asg.id);
                setAssignmentTitle(asg.title);
                setProfessorId(asg.professorId);
                navigate('/student/auditor');
            } else {
                setError("Invalid or inactive assignment code.");
            }
        } catch (err) {
            setError("Failed to verify code.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Start Audit Session</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (Optional)</label>
                        <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="650XXXXX" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assignment Code</label>
                        <input
                            type="text"
                            value={assignmentCode}
                            onChange={e => setAssignmentCode(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono tracking-wider"
                            placeholder="e.g. 1234-STUDY"
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    <div className="pt-4 flex flex-col gap-3">
                        <div className="flex gap-3">
                            <button onClick={() => navigate('/')} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Back</button>
                            <button
                                onClick={handleStartAuditing}
                                disabled={!studentName || !assignmentCode || loading}
                                className={`flex-1 py-2 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${(!studentName || !assignmentCode || loading) ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {loading ? <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 'Start Auditing'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

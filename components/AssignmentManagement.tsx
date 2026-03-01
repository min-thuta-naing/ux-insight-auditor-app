import React, { useState, useEffect } from 'react';
import { Assignment } from '../types';
import { createAssignment, getAssignments, deleteAssignment } from '../services/firestoreService';

interface AssignmentManagementProps {
    professorId: string;
    onSelectAssignment: (assignmentId: string) => void;
}

export const AssignmentManagement: React.FC<AssignmentManagementProps> = ({ professorId, onSelectAssignment }) => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadAssignments();
    }, [professorId]);

    const loadAssignments = async () => {
        try {
            const data = await getAssignments(professorId);
            setAssignments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle) return;

        setSaving(true);
        try {
            await createAssignment({
                professorId,
                title: newTitle,
                description: newDesc,
                status: 'active'
            });
            setShowModal(false);
            setNewTitle("");
            setNewDesc("");
            loadAssignments();
        } catch (err) {
            alert("Failed to create assignment");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!assignmentToDelete) return;
        setDeleting(true);
        try {
            await deleteAssignment(assignmentToDelete.id);
            setAssignmentToDelete(null);
            loadAssignments();
        } catch (err) {
            alert("Failed to delete assignment");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assignment Management</h1>
                    <p className="text-slate-500 mt-1">Create and manage academic UX audit assessments</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Create Assignment
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : assignments.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No assignments yet</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">Create your first assignment to start receiving student UX audit submissions.</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-indigo-600 font-bold hover:underline py-2 px-4"
                    >
                        Create Assignment &rarr;
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map((asg) => (
                        <div
                            key={asg.id}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-500 transition-all group flex flex-col h-full relative"
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAssignmentToDelete(asg);
                                }}
                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="Delete Assignment"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>

                            <div className="flex justify-between items-start mb-4 pr-8">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${asg.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {asg.status}
                                </span>
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-mono font-bold border border-indigo-100">
                                    {asg.code}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{asg.title}</h3>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-1">{asg.description || 'No description provided.'}</p>
                            <button
                                onClick={() => onSelectAssignment(asg.id)}
                                className="w-full py-2.5 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm group-hover:shadow-md"
                            >
                                View Dashboard
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Assignment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">New Assignment</h2>
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Title</label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    placeholder="e.g., Heuristic Evaluation of E-commerce"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="w-full border-slate-200 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Description</label>
                                <textarea
                                    placeholder="Instructions for students..."
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    rows={3}
                                    className="w-full border-slate-200 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium resize-none"
                                />
                                <p className="text-[10px] text-slate-400 mt-2 italic">* A unique assignment code will be automatically generated.</p>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:bg-indigo-300"
                                >
                                    {saving ? (
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {assignmentToDelete && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Delete Assignment?</h2>
                        <p className="text-slate-500 text-center mb-8">
                            Are you sure you want to delete <span className="font-bold text-slate-900">"{assignmentToDelete.title}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setAssignmentToDelete(null)}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:bg-red-300"
                            >
                                {deleting ? (
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { getAllUsers, deleteUserProfile } from '../services/firestoreService';
import { UserManagementItem } from '../types';
import { useToast } from '../components/Toast';

export const ProfessorUsersPage: React.FC = () => {
    const [users, setUsers] = useState<UserManagementItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [userToDelete, setUserToDelete] = useState<UserManagementItem | null>(null);
    const { addToast } = useToast();

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            addToast('error', 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Reset to page 1 when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        try {
            await deleteUserProfile(userToDelete.uid, userToDelete.role);
            setUsers(users.filter(u => u.uid !== userToDelete.uid));
            addToast('success', `${userToDelete.role === 'student' ? 'Student' : 'Professor'} deleted successfully`);
        } catch (error) {
            console.error('Failed to delete user:', error);
            addToast('error', 'Failed to delete user');
        } finally {
            setUserToDelete(null);
        }
    };

    const filteredUsers = users.filter((user) =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (`${user.firstName} ${user.lastName}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.studentId && user.studentId.includes(searchQuery))
    );

    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);

    const handleDownloadCSV = () => {
        if (filteredUsers.length === 0) {
            addToast('error', 'No users to download');
            return;
        }

        const headers = ['First Name', 'Last Name', 'Email', 'Role', 'User ID/Student ID'];
        const rows = filteredUsers.map(user => {
            const identifier = user.role === 'student' && user.studentId ? user.studentId : user.uid;
            return [
                `"${user.firstName || ''}"`,
                `"${user.lastName || ''}"`,
                `"${user.email || ''}"`,
                `"${user.role || ''}"`,
                `"${identifier || ''}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'ux_auditor_users.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        addToast('success', 'User list downloaded successfully');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">User Management</h1>
                    <p className="text-slate-500 font-medium">Manage all student and instructor accounts.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Search Bar and Counts */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by email, name, or student ID..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none font-medium text-slate-700 placeholder-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {!isLoading && (
                        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                            <div className="px-4 py-2.5 bg-indigo-50 border border-indigo-100/50 rounded-xl flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                                <span className="text-sm font-black text-indigo-950">{users.filter(u => u.role === 'professor').length}</span>
                                <span className="text-sm font-semibold text-indigo-800 hidden md:inline">Professors</span>
                            </div>
                            <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-100/50 rounded-xl flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                <span className="text-sm font-black text-emerald-950">{users.filter(u => u.role === 'student').length}</span>
                                <span className="text-sm font-semibold text-emerald-800 hidden md:inline">Students</span>
                            </div>
                            <button
                                onClick={handleDownloadCSV}
                                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-xl flex items-center gap-2.5 transition-all shadow-sm"
                                title="Download CSV"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="text-sm font-bold">Export</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500 animate-pulse font-medium">Loading users...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100/80 border-b-2 border-slate-300 text-slate-600 uppercase text-xs tracking-wider font-bold shadow-sm">
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">User ID / Student ID</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map((user, index) => (
                                    <tr 
                                        key={user.uid} 
                                        className={`border-b border-slate-200 hover:bg-slate-100/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                    >
                                        <td className="px-6 py-4 font-bold text-slate-800">
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black shadow-sm ${user.role === 'professor'
                                                    ? 'bg-indigo-100 text-indigo-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-sm whitespace-nowrap">
                                            {user.role === 'student' && user.studentId ? user.studentId : user.uid.substring(0, 8) + '...'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setUserToDelete(user)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete User"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                                            No users found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {!isLoading && filteredUsers.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-6 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                            <span>Rows per page:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-6">
                            <span>
                                {startIndex + 1}-{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems}
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                    title="Previous Page"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                    title="Next Page"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setUserToDelete(null)} />
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete User?</h3>
                        <p className="text-slate-500 text-center mb-8 font-medium">
                            Are you sure you want to delete <strong className="text-slate-700">{userToDelete.email}</strong>? This will remove their profile from the database, but retains their auth credentials.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="w-full py-4 px-6 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="w-full py-4 px-6 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { SavedAudit, StudentSubmission } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  audits: SavedAudit[];
  submissions: StudentSubmission[];
  onLoad: (audit: SavedAudit) => void;
  onDelete: (id: string) => void;
  studentName?: string;
  studentId?: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ 
    isOpen, 
    onClose, 
    audits, 
    submissions,
    onLoad, 
    onDelete,
    studentName,
    studentId
}) => {
  const [activeTab, setActiveTab] = useState<'drafts' | 'submissions'>('drafts');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  if (!isOpen) return null;

  const handleDownloadReceipt = async (sub: StudentSubmission) => {
    if (!receiptRef.current) return;
    
    try {
        setDownloadingId(sub.id);
        // Wait for React to fully flush the template update to the DOM
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const canvas = await html2canvas(receiptRef.current, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowWidth: 400
        });

        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `Audit_Receipt_${sub.refCode}.png`;
        link.click();
    } catch (err) {
        console.error("Failed to generate image receipt:", err);
        alert("Failed to generate image receipt.");
    } finally {
        setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
            className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" 
            aria-hidden="true"
            onClick={onClose}
        ></div>

        {/* Modal Panel */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="relative inline-flex flex-col align-top bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-4 sm:align-top sm:max-w-3xl sm:w-full h-[95vh]">
          
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-[#D4C9BE]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-bold text-slate-900" id="modal-title">
                My History
                </h3>
                <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-500 focus:outline-none"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2">
                <button 
                    onClick={() => setActiveTab('drafts')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'drafts' 
                            ? 'bg-student-100 text-student-700 shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    Saved Drafts ({audits.length})
                </button>
                <button 
                    onClick={() => setActiveTab('submissions')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'submissions' 
                            ? 'bg-student-100 text-student-700 shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    Final Submissions ({submissions.length})
                </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-4 sm:p-6 flex-1 overflow-y-auto relative">
            {activeTab === 'drafts' ? (
                audits.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <p>No active drafts.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {audits.map((audit) => {
                            const avgScore = Math.round(
                                audit.reports.reduce((acc, r) => acc + r.overall_score, 0) / audit.reports.length
                            );
                            
                            return (
                                <div key={audit.id} className="bg-white p-4 rounded-lg shadow-sm border-2 border-[#FFE99A] flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                                    <div className="w-full sm:w-24 h-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border border-[#D4C9BE]/20">
                                        <img src={audit.imageSrc} alt="Thumbnail" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs text-slate-500">{new Date(audit.timestamp).toLocaleString()}</p>
                                                <h4 className="font-bold text-slate-800 text-lg">Draft: {audit.heuristicMode === 'ALL' ? 'Full Audit' : audit.heuristicMode}</h4>
                                                <p className="text-sm text-slate-600">Persona: <span className="font-medium text-student-600">{audit.persona}</span></p>
                                            </div>
                                            <div className="text-2xl font-bold text-student-600">{avgScore}</div>
                                        </div>
                                        <div className="mt-4 flex gap-3 justify-end">
                                            <button onClick={() => setDeleteConfirmId(audit.id)} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors">Delete</button>
                                            <button onClick={() => onLoad(audit)} className="px-4 py-1.5 text-sm font-medium text-white bg-student-500 hover:bg-student-600 rounded shadow-sm">Resume Editing</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                submissions.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <p>No finalized submissions yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {submissions.map((sub) => {
                            const audit = sub.auditData;
                            const avgScore = Math.round(
                                audit.reports.reduce((acc, r) => acc + r.overall_score, 0) / audit.reports.length
                            );
                            
                            return (
                                <div key={sub.id} className="bg-white p-4 rounded-lg shadow-sm border-2 border-[#B9D4AA] flex flex-col sm:flex-row gap-4">
                                    <div className="w-full sm:w-24 h-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border border-[#D4C9BE]/20">
                                        <img src={audit.imageSrc} alt="Thumbnail" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-student-50 text-student-600 text-[10px] font-bold uppercase rounded border border-[#D4C9BE]">SUBMITTED</span>
                                                    <p className="text-xs text-slate-500">{new Date(sub.timestamp).toLocaleString()}</p>
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-lg">{audit.heuristicMode === 'ALL' ? 'Full Audit' : audit.heuristicMode}</h4>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                    <p className="text-xs text-slate-500">Ref: <span className="font-mono font-bold text-slate-700">{sub.refCode}</span></p>
                                                    <p className="text-xs text-slate-500">Student: <span className="font-bold text-slate-700">{sub.studentName}</span> {sub.studentId && <small className="ml-1 opacity-70">({sub.studentId})</small>}</p>
                                                    {sub.sessionCode && (
                                                        <p className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                                            Key: <span className="font-mono">{sub.sessionCode}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-2xl font-bold text-student-600">{avgScore}</div>
                                        </div>
                                        <div className="mt-4 flex gap-3 justify-end">
                                            <button 
                                                onClick={() => handleDownloadReceipt(sub)} 
                                                disabled={downloadingId === sub.id}
                                                className="px-3 py-1.5 text-sm font-medium text-student-600 hover:bg-student-100 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {downloadingId === sub.id ? (
                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                )}
                                                Receipt
                                            </button>
                                            <button onClick={() => onLoad({ ...audit, assignmentId: sub.assignmentId })} className="px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-[#D4C9BE] hover:bg-slate-50 rounded transition-colors">View Report</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* Hidden Receipt Template for html2canvas */}
            <div className="fixed left-[-9999px] top-0">
                <div ref={receiptRef} className="w-[400px] p-10 bg-white">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-100">
                             <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Submission</h2>
                        <h2 className="text-2xl font-bold text-slate-900">Receipt</h2>
                        <p className="text-slate-500 text-xs mt-1">UX Insight Auditor</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-[#D4C9BE] flex justify-between items-center text-left">
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Student Name</p>
                                <p className="text-slate-900 font-bold leading-tight">
                                    {submissions.find(s => s.id === downloadingId)?.studentName || studentName || 'Guest Student'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Student ID</p>
                                <p className="text-slate-900 font-bold font-mono">
                                    {submissions.find(s => s.id === downloadingId)?.studentId || studentId || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-student-50 p-6 rounded-xl border-2 border-dashed border-[#D4C9BE] text-center">
                            <p className="text-[10px] text-student-400 uppercase tracking-widest font-black mb-1">Receipt ID (Reference Code)</p>
                            <p className="text-3xl font-mono font-black text-student-500 tracking-tighter">
                                {submissions.find(s => s.id === downloadingId)?.refCode || '------'}
                            </p>
                        </div>

                        {submissions.find(s => s.id === downloadingId)?.sessionCode && (
                            <div className="bg-indigo-600 p-6 rounded-xl shadow-xl shadow-indigo-200 text-center text-white">
                                <p className="text-[10px] text-indigo-200 uppercase tracking-[0.2em] font-black mb-2">Next Round Key</p>
                                <p className="text-3xl font-mono font-black tracking-[0.1em]">
                                    {submissions.find(s => s.id === downloadingId)?.sessionCode}
                                </p>
                                <p className="text-[10px] text-indigo-100 mt-3 font-medium">Use this code to unlock Round {(submissions.find(s => s.id === downloadingId)?.roundNumber || 1) + 1}.</p>
                            </div>
                        )}
                        
                        <div className="pt-4 border-t border-[#D4C9BE] text-center">
                            <p className="text-[10px] text-slate-400">{new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Overlay */}
            {deleteConfirmId && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm transition-all rounded-lg">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-[#D4C9BE] animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600 mb-4 mx-auto">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Draft?</h3>
                        <p className="text-slate-500 text-center text-sm mb-6">
                            This action cannot be undone. This draft will be permanently removed from your history.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-2.5 px-4 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm border border-[#D4C9BE]"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    onDelete(deleteConfirmId);
                                    setDeleteConfirmId(null);
                                }}
                                className="flex-1 py-2.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm shadow-lg shadow-red-100"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </div>
          
          <div className="bg-white px-4 py-3 sm:px-6 flex justify-between items-center border-t border-[#D4C9BE]">
            <p className="text-xs text-slate-400">Submissions are permanent and cannot be deleted.</p>
            <button
              type="button"
              className="inline-flex justify-center rounded-lg border border-[#D4C9BE] shadow-sm px-4 py-2 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
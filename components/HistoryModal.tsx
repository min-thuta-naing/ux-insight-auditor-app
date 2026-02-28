import React from 'react';
import { SavedAudit } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  audits: SavedAudit[];
  onLoad: (audit: SavedAudit) => void;
  onDelete: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, audits, onLoad, onDelete }) => {
  if (!isOpen) return null;

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
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-slate-100">
            <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-bold text-slate-900" id="modal-title">
                Audit History
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
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-4 sm:p-6 max-h-[60vh] overflow-y-auto">
            {audits.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                    <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No saved audits yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {audits.map((audit) => {
                        const avgScore = Math.round(
                            audit.reports.reduce((acc, r) => acc + r.overall_score, 0) / audit.reports.length
                        );
                        
                        return (
                            <div key={audit.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                                {/* Thumbnail */}
                                <div className="w-full sm:w-24 h-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border border-slate-100">
                                    <img src={audit.imageSrc} alt="Thumbnail" className="w-full h-full object-cover" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                {new Date(audit.timestamp).toLocaleString()}
                                            </p>
                                            <h4 className="font-bold text-slate-800 text-lg">
                                                {audit.heuristicMode === 'ALL' ? 'Full Audit (H1-H10)' : `${audit.heuristicMode} Analysis`}
                                            </h4>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Persona: <span className="font-medium text-indigo-600">{audit.persona}</span>
                                            </p>
                                        </div>
                                        <div className={`text-2xl font-bold ${
                                            avgScore >= 80 ? 'text-green-600' : 
                                            avgScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                            {avgScore}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 flex gap-3 justify-end">
                                        <button 
                                            onClick={() => onDelete(audit.id)}
                                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            onClick={() => onLoad(audit)}
                                            className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm transition-colors"
                                        >
                                            Load Results
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-100">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
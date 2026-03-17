import React from 'react';

interface RoundConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    roundNumber: number;
    isUpdating: boolean;
}

export const RoundConfirmationModal: React.FC<RoundConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    roundNumber,
    isUpdating
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
                onClick={onClose} 
            />
            
            {/* Modal Panel */}
            <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative z-10 animate-in zoom-in slide-in-from-bottom-4 duration-300 border border-slate-200">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center justify-center mb-6 mx-auto">
                    <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h3 className="text-2xl font-black text-slate-900 text-center mb-2">Advance to Round {roundNumber}?</h3>
                <p className="text-slate-500 text-center mb-8 font-medium italic text-sm">Please review these important details before proceeding:</p>

                <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-black text-indigo-600">01</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                            <span className="block text-slate-900 uppercase tracking-tighter text-[10px] mb-0.5">Permanent Action</span>
                            This cannot be undone. Round {roundNumber - 1} will be finalized.
                        </p>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-black text-indigo-600">02</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                            <span className="block text-slate-900 uppercase tracking-tighter text-[10px] mb-0.5">2-Round Limit</span>
                            Maximum of 2 rounds per assignment. This uses your second slot.
                        </p>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-black text-indigo-600">03</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                            <span className="block text-slate-900 uppercase tracking-tighter text-[10px] mb-0.5">Class Finalization</span>
                            Focus shifts to the new round. Previous submissions remain viewable.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onClose}
                        disabled={isUpdating}
                        className="w-full py-4 px-6 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-sm uppercase tracking-widest border border-slate-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isUpdating}
                        className="w-full py-4 px-6 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                        {isUpdating ? (
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            'Confirm'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

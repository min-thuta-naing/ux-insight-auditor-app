import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { StudentSubmission } from '../types';

interface SubmissionSuccessPageProps {
    lastSubmission: StudentSubmission | null;
    studentName: string;
    studentId: string;
    setReports: (reports: any[]) => void;
    setSelectedImage: (image: string | null) => void;
}

export const SubmissionSuccessPage: React.FC<SubmissionSuccessPageProps> = ({
    lastSubmission,
    studentName,
    studentId,
    setReports,
    setSelectedImage
}) => {
    const navigate = useNavigate();
    const receiptRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    const handleDownloadReceipt = async () => {
        if (!receiptRef.current || !lastSubmission) return;

        try {
            setLoading(true);
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: "#ffffff",
                logging: false,
                useCORS: true
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `Audit_Receipt_${lastSubmission.refCode}.png`;
            link.click();
        } catch (err) {
            console.error("Failed to generate image receipt:", err);
            alert("Failed to generate image receipt. Please take a screenshot instead.");
        } finally {
            setLoading(false);
        }
    };

    if (!lastSubmission) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">No submission found</h2>
                    <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 font-bold">Return Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-100">
                <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100/50">
                        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Submission Received!</h2>
                <p className="text-slate-600 mb-6">Your audit has been successfully submitted to the class dashboard.</p>

                <div ref={receiptRef} className="flex flex-col gap-4 mb-8 bg-white p-2">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center text-left">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Student Name</p>
                            <p className="text-slate-900 font-bold">{studentName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Student ID</p>
                            <p className="text-slate-900 font-bold font-mono">{studentId || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="bg-indigo-50/50 p-6 rounded-2xl border-2 border-dashed border-indigo-100 relative group">
                        <p className="text-xs text-indigo-400 uppercase tracking-widest font-black mb-1">Official Reference Code</p>
                        <p className="text-5xl font-mono font-black text-indigo-600 tracking-tighter">{lastSubmission?.refCode}</p>
                        <p className="text-[10px] text-slate-400 mt-3 italic">This code is your permanent proof of work.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleDownloadReceipt}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg transition-all active:scale-95 disabled:opacity-70"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        )}
                        {loading ? 'Generating Receipt...' : 'Download PNG Receipt'}
                    </button>

                    <div className="flex gap-4">
                        <button onClick={() => { setReports([]); setSelectedImage(null); navigate('/'); }} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors">Return Home</button>
                        <button onClick={() => { setReports([]); setSelectedImage(null); navigate('/student/auditor'); }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold shadow-lg transition-transform active:scale-95">New Audit</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

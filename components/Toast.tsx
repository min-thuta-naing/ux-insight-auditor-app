import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  description?: string;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, description }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const latestType = toasts.length > 0 ? toasts[toasts.length - 1].type : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className={`fixed inset-0 z-[199] bg-gradient-to-b to-transparent pointer-events-none transition-colors duration-500 animate-in fade-in ${
          latestType === 'error' ? 'from-[#FFCDC9]/60' : 
          latestType === 'success' ? 'from-[#C7EABB]/60' : 'from-black/40'
        }`} />
      )}
      <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full bg-white rounded-2xl shadow-2xl border-l-4 border-b-4 border-r-4 p-4 flex items-start gap-4 animate-in slide-in-from-top-10 duration-500 ease-out ${
              toast.type === 'success' ? 'border-green-500' : 
              toast.type === 'error' ? 'border-red-500' : 'border-student-500'
            }`}
          >
            <div className={`mt-0.5 rounded-full p-1.5 flex-shrink-0 ${
              toast.type === 'success' ? 'bg-green-50 text-green-600' : 
              toast.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-student-50 text-student-600'
            }`}>
              {toast.type === 'success' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">{toast.message}</h4>
              {toast.description && (
                <p className="text-xs text-slate-500 mt-1 font-medium">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

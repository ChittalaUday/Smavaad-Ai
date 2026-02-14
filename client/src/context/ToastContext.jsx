import React, { createContext, useContext, useState, useEffect } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = "success", duration = 4000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-2xl glass-effect shadow-2xl backdrop-blur-xl border border-white/20 animate-slide-in transition-all duration-300 ${toast.type === "success" ? "bg-green-500/10 border-green-500/20" :
                                toast.type === "error" ? "bg-red-500/10 border-red-500/20" :
                                    "bg-blue-500/10 border-blue-500/20"
                            }`}
                    >
                        <div className={`p-2 rounded-full shrink-0 ${toast.type === "success" ? "bg-green-500/20 text-green-500" :
                                toast.type === "error" ? "bg-red-500/20 text-red-500" :
                                    "bg-blue-500/20 text-blue-500"
                            }`}>
                            {toast.type === "success" && <CheckCircle size={20} />}
                            {toast.type === "error" && <XCircle size={20} />}
                            {toast.type === "info" && <Info size={20} />}
                        </div>

                        <p className={`text-sm font-medium flex-1 ${toast.type === "success" ? "text-green-700 dark:text-green-300" :
                                toast.type === "error" ? "text-red-700 dark:text-red-300" :
                                    "text-blue-700 dark:text-blue-300"
                            }`}>
                            {toast.message}
                        </p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <style jsx>{`
        .glass-effect {
          background: rgba(255, 255, 255, 0.7);
        }
        .dark .glass-effect {
          background: rgba(15, 23, 42, 0.6);
        }
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
        </ToastContext.Provider>
    );
};

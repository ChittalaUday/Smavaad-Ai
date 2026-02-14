import React from 'react';
import { Loader2 } from 'lucide-react';

const ActionLoader = ({ message }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center transform transition-all scale-100">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                    <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Processing Request</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{message || 'Please wait while we process your request...'}</p>
                </div>
            </div>
        </div>
    );
};

export default ActionLoader;

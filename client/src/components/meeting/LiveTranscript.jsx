import React, { useRef, useEffect } from "react";

/**
 * LiveTranscript — Collapsible side panel showing real-time transcript
 * and extracted intents during an active call.
 */
const LiveTranscript = ({ transcript, extractedIntents, isOpen, onClose }) => {
    const scrollRef = useRef(null);

    // Auto-scroll to bottom on new transcript text
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript]);

    if (!isOpen) return null;

    const hasIntents =
        extractedIntents.action_items?.length > 0 ||
        extractedIntents.deadlines?.length > 0 ||
        extractedIntents.decisions?.length > 0;

    return (
        <div className="absolute top-20 right-4 w-80 max-h-[calc(100vh-160px)] flex flex-col bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-in-right z-40">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-lg shadow-indigo-500/50" />
                    <span className="font-bold text-white text-sm tracking-wide">
                        AI Insights & Transcript
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                    ✕
                </button>
            </div>

            {/* Extracted Intents (Top Priority) */}
            {hasIntents && (
                <div className="p-4 bg-indigo-500/10 border-b border-white/5 space-y-3">
                    {extractedIntents.action_items?.length > 0 && (
                        <div>
                            <h5 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Action Items</h5>
                            {extractedIntents.action_items.slice(-2).map((item, i) => ( // Show last 2
                                <div key={`action-${i}`} className="text-xs text-white bg-indigo-500/20 px-2 py-1.5 rounded-lg border border-indigo-500/20 mb-1 last:mb-0">
                                    {item.task}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Transcript Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
            >
                {transcript ? (
                    <div className="flex flex-col gap-2">
                        {/* 
                           We could split transcript by speaker if available, 
                           but for now just raw text wrapped in a bubble 
                        */}
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
                            {transcript}
                        </p>
                    </div>
                ) : (
                    <div className="text-center text-slate-500 py-8 flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                            <div className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-indigo-400 opacity-20"></div>
                            <span className="text-xl">🎤</span>
                        </div>
                        <p className="text-sm">Listening for conversation...</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-white/5 text-center">
                <p className="text-[10px] text-slate-500">AI is analyzing the conversation in real-time</p>
            </div>
        </div>
    );
};

export default LiveTranscript;

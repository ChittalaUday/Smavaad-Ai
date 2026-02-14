import React from "react";
import { Download, Share2, ClipboardList, CheckSquare, Clock, X, RefreshCw, FileText, Music, Sparkles } from "lucide-react";

/**
 * CallWrapUp — Post-call summary card shown when call state is ENDED.
 * Displays call metadata, AI-generated summary, and action item checklist.
 */
const CallWrapUp = ({
    callDuration,
    formattedDuration,
    callSummary,
    extractedIntents,
    transcript,
    onDismiss,
    isLoading,
    meetingFiles = { audioUrl: null, pdfUrl: null },
    onRetrySummarize,
}) => {
    const actionItems = [
        ...(callSummary?.action_items || []),
        ...(extractedIntents?.action_items || []),
    ];

    // Deduplicate action items by task text
    const uniqueActions = actionItems.reduce((acc, item) => {
        const exists = acc.find(
            (a) => a.task.toLowerCase() === item.task.toLowerCase()
        );
        if (!exists) acc.push(item);
        return acc;
    }, []);

    const handleDownload = (url, filename) => {
        if (!url) return;
        const fullUrl = url.startsWith("http")
            ? url
            : `${import.meta.env.VITE_SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
        const link = document.createElement("a");
        link.href = fullUrl;
        link.download = filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] shadow-2xl rounded-3xl relative">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                Meeting Wrapped
                            </h2>
                            <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium mt-0.5">
                                <Clock size={14} />
                                <span>{formattedDuration}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5 hover:border-white/20"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8 relative z-10">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-slate-400 mt-4 text-sm font-medium animate-pulse">
                                Crafting your meeting summary...
                            </p>
                        </div>
                    )}

                    {/* Summary */}
                    {callSummary?.summary && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                                    <FileText size={16} />
                                </span>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Executive Summary
                                </h3>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 leading-relaxed text-slate-300 text-sm">
                                {callSummary.summary}
                            </div>
                        </div>
                    )}

                    {/* Key Topics */}
                    {callSummary?.key_topics?.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">
                                Key Topics
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {callSummary.key_topics.map((topic, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/20 transition-colors cursor-default"
                                    >
                                        #{topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Items */}
                    {uniqueActions.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                                    <ClipboardList size={16} />
                                </span>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Action Items
                                </h3>
                            </div>
                            <div className="grid gap-2">
                                {uniqueActions.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 border border-white/5 transition-colors group"
                                    >
                                        <div className="mt-1 text-emerald-500">
                                            <CheckSquare size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-200 font-medium">{item.task}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                {item.owner && (
                                                    <span className="text-xs text-slate-400 bg-black/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        👤 {item.owner}
                                                    </span>
                                                )}
                                                {item.deadline && (
                                                    <span className="text-xs text-slate-400 bg-black/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        📅 {item.deadline}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Downloads Section */}
                    {(meetingFiles?.audioUrl || meetingFiles?.pdfUrl) && (
                        <div className="pt-4 border-t border-white/10">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 ml-1">
                                Assets & Downloads
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {meetingFiles.audioUrl && (
                                    <button
                                        onClick={() => handleDownload(meetingFiles.audioUrl, `meeting-audio-${Date.now()}.webm`)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                                    >
                                        <Music size={16} /> Audio Recording
                                    </button>
                                )}
                                {meetingFiles.pdfUrl && (
                                    <button
                                        onClick={() => handleDownload(meetingFiles.pdfUrl, `meeting-report-${Date.now()}.pdf`)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold border border-white/10 transition-all hover:scale-[1.02]"
                                    >
                                        <FileText size={16} /> PDF Report
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No summary fallback */}
                    {!isLoading && !callSummary?.summary && (
                        <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                            {transcript ? (
                                <div className="flex flex-col items-center gap-3">
                                    <p className="text-slate-400 text-sm">
                                        Summary generation failed or was skipped.
                                    </p>
                                    <button
                                        onClick={onRetrySummarize}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors font-medium"
                                    >
                                        <RefreshCw size={14} /> Retry Generation
                                    </button>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm">
                                    No transcript data available to assume.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 p-6 flex justify-end bg-black/20">
                    <button
                        onClick={onDismiss}
                        className="px-8 py-2.5 bg-white text-slate-900 hover:bg-slate-200 rounded-xl text-sm font-bold shadow-lg transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallWrapUp;

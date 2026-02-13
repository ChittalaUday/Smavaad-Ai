import React from "react";

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
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                📋 Call Wrap-Up
                            </h2>
                            <p className="text-indigo-200 text-sm mt-1">
                                Call duration: {formattedDuration}
                            </p>
                        </div>
                        <button
                            onClick={onDismiss}
                            className="text-white/70 hover:text-white text-2xl font-light transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
                            <p className="text-gray-400 mt-3 text-sm">
                                Generating call summary...
                            </p>
                        </div>
                    )}

                    {/* Summary */}
                    {callSummary?.summary && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Summary
                            </h3>
                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                    {callSummary.summary}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Key Topics */}
                    {callSummary?.key_topics?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Key Topics
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {callSummary.key_topics.map((topic, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-xs border border-indigo-700"
                                    >
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Items */}
                    {uniqueActions.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Action Items
                            </h3>
                            <div className="space-y-2">
                                {uniqueActions.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 bg-gray-800 rounded-lg p-3 border border-gray-700"
                                    >
                                        <input
                                            type="checkbox"
                                            className="mt-1 rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-200">{item.task}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                {item.owner && (
                                                    <span className="text-xs text-gray-400">
                                                        👤 {item.owner}
                                                    </span>
                                                )}
                                                {item.deadline && (
                                                    <span className="text-xs text-gray-400">
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

                    {/* Decisions */}
                    {extractedIntents?.decisions?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Decisions Made
                            </h3>
                            <div className="space-y-2">
                                {extractedIntents.decisions.map((item, i) => (
                                    <div
                                        key={i}
                                        className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-start gap-2"
                                    >
                                        <span className="text-purple-400 flex-shrink-0">✓</span>
                                        <p className="text-sm text-gray-200">
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Transcript Preview */}
                    {transcript && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Transcript
                            </h3>
                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-h-40 overflow-y-auto">
                                <p className="text-gray-400 text-xs leading-relaxed whitespace-pre-wrap">
                                    {transcript}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Downloads Section */}
                    {(meetingFiles?.audioUrl || meetingFiles?.pdfUrl) && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Downloads
                            </h3>
                            <div className="flex flex-wrap gap-4">
                                {meetingFiles.audioUrl && (
                                    <button
                                        onClick={() => handleDownload(meetingFiles.audioUrl, `meeting-audio-${Date.now()}.webm`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 rounded-lg text-sm border border-indigo-700/50 transition-colors"
                                    >
                                        <span>🎵</span> Download Audio
                                    </button>
                                )}
                                {meetingFiles.pdfUrl && (
                                    <button
                                        onClick={() => handleDownload(meetingFiles.pdfUrl, `meeting-report-${Date.now()}.pdf`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-lg text-sm border border-purple-700/50 transition-colors"
                                    >
                                        <span>📄</span> Download PDF Report
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No summary fallback */}
                    {!isLoading && !callSummary?.summary && (
                        <div className="text-center py-8">
                            {transcript ? (
                                <>
                                    <p className="text-gray-400 text-sm mb-4">
                                        AI summary could not be generated automatically.
                                    </p>
                                    <button
                                        onClick={onRetrySummarize}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
                                    >
                                        <span>🔄</span> Retry AI Summary
                                    </button>
                                </>
                            ) : (
                                <p className="text-gray-500 text-sm">
                                    No transcript was captured during this call.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 p-4 flex justify-end">
                    <button
                        onClick={onDismiss}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallWrapUp;

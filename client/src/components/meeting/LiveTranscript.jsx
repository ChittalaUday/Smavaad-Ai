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
        <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-gray-900 border-l border-gray-700 z-50 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="font-semibold text-white text-sm">
                        Live Transcript
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Transcript Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-2"
                style={{ scrollBehavior: "smooth" }}
            >
                {transcript ? (
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {transcript}
                    </p>
                ) : (
                    <div className="text-center text-gray-500 mt-8">
                        <p className="text-lg">🎤</p>
                        <p className="text-sm mt-2">
                            Listening... Speak to see your transcript here.
                        </p>
                    </div>
                )}
            </div>

            {/* Extracted Intents Section */}
            {hasIntents && (
                <div className="border-t border-gray-700 p-4 max-h-48 overflow-y-auto">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Detected Items
                    </h4>

                    {extractedIntents.action_items?.length > 0 && (
                        <div className="mb-2">
                            {extractedIntents.action_items.map((item, i) => (
                                <div
                                    key={`action-${i}`}
                                    className="flex items-start gap-2 mb-1"
                                >
                                    <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-blue-600 text-blue-100 flex-shrink-0 mt-0.5">
                                        Action
                                    </span>
                                    <span className="text-xs text-gray-300">
                                        {item.task}
                                        {item.owner && (
                                            <span className="text-gray-500"> → {item.owner}</span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {extractedIntents.decisions?.length > 0 && (
                        <div className="mb-2">
                            {extractedIntents.decisions.map((item, i) => (
                                <div
                                    key={`decision-${i}`}
                                    className="flex items-start gap-2 mb-1"
                                >
                                    <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-purple-600 text-purple-100 flex-shrink-0 mt-0.5">
                                        Decision
                                    </span>
                                    <span className="text-xs text-gray-300">
                                        {item.description}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {extractedIntents.deadlines?.length > 0 && (
                        <div>
                            {extractedIntents.deadlines.map((item, i) => (
                                <div
                                    key={`deadline-${i}`}
                                    className="flex items-start gap-2 mb-1"
                                >
                                    <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-amber-600 text-amber-100 flex-shrink-0 mt-0.5">
                                        Deadline
                                    </span>
                                    <span className="text-xs text-gray-300">
                                        {item.description}
                                        {item.date && (
                                            <span className="text-gray-500"> — {item.date}</span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LiveTranscript;

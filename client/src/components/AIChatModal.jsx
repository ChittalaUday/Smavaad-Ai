import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, X, Sparkles, User } from "lucide-react";

const AIChatModal = ({ isOpen, onClose, checkId, chatFunction }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Reset messages when chat source changes
    useEffect(() => {
        setMessages([]);
    }, [checkId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        if (!checkId) {
            console.error("No ID provided for chat");
            return;
        }

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        const currentInput = input;
        setInput("");
        setIsLoading(true);

        // Add placeholder for assistant
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        await chatFunction(
            checkId,
            currentInput,
            (chunk) => {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (newMessages[lastIndex].role === "assistant") {
                        newMessages[lastIndex] = {
                            ...newMessages[lastIndex],
                            content: newMessages[lastIndex].content + chunk,
                        };
                    }
                    return newMessages;
                });
            },
            () => {
                setIsLoading(false);
            },
            (error) => {
                console.error("AIChat Error:", error);
                setIsLoading(false);
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (newMessages[lastIndex].role === "assistant" && !newMessages[lastIndex].content) {
                        newMessages[lastIndex] = { ...newMessages[lastIndex], content: "Error: Failed to get response." };
                    }
                    return newMessages;
                });
            }
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div
                className="relative w-full max-w-2xl h-[80vh] flex flex-col rounded-3xl shadow-2xl border border-white/10"
                style={{
                    background: "linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.98) 100%)",
                }}
            >
                {/* ─── Header ─── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 rounded-t-3xl flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">Ask AI</h2>
                            <div className="flex items-center gap-1.5">
                                <Sparkles size={10} className="text-indigo-400" />
                                <span className="text-[11px] text-indigo-300 font-medium">Powered by AI</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* ─── Messages ─── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    {!messages.length && (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <Bot size={32} className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-lg">How can I help?</p>
                                <p className="text-slate-400 text-sm mt-1">Ask anything about this conversation</p>
                            </div>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${msg.role === "user"
                                    ? "bg-indigo-600"
                                    : "bg-gradient-to-br from-purple-500 to-indigo-600"
                                }`}>
                                {msg.role === "user"
                                    ? <User size={14} className="text-white" />
                                    : <Bot size={14} className="text-white" />
                                }
                            </div>

                            {/* Bubble */}
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "bg-white/10 border border-white/5 text-slate-200 rounded-tl-none backdrop-blur-sm"
                                    }`}
                            >
                                <div className="whitespace-pre-wrap">{msg.content || (
                                    <span className="inline-flex items-center gap-1 text-slate-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </span>
                                )}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                                <Bot size={14} className="text-white" />
                            </div>
                            <div className="bg-white/10 border border-white/5 text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm backdrop-blur-sm">
                                <span className="inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* ─── Input ─── */}
                <div className="p-4 border-t border-white/10 bg-white/5 rounded-b-3xl flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 bg-black/30 text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/30 placeholder-slate-500 transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:shadow-none active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>

                {/* Decorative Glow — placed AFTER content so it doesn't interfere */}
                <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
            </div>
        </div>
    );
};

export default AIChatModal;

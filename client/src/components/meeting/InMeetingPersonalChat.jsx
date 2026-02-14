import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getChatMessages, sendMessage as sendMessageApi } from "../../api";
import { Send, ArrowLeft, X } from "lucide-react";
import Avatar from "react-avatar";
import moment from "moment";

/**
 * Lightweight dark-themed personal chat panel for in-meeting use.
 * Directly calls chat APIs instead of relying on the full ChatsSection.
 */
const InMeetingPersonalChat = ({ chatData, onBack, onClose }) => {
    const { user } = useAuth();
    const [chatMessages, setChatMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Derive the "other" user from chat participants
    const otherUser = chatData?.participants?.find(
        (p) => (p._id || p) !== user?._id
    );
    const chatName = chatData?.isGroupChat
        ? chatData.name
        : otherUser?.username || "Chat";

    // Load messages on mount
    useEffect(() => {
        if (!chatData?._id) return;

        const loadMessages = async () => {
            setLoading(true);
            try {
                const res = await getChatMessages(chatData._id);
                setChatMessages(res.data?.data || []);
            } catch (err) {
                console.error("Failed to load messages:", err);
            } finally {
                setLoading(false);
            }
        };

        loadMessages();
    }, [chatData?._id]);

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || sending || !chatData?._id) return;

        const text = inputText.trim();
        setInputText("");
        setSending(true);

        // Optimistic update
        const optimistic = {
            _id: `temp-${Date.now()}`,
            content: text,
            sender: { _id: user?._id, username: user?.username },
            createdAt: new Date().toISOString(),
            _optimistic: true,
        };
        setChatMessages((prev) => [...prev, optimistic]);

        try {
            const res = await sendMessageApi(chatData._id, text, []);
            // Replace optimistic message with real one
            setChatMessages((prev) =>
                prev.map((m) => (m._id === optimistic._id ? res.data?.data || optimistic : m))
            );
        } catch (err) {
            console.error("Failed to send message:", err);
            // Remove optimistic message
            setChatMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed top-20 right-4 w-80 max-h-[calc(100vh-160px)] flex flex-col bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-in-right z-[10001]">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 flex-shrink-0">
                <button
                    onClick={onBack}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                    title="Back to participants"
                >
                    <ArrowLeft size={16} />
                </button>
                <div className="flex items-center gap-2 min-w-0 flex-1 mx-3">
                    <Avatar
                        name={chatName}
                        src={otherUser?.avatar}
                        size="28"
                        round={true}
                        className="border border-white/20 flex-shrink-0"
                    />
                    <span className="font-bold text-white text-sm truncate">
                        {chatName}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                    <X size={16} />
                </button>
            </div>

            {/* ─── Messages ─── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide" style={{ minHeight: "250px", maxHeight: "calc(100vh - 280px)" }}>
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {!loading && chatMessages.length === 0 && (
                    <div className="text-center text-slate-500 py-10 text-xs">
                        No messages yet. Say hello! 👋
                    </div>
                )}

                {!loading &&
                    chatMessages.map((msg) => {
                        const isMine = (msg.sender?._id || msg.sender) === user?._id;
                        return (
                            <div
                                key={msg._id}
                                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                        {isMine ? "You" : msg.sender?.username || "Them"}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        {msg.createdAt && moment(msg.createdAt).format("HH:mm")}
                                    </span>
                                </div>
                                <div
                                    className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm break-words shadow-sm ${isMine
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "bg-white/10 border border-white/5 text-slate-200 rounded-tl-none"
                                        } ${msg._optimistic ? "opacity-60" : ""}`}
                                >
                                    {msg.content}
                                    {/* Attachments */}
                                    {msg.attachments?.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {msg.attachments.map((att, i) => (
                                                <a
                                                    key={i}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-indigo-300 underline block truncate"
                                                >
                                                    📎 {att.name || "Attachment"}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                <div ref={messagesEndRef} />
            </div>

            {/* ─── Input ─── */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/5 flex-shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-black/30 text-white rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-white/10 placeholder-slate-500 transition-all"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || sending}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InMeetingPersonalChat;

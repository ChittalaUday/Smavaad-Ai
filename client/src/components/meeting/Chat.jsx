import React, { useState, useEffect, useRef } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { Send, X, Bot, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { chatWithMeeting } from '../../api';
import AIChatModal from '../AIChatModal';

const Chat = ({ isOpen, onClose }) => {
    const { messages, sendMessage, activeMeeting } = useMeeting();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const [showAIChat, setShowAIChat] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input.trim());
            setInput('');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <AIChatModal
                isOpen={showAIChat}
                onClose={() => setShowAIChat(false)}
                checkId={activeMeeting?.meetingId}
                chatFunction={chatWithMeeting}
            />
            <div className="fixed top-20 right-4 w-80 max-h-[calc(100vh-160px)] flex flex-col bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-in-right z-[10000]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <MessageSquare size={16} />
                        </div>
                        <span className="font-bold text-white text-sm tracking-wide">
                            In-Call Messages
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowAIChat(true)}
                            className="p-1.5 hover:bg-indigo-500/20 rounded-lg text-white hover:text-indigo-300 transition-all"
                            title="Ask AI about this meeting"
                        >
                            <Bot size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 py-8 text-xs">
                            No messages yet.
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.isLocal ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                    {msg.isLocal ? 'You' : msg.sender}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                    {msg.time && format(new Date(msg.time), 'HH:mm')}
                                </span>
                            </div>
                            <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm break-words shadow-sm ${msg.isLocal
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white/10 border border-white/5 text-slate-200 rounded-tl-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/5">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full bg-black/20 text-white rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-white/10 placeholder-slate-500 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default Chat;

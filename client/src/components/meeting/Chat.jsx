import React, { useState, useEffect, useRef } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { IoMdSend, IoMdClose } from 'react-icons/io';
import { format } from 'date-fns';

const Chat = ({ isOpen, onClose }) => {
    const { messages, sendMessage } = useMeeting();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

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
        <div className="fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-800 shadow-xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                <h3 className="text-white font-semibold">In-call messages</h3>
                <div className="flex items-center gap-2">
                    {/* Video Call Button - simplified for now, usually would be in top bar or specific user chat */}
                    {/* Assuming this Chat is Global Meeting Chat, so maybe not the place for 1:1 call initiation? 
                        The requirement says "Add Video Call button in the header". 
                        But this is "In-call messages" (Meeting Chat).
                        If this is the Meeting Chat, we are ALREADY in a call/meeting.
                        
                        Wait, the user flow says:
                        1. User A navigates to Chat with User B.
                        2. User A clicks "Video Call".
                        
                        This refers to the "Chat" page (1:1 chat), NOT the "Meeting Chat" (sidebar).
                        The file I viewed is `client/src/components/meeting/Chat.jsx`. 
                        This is the MEETING CHAT component.
                        
                        I need to find the `Chat.jsx` that corresponds to the 1:1 Chat page.
                        The `App.jsx` has `<Route path="/chat" element={<Chat />} />`.
                        This imports `Chat` from `./pages/Chat`.
                    */}
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <IoMdClose size={24} />
                    </button>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.isLocal ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400 font-medium">
                                {msg.isLocal ? 'You' : msg.sender}
                            </span>
                            <span className="text-xs text-gray-500">
                                {msg.time && format(new Date(msg.time), 'HH:mm')}
                            </span>
                        </div>
                        <div className={`px-4 py-2 rounded-lg max-w-[85%] break-words ${msg.isLocal
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-gray-800 text-gray-100 rounded-tl-none'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-800 bg-gray-900">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Send a message..."
                        className="w-full bg-gray-800 text-white rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <IoMdSend size={20} />
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                    Messages are visible to everyone in the call
                </p>
            </form>
        </div>
    );
};

export default Chat;

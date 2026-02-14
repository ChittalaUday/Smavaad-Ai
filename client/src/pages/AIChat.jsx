import React, { useState, useRef, useEffect } from "react";
import { streamChatWithAI, getAIChatHistory } from "../api";
import moment from "moment";
import { useAuth } from "../context/AuthContext";
import { IoMdSend } from "react-icons/io";
import { RiRobot2Line, RiUser3Line } from "react-icons/ri";
import Avatar from "react-avatar";
import { BsStars } from "react-icons/bs";

const AIChat = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const response = await getAIChatHistory();
            if (response.data && response.data.data) {
                setMessages(response.data.data);
            }
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const currentInput = input;
        const userMessage = { role: "user", content: currentInput, timestamp: new Date().toISOString() };

        setInput("");
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        // Add placeholder for assistant
        setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: new Date().toISOString() }]);

        await streamChatWithAI(
            currentInput,
            (chunk) => {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (newMessages[lastIndex].role === "assistant") {
                        newMessages[lastIndex] = {
                            ...newMessages[lastIndex],
                            content: newMessages[lastIndex].content + chunk
                        };
                    }
                    return newMessages;
                });
            },
            () => setIsLoading(false),
            (error) => {
                console.error("Chat error:", error);
                setIsLoading(false);
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (newMessages[lastIndex].role === "assistant" && !newMessages[lastIndex].content) {
                        newMessages[lastIndex] = { ...newMessages[lastIndex], content: "Error: Failed to get response. Please try again." };
                    }
                    return newMessages;
                });
            }
        );
    };

    return (
        <div className="h-full w-full flex flex-col font-sans bg-transparent ">
            {/* --- Header --- */}
            <div className="absolute top-0 w-full z-10 p-4">
                <div className="flex items-center justify-between px-6 py-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                            <RiRobot2Line className="text-white text-xl" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">AI Assistant</h1>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {isLoading ? 'Thinking...' : 'Online & Ready'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <span className="text-xs px-2 py-1 bg-white/20 dark:bg-white/5 rounded text-slate-500 dark:text-slate-400 border border-white/10">
                            Powered by Ollama
                        </span>
                    </div>
                </div>
            </div>

            {/* --- Messages Area --- */}
            <div className="overflow-y-auto custom-scrollbar p-4 md:p-8 pt-28 pb-32 flex flex-col h-full w-full">
                {messages.length === 0 ? (
                    <div className="h-full w-full flex flex-col items-center justify-center opacity-60">
                        <div className="w-24 h-24 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                            <BsStars className="text-4xl text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">How can I help you today?</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
                            I can help you draft messages, summarize content, or answer your questions.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 my-16 mx-auto w-full">
                        {messages.map((msg, index) => {
                            const isUser = msg.role === "user";
                            return (
                                <div key={index} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                                    <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>

                                        {/* Avatar */}
                                        <div className="flex-shrink-0 mt-1">
                                            {isUser ? (
                                                <Avatar name={user.username} src={user.avatarUrl} size="36" round={true} className="shadow-sm" />
                                            ) : (
                                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                                                    <RiRobot2Line className="text-white text-sm" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Bubble */}
                                        <div className={`p-4 shadow-sm text-sm md:text-base leading-relaxed break-words ${isUser
                                            ? "bg-primary text-white rounded-2xl rounded-tr-sm shadow-primary/20"
                                            : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-white/20 dark:border-white/5"
                                            }`}>
                                            {msg.content ? (
                                                <div className="whitespace-pre-wrap font-medium">
                                                    {msg.content}
                                                    <div className={`text-[10px] mt-1 text-right ${isUser ? "text-blue-100/70" : "text-slate-400"}`}>
                                                        {msg.timestamp ? moment(msg.timestamp).format("LT") : moment().format("LT")}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1.5 items-center h-6 px-1">
                                                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* --- Input Area --- */}
            <div className="absolute bottom-6 w-full px-4 md:px-8 z-20 flex justify-center">
                <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-3 p-2 pl-4 bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl rounded-full transition-all focus-within:ring-2 focus-within:ring-primary/50 w-full max-w-3xl"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message to AI..."
                        className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder:text-slate-400 font-medium py-2"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-primary hover:bg-primary_hover disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-full shadow-lg transition-transform active:scale-95 group"
                    >
                        <IoMdSend size={20} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChat;

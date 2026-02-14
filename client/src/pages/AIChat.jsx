import React, { useState, useRef, useEffect } from "react";

import { streamChatWithAI, getAIChatHistory } from "../api";
import { useAuth } from "../context/AuthContext";
import { IoMdSend } from "../assets";

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
                // The backend returns { role, content, timestamp }
                // We need to ensure it matches our display format.
                setMessages(response.data.data);
            }
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    };


    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        const currentInput = input;
        setInput("");
        setIsLoading(true);

        // Add a placeholder message for the assistant
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        // Send the new message content only
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
            () => {
                setIsLoading(false);
            },
            (error) => {
                console.error("Chat error:", error);
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

    return (
        <div className="flex flex-col h-full bg-transparent text-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                <h1 className="text-xl font-bold">AI Assistant</h1>
                <div className="text-sm text-gray-400">Powered by Ollama</div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        <p>Start a conversation with the AI.</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-200"
                                }`}
                        >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                    </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 text-gray-200 rounded-lg p-3">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IoMdSend className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChat;

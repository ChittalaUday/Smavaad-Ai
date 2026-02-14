import React, { useState, useEffect, useRef } from "react";
import { BsRobot } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full m-4 shadow-xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <BsRobot /> Ask AI
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <RxCross2 className="text-2xl" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                    {!messages.length && (
                        <div className="text-center text-gray-400 mt-10">
                            <p>Ask anything about this conversation!</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-800"
                                    }`}
                            >
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className="flex justify-start">
                            <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 italic">
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-transparent focus:border-blue-500 rounded-lg px-4 py-2 focus:outline-none"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50 transition-colors"
                        >
                            <IoMdSend className="text-xl" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AIChatModal;

import React, { useState, useEffect } from "react";
import { useMeeting } from "../../context/MeetingContext";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import apiClient from "../../api";
import { toast } from "react-toastify";

const ParticipantList = ({ onClose }) => {
    const { participants, activeMeeting } = useMeeting();
    const { user } = useAuth();
    // eslint-disable-next-line no-unused-vars
    const { setOpenAddChat, setNewChatUser, currentSelectedChat, setIsChatSelected } = useChat();
    const [friendRequests, setFriendRequests] = useState([]);

    useEffect(() => {
        // Fetch pending requests logic could go here
    }, []);

    const handleAddFriend = async (participantId) => {
        try {
            await apiClient.post("/api/friends/send", { receiverId: participantId });
            toast.success("Friend request sent!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request");
        }
    };

    const handleMessage = async (participant) => {
        try {
            // Get or create chat
            const { data } = await apiClient.get(`/api/chat/c/${participant.userId}`);

            if (data.data) {
                const chatData = data.data.existing || data.data;

                // Update ChatContext
                if (currentSelectedChat) {
                    currentSelectedChat.current = chatData;
                }
                setIsChatSelected(true); // Trigger re-render/UI state update

                // Switch Sidebar
                if (onClose) onClose("personal-chat");
            }
        } catch (error) {
            console.error("Error opening chat", error);
            toast.error("Failed to open chat");
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-gray-900 text-white p-4 shadow-lg z-50 overflow-y-auto border-l border-gray-700">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-2">
                <h2 className="text-xl font-bold">Participants</h2>
                <button onClick={() => onClose(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-4">
                {Object.values(participants).map((p) => {
                    const isMe = p.userId === user?._id;
                    return (
                        <div key={p.userId || p.socketId} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-750 transition-colors">
                            <div className="flex items-center gap-3">
                                <img
                                    src={p.avatarUrl || "https://via.placeholder.com/40"}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-600"
                                    alt={p.username}
                                />
                                <div className="overflow-hidden">
                                    <p className="font-medium truncate max-w-[120px]" title={p.username}>
                                        {p.username} {isMe && "(You)"}
                                    </p>
                                </div>
                            </div>

                            {!isMe && p.userId && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAddFriend(p.userId)}
                                        className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 text-xs transition-transform transform hover:scale-110"
                                        title="Add Friend"
                                    >
                                        ➕
                                    </button>
                                    <button
                                        onClick={() => handleMessage(p)}
                                        className="p-2 bg-green-600 rounded-full hover:bg-green-700 text-xs transition-transform transform hover:scale-110"
                                        title="Message"
                                    >
                                        💬
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
                {Object.keys(participants).length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        No active participants
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticipantList;

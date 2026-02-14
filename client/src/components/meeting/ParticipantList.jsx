import React, { useState } from "react";
import { useMeeting } from "../../context/MeetingContext";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api";
import { toast } from "react-toastify";
import Avatar from "react-avatar";

import { Users, X, UserPlus, MessageCircle, Loader2 } from "lucide-react";

const ParticipantList = ({ onClose }) => {
    const { participants } = useMeeting();
    const { user } = useAuth();
    const [loadingUserId, setLoadingUserId] = useState(null);

    const handleAddFriend = async (participantId) => {
        if (!participantId || participantId.length !== 24) {
            toast.error("Cannot add this user as friend");
            return;
        }
        try {
            await apiClient.post("/api/friends/send", { receiverId: participantId });
            toast.success("Friend request sent!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request");
        }
    };

    const handleMessage = async (participant) => {
        if (!participant.userId) {
            toast.error("Cannot message this user");
            return;
        }

        setLoadingUserId(participant.userId);

        try {
            // Create or get existing chat (POST, not GET)
            const { data } = await apiClient.post(`/api/chat/c/${participant.userId}`);

            if (data.data) {
                const chatData = data.data.existing || data.data;

                // Pass the actual chat data to the parent
                if (onClose) onClose("personal-chat", chatData);
            } else {
                toast.error("Could not open chat");
            }
        } catch (error) {
            console.error("Error opening chat", error);
            toast.error(error.response?.data?.message || "Failed to open chat. You may need to add them as a friend first.");
        } finally {
            setLoadingUserId(null);
        }
    };

    return (
        <div className="fixed top-20 right-4 w-80 max-h-[calc(100vh-160px)] flex flex-col bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-in-right z-[10000]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <Users size={16} />
                    </div>
                    <span className="font-bold text-white text-sm tracking-wide">
                        Participants ({Object.keys(participants).length})
                    </span>
                </div>
                <button
                    onClick={() => onClose(null)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                {Object.values(participants).map((p) => {
                    const isMe = p.userId === user?._id;
                    const isLoading = loadingUserId === p.userId;

                    return (
                        <div key={p.userId || p.socketId} className="flex items-center justify-between bg-white/5 border border-white/5 p-3 rounded-xl hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    name={p.username || "Unknown"}
                                    src={p.avatarUrl}
                                    size="36"
                                    round={true}
                                    className="border border-white/20 shadow-sm"
                                />
                                <div className="overflow-hidden">
                                    <p className="font-medium text-sm text-slate-200 truncate max-w-[120px]" title={p.username}>
                                        {p.username}
                                        {isMe && <span className="text-slate-500 text-xs ml-1">(You)</span>}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        {isMe ? "Host" : "Participant"}
                                    </p>
                                </div>
                            </div>

                            {!isMe && p.userId && (
                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleAddFriend(p.userId)}
                                        className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors border border-indigo-500/20"
                                        title="Add Friend"
                                    >
                                        <UserPlus size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleMessage(p)}
                                        disabled={isLoading}
                                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20 disabled:opacity-50"
                                        title="Message"
                                    >
                                        {isLoading
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : <MessageCircle size={14} />
                                        }
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
                {Object.keys(participants).length === 0 && (
                    <div className="text-center text-slate-500 mt-10 text-xs">
                        No active participants
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticipantList;

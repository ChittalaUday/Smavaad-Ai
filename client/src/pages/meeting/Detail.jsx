import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMeetingDetail, summarizeMeeting } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { format, formatDistanceStrict } from "date-fns";
import {
    FiArrowLeft,
    FiClock,
    FiUsers,
    FiFileText,
    FiCheckCircle,
    FiMessageSquare,
    FiVideo,
    FiCalendar,
    FiCopy,
    FiShare2,
} from "react-icons/fi";
import { toast } from "react-toastify";

const TABS = [
    { id: "summary", label: "Summary", icon: FiFileText },
    { id: "transcript", label: "Transcript", icon: FiFileText },
    { id: "chat", label: "Chat", icon: FiMessageSquare },
    { id: "participants", label: "Participants", icon: FiUsers },
];

const MeetingDetail = () => {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("summary");
    const [summarizing, setSummarizing] = useState(false);

    useEffect(() => {
        fetchDetail();
    }, [meetingId]);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const { data } = await getMeetingDetail(meetingId);
            setMeeting(data.data);
        } catch (error) {
            console.error("Failed to load meeting detail:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyMeetingId = () => {
        navigator.clipboard.writeText(meetingId);
        toast.success("Meeting ID copied!");
    };

    const handleSummarize = async () => {
        try {
            setSummarizing(true);
            const { data } = await summarizeMeeting(meetingId);
            setMeeting(data.data);
            toast.success("Meeting summarized successfully!");
        } catch (error) {
            console.error("Failed to summarize meeting:", error);
            toast.error(error.response?.data?.message || "Failed to summarize meeting");
        } finally {
            setSummarizing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm animate-pulse">Loading meeting details...</p>
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center text-white gap-6">
                <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center">
                    <FiVideo className="text-gray-600" size={36} />
                </div>
                <p className="text-lg text-gray-300 font-medium">Meeting not found</p>
                <p className="text-gray-500 text-sm">This meeting may have been deleted or the ID is invalid.</p>
                <Link
                    to="/meetings"
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20"
                >
                    <FiArrowLeft size={16} /> Back to History
                </Link>
            </div>
        );
    }

    const duration =
        meeting.startTime && meeting.endTime
            ? formatDistanceStrict(new Date(meeting.startTime), new Date(meeting.endTime))
            : "—";

    const isHost = meeting.host?._id === user?._id;
    const isLive = meeting.status === "active";

    // Tab content counts for badges
    const tabCounts = {
        chat: meeting.messages?.length || 0,
        participants: meeting.participants?.length || 0,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
            {/* Header */}
            <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/60 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-5">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/meetings")}
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                            >
                                <FiArrowLeft size={20} />
                            </button>
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <FiVideo size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-lg font-bold">
                                        {meeting.type === "call" ? "📞 Call" : "🎥 Meeting"}
                                    </h1>
                                    <button
                                        onClick={copyMeetingId}
                                        className="flex items-center gap-1.5 text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-700 px-2.5 py-1 rounded-lg text-xs font-mono transition-all group"
                                        title="Copy Meeting ID"
                                    >
                                        {meeting.meetingId}
                                        <FiCopy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                    {isLive && (
                                        <span className="text-[11px] bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full border border-green-500/20 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                            Live
                                        </span>
                                    )}
                                    {!isLive && (
                                        <span className="text-[11px] bg-gray-700/50 text-gray-400 px-2.5 py-1 rounded-full border border-gray-600/30">
                                            Ended
                                        </span>
                                    )}
                                    {isHost && (
                                        <span className="text-[11px] bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/20">
                                            Host
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats cards row */}
                    <div className="flex items-center gap-3 ml-16">
                        <div className="flex items-center gap-1.5 bg-gray-800/40 px-3 py-1.5 rounded-lg text-sm text-gray-400">
                            <FiCalendar size={13} className="text-gray-500" />
                            {meeting.createdAt
                                ? format(new Date(meeting.createdAt), "MMM d, yyyy • h:mm a")
                                : "—"}
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-800/40 px-3 py-1.5 rounded-lg text-sm text-gray-400">
                            <FiClock size={13} className="text-gray-500" />
                            {duration}
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-800/40 px-3 py-1.5 rounded-lg text-sm text-gray-400">
                            <FiUsers size={13} className="text-gray-500" />
                            {meeting.participants?.length || 0} participants
                        </div>
                        {meeting.summary && (
                            <div className="flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-lg text-sm text-indigo-400 border border-indigo-500/20">
                                <FiFileText size={13} />
                                AI Summary
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-6 mt-6">
                <div className="flex gap-1 bg-gray-800/30 p-1 rounded-xl w-fit">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const count = tabCounts[tab.id];
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all rounded-lg ${activeTab === tab.id
                                    ? "bg-gray-800 text-white shadow-lg"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                    }`}
                            >
                                <Icon size={15} />
                                {tab.label}
                                {count > 0 && (
                                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id
                                        ? "bg-indigo-500/20 text-indigo-300"
                                        : "bg-gray-700/50 text-gray-500"
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab content */}
            <div className="max-w-6xl mx-auto px-6 py-6">
                {activeTab === "summary" && (
                    <SummaryTab
                        meeting={meeting}
                        onSummarize={handleSummarize}
                        isSummarizing={summarizing}
                    />
                )}
                {activeTab === "transcript" && <TranscriptTab meeting={meeting} />}
                {activeTab === "chat" && <ChatTab meeting={meeting} user={user} />}
                {activeTab === "participants" && <ParticipantsTab meeting={meeting} user={user} />}
            </div>
        </div>
    );
};

/* ─── Summary Tab ──────────────────────── */
const SummaryTab = ({ meeting, onSummarize, isSummarizing }) => {
    if (!meeting.summary && (!meeting.actionItems || meeting.actionItems.length === 0)) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FiFileText className="text-gray-600" size={36} />
                </div>
                <p className="text-gray-300 text-lg font-medium">No AI summary available</p>
                <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto mb-8">
                    AI summaries are generated automatically when a call ends with transcription enabled.
                </p>
                {meeting.transcript && (
                    <button
                        onClick={onSummarize}
                        disabled={isSummarizing}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-indigo-600/20"
                    >
                        {isSummarizing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating Summary...
                            </>
                        ) : (
                            <>
                                <FiFileText /> Generate AI Summary
                            </>
                        )}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex justify-end">
                <button
                    onClick={onSummarize}
                    disabled={isSummarizing}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 text-gray-300 hover:text-white rounded-xl border border-gray-700 transition-all text-sm font-medium"
                >
                    {isSummarizing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            Summarizing...
                        </>
                    ) : (
                        <>
                            <FiFileText size={14} /> Re-generate Summary
                        </>
                    )}
                </button>
            </div>
            {/* Summary card */}
            {meeting.summary && (
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/40 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                <FiFileText className="text-indigo-400" size={16} />
                            </div>
                            AI Summary
                        </h3>
                    </div>
                    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-[15px]">
                        {meeting.summary}
                    </div>
                </div>
            )}

            {/* Action Items */}
            {meeting.actionItems && meeting.actionItems.length > 0 && (
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/40 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <FiCheckCircle className="text-green-400" size={16} />
                        </div>
                        Action Items
                        <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full ml-1">
                            {meeting.actionItems.length}
                        </span>
                    </h3>
                    <div className="space-y-3">
                        {meeting.actionItems.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-3 p-4 bg-gray-900/30 hover:bg-gray-900/50 rounded-xl transition-colors border border-gray-700/20"
                            >
                                <div className="w-5 h-5 mt-0.5 border-2 border-gray-500 rounded flex-shrink-0 hover:border-green-400 transition-colors cursor-pointer" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-200 text-[15px]">{item.task || item}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {item.owner && (
                                            <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                                                👤 {item.owner}
                                            </span>
                                        )}
                                        {item.deadline && (
                                            <span className="text-xs text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                                                📅 {item.deadline}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Downloads Section */}
            {(meeting.audioUrl || meeting.pdfUrl) && (
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/40 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <FiFileText className="text-blue-400" size={16} />
                        </div>
                        Meeting Files
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {meeting.audioUrl && (
                            <button
                                onClick={() => handleDownload(meeting.audioUrl, `meeting-audio-${meeting.meetingId}.webm`)}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 transition-all font-medium"
                            >
                                <FiVideo size={18} /> Download Audio
                            </button>
                        )}
                        {meeting.pdfUrl && (
                            <button
                                onClick={() => {
                                    const url = meeting.pdfUrl;
                                    const fullUrl = url.startsWith("http") ? url : `${import.meta.env.VITE_SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
                                    const link = document.createElement("a");
                                    link.href = fullUrl;
                                    link.download = `meeting-report-${meeting.meetingId}.pdf`;
                                    link.target = "_blank";
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/20 transition-all font-medium"
                            >
                                <FiFileText size={18} /> Download PDF Report
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Transcript Tab ───────────────────── */
const TranscriptTab = ({ meeting }) => {
    const [copied, setCopied] = useState(false);

    const copyTranscript = () => {
        navigator.clipboard.writeText(meeting.transcript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!meeting.transcript) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FiFileText className="text-gray-600" size={36} />
                </div>
                <p className="text-gray-300 text-lg font-medium">No transcript available</p>
                <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                    Transcripts are recorded when real-time transcription is enabled during a call.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/40 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                        <FiFileText className="text-indigo-400" size={16} />
                    </div>
                    Full Transcript
                </h3>
                <button
                    onClick={copyTranscript}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-all"
                >
                    <FiCopy size={12} />
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap font-mono text-sm max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {meeting.transcript}
            </div>
        </div>
    );
};

/* ─── Chat Tab ─────────────────────────── */
const ChatTab = ({ meeting, user }) => {
    const messages = meeting.messages || [];

    if (messages.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FiMessageSquare className="text-gray-600" size={36} />
                </div>
                <p className="text-gray-300 text-lg font-medium">No chat messages</p>
                <p className="text-gray-500 text-sm mt-2">No messages were sent during this meeting.</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/40 rounded-2xl p-5 max-h-[650px] overflow-y-auto backdrop-blur-sm">
            <div className="space-y-4">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                    const senderName = typeof msg.sender === "object" ? msg.sender.username : "Unknown";
                    const avatarUrl = typeof msg.sender === "object"
                        ? msg.sender.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=4f46e5&color=fff&size=32`
                        : `https://ui-avatars.com/api/?name=U&background=4f46e5&color=fff&size=32`;

                    return (
                        <div key={idx} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                            <img
                                src={avatarUrl}
                                alt={senderName}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
                            />
                            <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                                <div className={`flex items-center gap-2 mb-1 ${isMe ? "justify-end" : ""}`}>
                                    <span className="text-xs text-gray-400 font-medium">
                                        {isMe ? "You" : senderName}
                                    </span>
                                    <span className="text-[11px] text-gray-600">
                                        {msg.timestamp ? format(new Date(msg.timestamp), "HH:mm") : ""}
                                    </span>
                                </div>
                                <div
                                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-md"
                                        : "bg-gray-700/60 text-gray-100 rounded-bl-md border border-gray-600/30"
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ─── Participants Tab ─────────────────── */
const ParticipantsTab = ({ meeting, user }) => {
    const participants = meeting.participants || [];

    if (participants.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FiUsers className="text-gray-600" size={36} />
                </div>
                <p className="text-gray-300 text-lg font-medium">No participants recorded</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Host card */}
            {meeting.host && (
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-4">
                        <img
                            src={meeting.host.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(meeting.host.username || "H")}&background=4f46e5&color=fff&size=48`}
                            alt={meeting.host.username}
                            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/30"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-white">
                                    {meeting.host.username}
                                    {meeting.host._id === user?._id && <span className="text-gray-400 text-sm ml-1">(You)</span>}
                                </p>
                                <span className="text-[11px] bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                                    👑 Host
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">{meeting.host.email}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Participant cards */}
            {participants.map((p, idx) => {
                const u = p.user || {};
                const isCurrentUser = u._id === user?._id;
                const isHostParticipant = meeting.host?._id === u._id;

                return (
                    <div
                        key={u._id || idx}
                        className={`flex items-center justify-between bg-gray-800/40 border border-gray-700/30 rounded-xl p-4 hover:bg-gray-800/60 transition-colors ${isCurrentUser ? "ring-1 ring-indigo-500/20" : ""
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <img
                                src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || "U")}&background=374151&color=9ca3af&size=40`}
                                alt={u.username || "User"}
                                className="w-10 h-10 rounded-full object-cover border border-gray-600"
                            />
                            <div>
                                <p className="font-medium text-sm">
                                    {u.username || "Unknown User"}
                                    {isCurrentUser && <span className="text-gray-400 text-xs ml-1">(You)</span>}
                                    {isHostParticipant && (
                                        <span className="ml-2 text-[11px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-full">
                                            Host
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-xs font-medium capitalize px-2.5 py-0.5 rounded-full ${p.status === "joined"
                                ? "bg-green-500/10 text-green-400"
                                : p.status === "left"
                                    ? "bg-gray-600/20 text-gray-500"
                                    : "bg-yellow-500/10 text-yellow-400"
                                }`}>
                                {p.status}
                            </p>
                            {p.joinedAt && (
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Joined {format(new Date(p.joinedAt), "h:mm a")}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MeetingDetail;

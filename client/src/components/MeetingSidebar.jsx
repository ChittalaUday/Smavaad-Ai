import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createMeeting, getMyMeetings, getMeetingDetail, summarizeMeeting, transcribeMeeting, generateMeetingPdf } from "../api";
import { useAuth } from "../context/AuthContext";
import { format, formatDistanceStrict } from "date-fns";
import {
    FiVideo,
    FiClock,
    FiUsers,
    FiFileText,
    FiPlus,
    FiArrowLeft,
    FiSearch,
    FiCheckCircle,
    FiMessageSquare,
    FiCalendar,
    FiCopy,
    FiDownload,
    FiZap,
    FiFile,
    FiCpu,
} from "react-icons/fi";
import { toast } from "react-toastify";

// ─── Views ────────
const VIEW = {
    HOME: "home",
    DETAIL: "detail",
};

export default function MeetingSidebar() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [view, setView] = useState(VIEW.HOME);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [meetingCode, setMeetingCode] = useState("");
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("all");

    // Detail view state
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("summary");

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const { data } = await getMyMeetings();
            setMeetings(data.data || []);
        } catch (error) {
            console.error("Failed to load meetings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMeeting = async () => {
        try {
            setCreating(true);
            const response = await createMeeting();
            const { meetingId } = response.data.data;
            navigate(`/meeting/${meetingId}`);
        } catch (error) {
            console.error("Error creating meeting", error);
            toast.error("Failed to create meeting");
        } finally {
            setCreating(false);
        }
    };

    const joinMeeting = (e) => {
        e.preventDefault();
        if (!meetingCode.trim()) return;
        navigate(`/meeting/${meetingCode}`);
    };

    const openDetail = async (meetingId) => {
        try {
            setDetailLoading(true);
            setView(VIEW.DETAIL);
            const { data } = await getMeetingDetail(meetingId);
            setSelectedMeeting(data.data);
            setActiveTab("summary");
        } catch (error) {
            console.error("Failed to load meeting detail:", error);
            toast.error("Couldn't load meeting details");
            setView(VIEW.HOME);
        } finally {
            setDetailLoading(false);
        }
    };

    const getDuration = (m) => {
        if (!m.startTime) return "—";
        const start = new Date(m.startTime);
        const end = m.endTime ? new Date(m.endTime) : new Date();
        return formatDistanceStrict(start, end);
    };

    const filtered = meetings
        .filter((m) => {
            if (filter === "hosted") return m.host?._id === user?._id;
            if (filter === "joined") return m.host?._id !== user?._id;
            return true;
        })
        .filter((m) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                m.meetingId?.toLowerCase().includes(q) ||
                m.host?.username?.toLowerCase().includes(q)
            );
        });

    // ─── Detail View ─────────────────────────
    if (view === VIEW.DETAIL) {
        return (
            <DetailView
                meeting={selectedMeeting}
                loading={detailLoading}
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onBack={() => {
                    setView(VIEW.HOME);
                    setSelectedMeeting(null);
                }}
            />
        );
    }

    // ─── Home View (History + Create/Join) ────
    return (
        <div className="h-full w-full flex flex-col bg-white dark:bg-backgroundDark3 overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                            <FiVideo size={14} className="text-white" />
                        </div>
                        <h2 className="text-lg font-bold dark:text-white">Meetings</h2>
                    </div>
                    <button
                        onClick={handleCreateMeeting}
                        disabled={creating}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <FiPlus size={12} />
                        {creating ? "Creating..." : "New"}
                    </button>
                </div>

                {/* Join with code */}
                <form onSubmit={joinMeeting} className="flex gap-2 mb-3">
                    <input
                        type="text"
                        required
                        className="flex-1 px-3 py-1.5 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-400"
                        placeholder="Enter meeting code..."
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!meetingCode.trim()}
                        className="px-3 py-1.5 rounded-lg text-white text-sm font-medium bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Join
                    </button>
                </form>

                {/* Search */}
                <div className="relative">
                    <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input
                        type="text"
                        placeholder="Search meetings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border dark:border-gray-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 px-4 py-2 border-b dark:border-gray-700/50">
                {["all", "hosted", "joined"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${filter === f
                            ? "bg-indigo-500/15 text-indigo-500 dark:text-indigo-400"
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Meeting List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-gray-400">Loading...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <FiVideo className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={32} />
                        <p className="text-gray-400 text-sm">No meetings found</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                            {searchQuery ? "Try a different search." : "Start a meeting to see history."}
                        </p>
                    </div>
                ) : (
                    filtered.map((meeting) => {
                        const isHost = meeting.host?._id === user?._id;
                        const participantCount = meeting.participants?.length || 0;
                        const hasSummary = !!meeting.summary;
                        const isLive = meeting.status === "active";

                        return (
                            <button
                                key={meeting._id}
                                onClick={() => openDetail(meeting.meetingId)}
                                className="w-full text-left rounded-xl p-3 transition-all group bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            >
                                {/* Top row */}
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                                    <span className="text-[13px] font-semibold text-gray-800 dark:text-white truncate">
                                        {meeting.type === "call" ? "Call" : "Meeting"}
                                    </span>
                                    <code className="text-[10px] text-gray-400 font-mono bg-gray-200/50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded">
                                        {meeting.meetingId?.slice(0, 8)}...
                                    </code>
                                    {isHost && (
                                        <span className="text-[9px] bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 px-1.5 py-0.5 rounded-full ml-auto">
                                            Host
                                        </span>
                                    )}
                                    {isLive && (
                                        <span className="text-[9px] bg-green-500/15 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                            Live
                                        </span>
                                    )}
                                </div>

                                {/* Meta */}
                                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <FiClock size={10} />
                                        {meeting.createdAt
                                            ? format(new Date(meeting.createdAt), "MMM d, h:mm a")
                                            : "—"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FiUsers size={10} />
                                        {participantCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FiClock size={10} />
                                        {getDuration(meeting)}
                                    </span>
                                    {hasSummary && (
                                        <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                                            <FiFileText size={10} />
                                            AI
                                        </span>
                                    )}
                                </div>

                                {/* Avatars */}
                                {participantCount > 0 && (
                                    <div className="flex -space-x-1.5 mt-2">
                                        {meeting.participants?.slice(0, 4).map((p, i) => (
                                            <img
                                                key={p._id || i}
                                                src={p.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.username || "U")}&background=4f46e5&color=fff&size=24`}
                                                alt={p.user?.username || "User"}
                                                className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 object-cover"
                                            />
                                        ))}
                                        {participantCount > 4 && (
                                            <span className="text-[9px] text-gray-400 ml-1 self-center">
                                                +{participantCount - 4}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ─── Detail View Component ─────────────────────────
function DetailView({ meeting, loading, user, activeTab, setActiveTab, onBack }) {
    if (loading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-white dark:bg-backgroundDark3 gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400">Loading details...</span>
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-white dark:bg-backgroundDark3 gap-3">
                <FiVideo className="text-gray-300 dark:text-gray-600" size={32} />
                <p className="text-gray-400 text-sm">Meeting not found</p>
                <button onClick={onBack} className="text-indigo-500 text-xs flex items-center gap-1">
                    <FiArrowLeft size={12} /> Back
                </button>
            </div>
        );
    }

    const duration =
        meeting.startTime && meeting.endTime
            ? formatDistanceStrict(new Date(meeting.startTime), new Date(meeting.endTime))
            : "—";
    const isHost = meeting.host?._id === user?._id;
    const isLive = meeting.status === "active";

    // Action states
    const [actionLoading, setActionLoading] = useState({
        transcribing: false,
        summarizing: false,
        generatingPdf: false,
    });

    const handleAction = async (type) => {
        try {
            setActionLoading(prev => ({ ...prev, [type]: true }));
            let response;
            if (type === "transcribing") {
                response = await transcribeMeeting(meeting.meetingId);
                toast.success("Transcription generated!");
            } else if (type === "summarizing") {
                response = await summarizeMeeting(meeting.meetingId);
                toast.success("Summary generated!");
            } else if (type === "generatingPdf") {
                response = await generateMeetingPdf(meeting.meetingId);
                toast.success("PDF generated!");
            }

            if (response?.data?.data) {
                // Update local meeting object (this is a simplified way, ideally we refetch or use a context)
                meeting.transcript = response.data.data.transcript || meeting.transcript;
                meeting.summary = response.data.data.summary || meeting.summary;
                meeting.actionItems = response.data.data.actionItems || meeting.actionItems;
                meeting.pdfUrl = response.data.data.pdfUrl || meeting.pdfUrl;
                // Force re-render if needed, but since we are mutating meeting prop it might not re-render unless parent state changes.
                // In this component, selectedMeeting in the parent state should be updated.
            }
        } catch (error) {
            console.error(`Action ${type} failed:`, error);
            toast.error(`Failed to trigger ${type}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    const TABS = [
        { id: "summary", label: "Summary", icon: FiFileText },
        { id: "transcript", label: "Transcript", icon: FiFileText },
        { id: "chat", label: "Chat", icon: FiMessageSquare, count: meeting.messages?.length || 0 },
        { id: "participants", label: "People", icon: FiUsers, count: meeting.participants?.length || 0 },
    ];

    return (
        <div className="h-full w-full flex flex-col bg-white dark:bg-backgroundDark3 overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-2">
                    <button
                        onClick={onBack}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    >
                        <FiArrowLeft size={16} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800 dark:text-white">
                                {meeting.type === "call" ? "📞 Call" : "🎥 Meeting"}
                            </span>
                            <CopyButton text={meeting.meetingId} />
                            {isLive && (
                                <span className="text-[9px] bg-green-500/15 text-green-500 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                                    Live
                                </span>
                            )}
                            {!isLive && (
                                <span className="text-[9px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                                    Ended
                                </span>
                            )}
                            {isHost && (
                                <span className="text-[9px] bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                                    Host
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-2 ml-7 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                        <FiCalendar size={10} />
                        {meeting.createdAt ? format(new Date(meeting.createdAt), "MMM d, h:mm a") : "—"}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                        <FiClock size={10} />
                        {duration}
                    </span>
                    {meeting.audioUrl && (
                        <a
                            href={meeting.audioUrl.startsWith("http") ? meeting.audioUrl : `${import.meta.env.VITE_SERVER_URL}${meeting.audioUrl.startsWith("/") ? "" : "/"}${meeting.audioUrl}`}
                            download={`meeting-${meeting.meetingId}.webm`}
                            className="flex items-center gap-1 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded-md hover:bg-indigo-500/20 transition-colors"
                        >
                            <FiDownload size={10} />
                            Audio
                        </a>
                    )}
                    {meeting.pdfUrl && (
                        <a
                            href={meeting.pdfUrl.startsWith("http") ? meeting.pdfUrl : `${import.meta.env.VITE_SERVER_URL}${meeting.pdfUrl.startsWith("/") ? "" : "/"}${meeting.pdfUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-red-500/10 text-red-500 dark:text-red-400 px-2 py-0.5 rounded-md hover:bg-red-500/20 transition-colors"
                        >
                            <FiFileText size={10} />
                            PDF Report
                        </a>
                    )}
                </div>

                {/* AI Actions */}
                {!isLive && (
                    <div className="flex flex-wrap gap-2 ml-7 mt-3">
                        <button
                            onClick={() => handleAction("transcribing")}
                            disabled={actionLoading.transcribing || !meeting.audioUrl}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all shadow-sm ${meeting.audioUrl
                                ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-200/50"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                }`}
                        >
                            {actionLoading.transcribing ? (
                                <div className="w-2.5 h-2.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FiCpu size={12} />
                            )}
                            {meeting.transcript ? "Regenerate Transcript" : "Generate Transcript"}
                        </button>

                        <button
                            onClick={() => handleAction("summarizing")}
                            disabled={actionLoading.summarizing || !meeting.transcript}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all shadow-sm ${meeting.transcript
                                ? "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border border-indigo-200/50"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                }`}
                        >
                            {actionLoading.summarizing ? (
                                <div className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FiZap size={12} />
                            )}
                            {meeting.summary ? "Regenerate Summary" : "Generate Summary"}
                        </button>

                        <button
                            onClick={() => handleAction("generatingPdf")}
                            disabled={actionLoading.generatingPdf || !meeting.summary}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all shadow-sm ${meeting.summary
                                ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-200/50"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                }`}
                        >
                            {actionLoading.generatingPdf ? (
                                <div className="w-2.5 h-2.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FiFile size={12} />
                            )}
                            {meeting.pdfUrl ? "Regenerate PDF" : "Generate PDF"}
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex px-2 py-1.5 gap-0.5 border-b dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/30">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all ${activeTab === tab.id
                                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                        >
                            <Icon size={11} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-[9px] px-1 py-0 rounded-full ${activeTab === tab.id
                                    ? "bg-indigo-500/15 text-indigo-500"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3">
                {activeTab === "summary" && <SummaryContent meeting={meeting} />}
                {activeTab === "transcript" && <TranscriptContent meeting={meeting} />}
                {activeTab === "chat" && <ChatContent meeting={meeting} user={user} />}
                {activeTab === "participants" && <ParticipantsContent meeting={meeting} user={user} />}
            </div>
        </div>
    );
}

// ─── Copy Button ──────────
function CopyButton({ text }) {
    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast.success("Copied!");
    };
    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-white font-mono bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-1.5 py-0.5 rounded transition-colors group"
            title="Copy Meeting ID"
        >
            {text?.slice(0, 8)}...
            <FiCopy size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}

// ─── Summary Content ──────
function SummaryContent({ meeting }) {
    if (!meeting.summary && (!meeting.actionItems || meeting.actionItems.length === 0)) {
        return (
            <EmptyState icon={FiFileText} title="No AI summary" subtitle="Summaries are generated when transcription is enabled." />
        );
    }

    return (
        <div className="space-y-3">
            {meeting.summary && (
                <div className="bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700/30 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                        <FiFileText size={12} className="text-indigo-500" />
                        AI Summary
                    </h4>
                    <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {meeting.summary}
                    </p>
                </div>
            )}

            {meeting.audioUrl && (
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <FiVideo size={14} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Full Meeting Recording</p>
                            <p className="text-[10px] text-gray-400">Available for download</p>
                        </div>
                    </div>
                    <a
                        href={meeting.audioUrl.startsWith("http") ? meeting.audioUrl : `${import.meta.env.VITE_SERVER_URL}${meeting.audioUrl.startsWith("/") ? "" : "/"}${meeting.audioUrl}`}
                        download={`meeting-${meeting.meetingId}.webm`}
                        className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm"
                    >
                        <FiDownload size={12} />
                        Download
                    </a>
                </div>
            )}

            {meeting.actionItems && meeting.actionItems.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700/30 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                        <FiCheckCircle size={12} className="text-green-500" />
                        Action Items
                        <span className="text-[9px] bg-green-500/10 text-green-500 px-1.5 rounded-full">
                            {meeting.actionItems.length}
                        </span>
                    </h4>
                    <div className="space-y-2">
                        {meeting.actionItems.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-900/30 rounded-lg text-[12px]">
                                <div className="w-3.5 h-3.5 mt-0.5 border-2 border-gray-300 dark:border-gray-500 rounded flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-700 dark:text-gray-200">{item.task || item}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {item.owner && (
                                            <span className="text-[9px] text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                                {item.owner}
                                            </span>
                                        )}
                                        {item.deadline && (
                                            <span className="text-[9px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                                {item.deadline}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Transcript Content ───
function TranscriptContent({ meeting }) {
    if (!meeting.transcript) {
        return (
            <EmptyState icon={FiFileText} title="No transcript" subtitle="Transcripts are recorded when real-time transcription is enabled." />
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700/30 rounded-xl p-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <FiFileText size={12} className="text-indigo-500" />
                Full Transcript
            </h4>
            <div className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
                {meeting.transcript}
            </div>
        </div>
    );
}

// ─── Chat Content ─────────
function ChatContent({ meeting, user }) {
    const messages = meeting.messages || [];

    if (messages.length === 0) {
        return (
            <EmptyState icon={FiMessageSquare} title="No messages" subtitle="No messages were sent during this meeting." />
        );
    }

    return (
        <div className="space-y-2">
            {messages.map((msg, idx) => {
                const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                const senderName = typeof msg.sender === "object" ? msg.sender.username : "Unknown";

                return (
                    <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] text-gray-400 font-medium">
                                {isMe ? "You" : senderName}
                            </span>
                            <span className="text-[9px] text-gray-500">
                                {msg.timestamp ? format(new Date(msg.timestamp), "HH:mm") : ""}
                            </span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words text-[12px] ${isMe
                            ? "bg-indigo-500 text-white rounded-br-sm"
                            : "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-100 rounded-bl-sm"
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Participants Content ──
function ParticipantsContent({ meeting, user }) {
    const participants = meeting.participants || [];

    if (participants.length === 0) {
        return <EmptyState icon={FiUsers} title="No participants" />;
    }

    return (
        <div className="space-y-2">
            {participants.map((p, idx) => {
                const u = p.user || {};
                const isCurrentUser = u._id === user?._id;
                const isHostParticipant = meeting.host?._id === u._id;

                return (
                    <div
                        key={u._id || idx}
                        className={`flex items-center justify-between rounded-xl p-2.5 transition-colors ${isHostParticipant
                            ? "bg-indigo-500/5 border border-indigo-500/15"
                            : "bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700/30"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <img
                                src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || "U")}&background=4f46e5&color=fff&size=32`}
                                alt={u.username || "User"}
                                className="w-8 h-8 rounded-full object-cover border dark:border-gray-600"
                            />
                            <div>
                                <p className="text-[12px] font-medium text-gray-700 dark:text-white">
                                    {u.username || "Unknown"}
                                    {isCurrentUser && <span className="text-gray-400 ml-1">(You)</span>}
                                    {isHostParticipant && (
                                        <span className="ml-1.5 text-[9px] bg-indigo-500/15 text-indigo-500 px-1.5 py-0.5 rounded-full">
                                            Host
                                        </span>
                                    )}
                                </p>
                                <p className="text-[10px] text-gray-400">{u.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-[10px] capitalize px-1.5 py-0.5 rounded-full ${p.status === "joined" ? "bg-green-500/10 text-green-500" : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                }`}>
                                {p.status}
                            </span>
                            {p.joinedAt && (
                                <p className="text-[9px] text-gray-500 mt-0.5">
                                    {format(new Date(p.joinedAt), "h:mm a")}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Empty State ──────────
function EmptyState({ icon: Icon, title, subtitle }) {
    return (
        <div className="text-center py-10">
            <Icon className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={28} />
            <p className="text-gray-400 text-sm">{title}</p>
            {subtitle && <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-1">{subtitle}</p>}
        </div>
    );
}

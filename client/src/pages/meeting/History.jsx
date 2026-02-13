import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getMyMeetings } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { format, formatDistanceStrict } from "date-fns";
import {
    FiVideo,
    FiClock,
    FiUsers,
    FiFileText,
    FiChevronRight,
    FiPlus,
    FiArrowLeft,
    FiSearch,
} from "react-icons/fi";

const MeetingHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

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

    const filtered = meetings.filter((m) => {
        if (filter === "hosted") return m.host?._id === user?._id;
        if (filter === "joined") return m.host?._id !== user?._id;
        return true;
    }).filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            m.meetingId?.toLowerCase().includes(q) ||
            m.host?.username?.toLowerCase().includes(q) ||
            m.participants?.some((p) =>
                p.user?.username?.toLowerCase().includes(q)
            )
        );
    });

    const getDuration = (m) => {
        if (!m.startTime) return "—";
        const start = new Date(m.startTime);
        const end = m.endTime ? new Date(m.endTime) : new Date();
        return formatDistanceStrict(start, end);
    };

    const getStatusColor = (status) => {
        if (status === "active") return "from-green-500 to-emerald-500";
        if (status === "ended") return "from-gray-500 to-gray-600";
        return "from-gray-500 to-gray-600";
    };

    const stats = {
        total: meetings.length,
        hosted: meetings.filter((m) => m.host?._id === user?._id).length,
        withSummary: meetings.filter((m) => m.summary).length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
            {/* Header */}
            <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/60 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/meeting")}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                        >
                            <FiArrowLeft size={20} />
                        </button>
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <FiVideo size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Meeting History
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {stats.total} meetings • {stats.hosted} hosted • {stats.withSummary} with AI summary
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/meeting"
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95"
                    >
                        <FiPlus size={16} />
                        New Meeting
                    </Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-6">
                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Search bar */}
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search by meeting ID or participant..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                    {/* Filter pills */}
                    <div className="flex gap-2">
                        {[
                            { key: "all", label: "All", count: stats.total },
                            { key: "hosted", label: "Hosted", count: stats.hosted },
                            { key: "joined", label: "Joined", count: stats.total - stats.hosted },
                        ].map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.key
                                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                                        : "bg-gray-800/40 text-gray-400 border border-gray-700/30 hover:text-white hover:bg-gray-800/60"
                                    }`}
                            >
                                {f.label}
                                <span className={`ml-1.5 text-xs ${filter === f.key ? "text-indigo-400" : "text-gray-600"}`}>
                                    {f.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-24 gap-4">
                        <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500 text-sm animate-pulse">Loading your meetings...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-24">
                        <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <FiVideo className="text-gray-600" size={36} />
                        </div>
                        <p className="text-gray-300 text-lg font-medium">No meetings found</p>
                        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                            {searchQuery
                                ? "Try adjusting your search terms."
                                : "Start or join a meeting to see your history here."}
                        </p>
                        {!searchQuery && (
                            <Link
                                to="/meeting"
                                className="inline-flex items-center gap-2 mt-6 bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
                            >
                                <FiPlus size={16} />
                                Start a Meeting
                            </Link>
                        )}
                    </div>
                ) : (
                    /* Meeting Cards */
                    <div className="grid gap-4">
                        {filtered.map((meeting, index) => {
                            const isHost = meeting.host?._id === user?._id;
                            const participantCount = meeting.participants?.length || 0;
                            const hasSummary = !!meeting.summary;
                            const isLive = meeting.status === "active";

                            return (
                                <button
                                    key={meeting._id}
                                    onClick={() => navigate(`/meetings/${meeting.meetingId}`)}
                                    className="w-full text-left group"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/40 hover:border-gray-600/60 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                {/* Title row */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getStatusColor(meeting.status)} ${isLive ? "animate-pulse shadow-lg shadow-green-500/50" : ""}`} />
                                                    <span className="font-semibold text-white text-[15px]">
                                                        {meeting.type === "call" ? "📞 Call" : "🎥 Meeting"}
                                                    </span>
                                                    <code className="text-gray-500 text-xs font-mono bg-gray-900/50 px-2 py-0.5 rounded-md">
                                                        {meeting.meetingId}
                                                    </code>
                                                    {isHost && (
                                                        <span className="text-[11px] bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                                                            Host
                                                        </span>
                                                    )}
                                                    {isLive && (
                                                        <span className="text-[11px] bg-green-500/20 text-green-300 px-2.5 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                                            Live
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Meta row */}
                                                <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400 mb-3">
                                                    <span className="flex items-center gap-1.5">
                                                        <FiClock size={13} className="text-gray-500" />
                                                        {meeting.createdAt
                                                            ? format(new Date(meeting.createdAt), "MMM d, yyyy • h:mm a")
                                                            : "—"}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <FiUsers size={13} className="text-gray-500" />
                                                        {participantCount} participant{participantCount !== 1 && "s"}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <FiClock size={13} className="text-gray-500" />
                                                        {getDuration(meeting)}
                                                    </span>
                                                    {hasSummary && (
                                                        <span className="flex items-center gap-1.5 text-indigo-400">
                                                            <FiFileText size={13} />
                                                            AI Summary
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Participant avatars */}
                                                <div className="flex items-center">
                                                    <div className="flex -space-x-2">
                                                        {meeting.participants?.slice(0, 6).map((p, i) => (
                                                            <img
                                                                key={p._id || i}
                                                                src={p.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.username || "U")}&background=4f46e5&color=fff&size=32`}
                                                                alt={p.user?.username || "User"}
                                                                title={p.user?.username}
                                                                className="w-7 h-7 rounded-full border-2 border-gray-800 object-cover hover:z-10 hover:scale-110 transition-transform"
                                                            />
                                                        ))}
                                                    </div>
                                                    {participantCount > 6 && (
                                                        <span className="text-xs text-gray-500 ml-2 bg-gray-800 px-2 py-0.5 rounded-full">
                                                            +{participantCount - 6}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pl-4 flex-shrink-0 self-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-700/50 group-hover:bg-indigo-600/20 flex items-center justify-center transition-all">
                                                    <FiChevronRight
                                                        size={16}
                                                        className="text-gray-500 group-hover:text-indigo-400 transition-colors group-hover:translate-x-0.5 transition-transform"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingHistory;

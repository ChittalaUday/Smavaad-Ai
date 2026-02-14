import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createMeeting, getMyMeetings } from "../api";
import { useAuth } from "../context/AuthContext";
import { format, formatDistanceStrict } from "date-fns";
import {
    FiVideo,
    FiClock,
    FiUsers,
    FiPlus,
    FiSearch,
    FiFileText,
} from "react-icons/fi";
import { toast } from "react-toastify";

export default function MeetingSidebar({ onSelectMeeting, selectedMeetingId }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [meetingCode, setMeetingCode] = useState("");
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("all");

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

    return (
        <div className="h-full w-full flex flex-col bg-transparent overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                            Meetings
                        </h1>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                            {meetings.length} RECORDS
                        </p>
                    </div>
                    <button
                        onClick={handleCreateMeeting}
                        disabled={creating}
                        className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                    >
                        <FiPlus size={14} />
                        New
                    </button>
                </div>

                {/* Join with code */}
                <form onSubmit={joinMeeting} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        required
                        className="flex-1 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/20 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 backdrop-blur-sm transition-all"
                        placeholder="Enter meeting code..."
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!meetingCode.trim()}
                        className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                    >
                        Join
                    </button>
                </form>

                {/* Search */}
                <div className="relative group mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <FiSearch size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search meetings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-md border border-slate-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium shadow-sm"
                    />
                </div>

                {/* Filter pills */}
                <div className="flex gap-2">
                    {["all", "hosted", "joined"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all duration-200 border ${filter === f
                                ? "bg-primary/10 border-primary/20 text-primary"
                                : "bg-transparent border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/10"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>


            {/* Meeting List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar -mr-1 pr-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 opacity-50">
                        <FiVideo className="mx-auto text-slate-400 mb-2" size={24} />
                        <p className="text-slate-500 text-xs">No meetings found</p>
                    </div>
                ) : (
                    filtered.map((meeting) => {
                        const isHost = meeting.host?._id === user?._id;
                        const participantCount = meeting.participants?.length || 0;
                        const hasSummary = !!meeting.summary;
                        const isLive = meeting.status === "active";
                        const isActive = selectedMeetingId === meeting.meetingId;

                        return (
                            <button
                                key={meeting._id}
                                onClick={() => onSelectMeeting && onSelectMeeting(meeting.meetingId)}
                                className={`w-full text-left rounded-xl p-3 transition-all duration-200 group border
                                    ${isActive
                                        ? "bg-white/20 dark:bg-white/10 border-white/20 shadow-lg backdrop-blur-md"
                                        : "bg-transparent border-transparent hover:bg-white/10 dark:hover:bg-white/5 hover:border-white/10"
                                    }
                                `}
                            >
                                {/* Top row */}
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-400/50"}`} />
                                    <span className={`text-[13px] font-semibold truncate transition-colors ${isActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                                        {meeting.type === "call" ? "Call" : "Meeting"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono ml-auto opacity-70">
                                        {format(new Date(meeting.createdAt), "MMM d")}
                                    </span>
                                </div>

                                {/* Meta */}
                                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-1.5">
                                            {meeting.participants?.slice(0, 3).map((p, i) => (
                                                <img
                                                    key={p._id || i}
                                                    src={p.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.username || "U")}`}
                                                    className="w-4 h-4 rounded-full border border-white dark:border-slate-800"
                                                />
                                            ))}
                                        </div>
                                        {participantCount > 0 && <span>{participantCount}</span>}
                                    </div>
                                    {hasSummary && <FiFileText className="text-primary" size={12} />}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

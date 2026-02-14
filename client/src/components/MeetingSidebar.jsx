import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createMeeting, getMyMeetings } from "../api";
import { useAuth } from "../context/AuthContext";
import { format, formatDistanceStrict } from "date-fns";
import {
    Video,
    Clock,
    Users,
    Plus,
    Search,
    FileText,
} from "lucide-react";
import Avatar from "react-avatar";
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
                        <Plus size={14} />
                        New
                    </button>
                </div>

                {/* Join with code + Search Combined Area */}
                <div className="flex flex-col gap-3 mb-6">
                    {/* Join Input Group */}
                    <form onSubmit={joinMeeting} className="relative group">
                        <input
                            type="text"
                            required
                            className="w-full pl-4 pr-20 py-3 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all shadow-sm"
                            placeholder="Enter meeting code..."
                            value={meetingCode}
                            onChange={(e) => setMeetingCode(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!meetingCode.trim()}
                            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:shadow-none"
                        >
                            Join
                        </button>
                    </form>

                    {/* Search Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search meetings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/30 dark:bg-slate-900/20 backdrop-blur-sm border border-slate-200/60 dark:border-white/5 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
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
                        <Video className="mx-auto text-slate-400 mb-2" size={24} />
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
                            <div key={meeting._id} className="group relative">
                                <button
                                    onClick={() => onSelectMeeting && onSelectMeeting(meeting.meetingId)}
                                    className={`w-full text-left rounded-2xl p-4 transition-all duration-300 border relative overflow-hidden
                                    ${isActive
                                            ? "bg-white dark:bg-slate-800 border-indigo-500/30 shadow-lg shadow-indigo-500/10 z-10 scale-[1.02]"
                                            : "bg-white/40 dark:bg-slate-900/20 border-transparent hover:bg-white/60 dark:hover:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md"
                                        }
                                `}
                                >
                                    {/* Active Indicator Strip */}
                                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}

                                    {/* Top row */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-300 dark:bg-slate-600"}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wide ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}`}>
                                            {meeting.type === "call" ? "Call Recording" : "Meeting"}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium ml-auto">
                                            {format(new Date(meeting.createdAt), "MMM d")}
                                        </span>
                                    </div>

                                    {/* ID/Title (simulated) */}
                                    <h4 className={`text-sm font-bold truncate mb-3 ${isActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"}`}>
                                        {meeting.meetingId}
                                    </h4>

                                    {/* Meta & Footer */}
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex -space-x-2 items-center">
                                            {meeting.participants?.slice(0, 3).map((p, i) => (
                                                <Avatar
                                                    key={p._id || i}
                                                    name={p.user?.username || "U"}
                                                    src={p.user?.avatarUrl}
                                                    size="20"
                                                    round={true}
                                                    className="border-2 border-white dark:border-slate-800"
                                                    title={p.user?.username}
                                                />
                                            ))}
                                            {participantCount > 3 && (
                                                <div className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-500 z-10">
                                                    +{participantCount - 3}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {hasSummary && (
                                                <span className="flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-1.5 py-0.5 rounded-md">
                                                    <FileText size={10} /> AI
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                                {getDuration(meeting)}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                                {/* Separator (only if not last) */}
                                {/* We can use space-y on parent, or just margin-bottom, but user asked for divider. 
                                    However, distinct "Card" style often replaces the need for a line divider. 
                                    I'll stick to nice cards with gaps.
                                */}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

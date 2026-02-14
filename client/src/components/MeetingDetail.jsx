import React, { useState, useEffect } from "react";
import { getMeetingDetail, summarizeMeeting, transcribeMeeting, generateMeetingPdf, generateMeetingTranscriptPdf } from "../api";
import { format, formatDistanceStrict } from "date-fns";
import {
    Video, Clock, Users, FileText, ArrowLeft, MessageSquare, Calendar, Copy, Download, Zap, CheckCircle, Cpu
} from "lucide-react";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import Avatar from "react-avatar";
import { useToast } from "../context/ToastContext";

import ActionLoader from "./ActionLoader";

export default function MeetingDetail({ meetingId, onBack, user }) {
    const { showToast } = useToast();
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("summary");
    const [actionMessage, setActionMessage] = useState(null);

    // Action states (keeping for buttondisabled logic if needed, simplify if possible)
    const [actionLoading, setActionLoading] = useState({
        transcribing: false,
        summarizing: false,
        generatingPdf: false,
        generatingTranscriptPdf: false,
    });

    useEffect(() => {
        if (meetingId) {
            fetchDetail();
        }
    }, [meetingId]);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const { data } = await getMeetingDetail(meetingId);
            setMeeting(data.data);
            setActiveTab("summary");
        } catch (error) {
            console.error("Failed to load meeting detail:", error);
            showToast("Couldn't load meeting details", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-transparent gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400">Loading details...</span>
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-transparent gap-3">
                <Video className="text-gray-300 dark:text-gray-600" size={32} />
                <p className="text-gray-400 text-sm">Select a meeting to view details</p>
            </div>
        );
    }

    const duration =
        meeting.startTime && meeting.endTime
            ? formatDistanceStrict(new Date(meeting.startTime), new Date(meeting.endTime))
            : "—";
    const isHost = meeting.host?._id === user?._id;
    const isLive = meeting.status === "active";


    const handleAction = async (type) => {
        let msg = "Processing...";
        if (type === "transcribing") msg = "Generating Transcript...";
        if (type === "summarizing") msg = "Generating Summary...";
        if (type === "generatingPdf") msg = "Generating PDF...";

        try {
            setActionLoading(prev => ({ ...prev, [type]: true }));
            setActionMessage(msg);
            showToast(`${msg} started`, "info", 2000);

            let response;
            if (type === "transcribing") {
                response = await transcribeMeeting(meeting.meetingId);
                showToast("Transcription generated successfully!", "success");
            } else if (type === "summarizing") {
                response = await summarizeMeeting(meeting.meetingId);
                showToast("Summary generated successfully!", "success");
            } else if (type === "generatingPdf") {
                response = await generateMeetingPdf(meeting.meetingId);
                showToast("PDF generated successfully!", "success");
            }

            if (response?.data?.data) {
                // Update local meeting object
                setMeeting(prev => ({
                    ...prev,
                    transcript: response.data.data.transcript || prev.transcript,
                    summary: response.data.data.summary || prev.summary,
                    actionItems: response.data.data.actionItems || prev.actionItems,
                    pdfUrl: response.data.data.pdfUrl || prev.pdfUrl
                }));
            }
        } catch (error) {
            console.error(`Action ${type} failed:`, error);
            showToast(`Failed to process request: ${error.response?.data?.message || "Unknown error"}`, "error");
        } finally {
            setActionLoading(prev => ({ ...prev, [type]: false }));
            setActionMessage(null);
        }
    };

    const handleGenerateTranscriptPdf = async () => {
        try {
            const msg = "Generating Transcript PDF...";
            setActionLoading(prev => ({ ...prev, generatingTranscriptPdf: true }));
            setActionMessage(msg);
            showToast(msg, "info", 2000);

            const response = await generateMeetingTranscriptPdf(meeting.meetingId);
            const blob = new Blob([response.data], { type: "application/pdf" });
            saveAs(blob, `transcript-${meeting.meetingId}.pdf`);
            showToast("Transcript PDF downloaded successfully!", "success");
        } catch (error) {
            console.error("Failed to generate transcript PDF:", error);
            showToast("Failed to generate PDF", "error");
        } finally {
            setActionLoading(prev => ({ ...prev, generatingTranscriptPdf: false }));
            setActionMessage(null);
        }
    };

    const handleDownloadAudio = async () => {
        if (!meeting.audioUrl) return;
        const url = meeting.audioUrl.startsWith("http") ? meeting.audioUrl : `${import.meta.env.VITE_SERVER_URL}${meeting.audioUrl.startsWith("/") ? "" : "/"}${meeting.audioUrl}`;
        const filename = `meeting-${meeting.meetingId}.webm`;

        try {
            const msg = "Downloading audio...";
            setActionMessage(msg);
            showToast("Starting download...", "info", 2000);

            const response = await fetch(url);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            saveAs(blob, filename);
            showToast("Audio downloaded successfully!", "success");
        } catch (error) {
            console.error("Download failed:", error);
            showToast("Failed to download audio", "error");
        } finally {
            setActionMessage(null);
        }
    };

    const TABS = [
        { id: "summary", label: "Summary", icon: FileText },
        { id: "transcript", label: "Transcript", icon: FileText },
        { id: "chat", label: "Chat", icon: MessageSquare, count: meeting.messages?.length || 0 },
        { id: "participants", label: "People", icon: Users, count: meeting.participants?.length || 0 },
    ];

    return (
        <div className="relative h-full w-full flex flex-col font-sans bg-transparent">
            {actionMessage && <ActionLoader message={actionMessage} />}
            {/* --- Glass Header --- */}
            <div className="absolute top-0 w-full z-20 p-4">
                <div className="flex flex-col gap-4 p-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl shadow-lg transition-all">

                    {/* Top Row: Title, Status, Back */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    className="md:hidden p-2 hover:bg-white/20 rounded-full transition-colors -ml-2 text-slate-600 dark:text-slate-300"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                            )}

                            <div className={`p-2.5 rounded-xl ${meeting.type === 'call'
                                ? 'bg-indigo-500/10 text-indigo-500'
                                : 'bg-purple-500/10 text-purple-500'
                                }`}>
                                {meeting.type === "call" ? <Video size={20} /> : <Users size={20} />}
                            </div>

                            <div>
                                <h1 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight flex items-center gap-2">
                                    {meeting.type === "call" ? "Call Recording" : "Meeting Details"}
                                    {isLive ? (
                                        <span className="flex h-2.5 w-2.5 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Ended</span>
                                    )}
                                </h1>
                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {meeting.createdAt ? format(new Date(meeting.createdAt), "MMM d, h:mm a") : "—"}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {duration}
                                    </span>
                                    <div className="flex items-center gap-2 ml-2">
                                        <CopyButton text={meeting.meetingId} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions (Desktop) */}
                        <div className="hidden md:flex items-center gap-2">
                            {meeting.audioUrl && (
                                <button
                                    onClick={handleDownloadAudio}
                                    className="p-2 hover:bg-white/20 dark:hover:bg-slate-700/50 rounded-xl text-indigo-500 transition-colors"
                                    title="Download Audio"
                                >
                                    <Download size={18} />
                                </button>
                            )}
                            {meeting.pdfUrl && (
                                <a
                                    href={meeting.pdfUrl.startsWith("http") ? meeting.pdfUrl : `${import.meta.env.VITE_SERVER_URL}${meeting.pdfUrl.startsWith("/") ? "" : "/"}${meeting.pdfUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-white/20 dark:hover:bg-slate-700/50 rounded-xl text-red-500 transition-colors"
                                    title="View PDF Report"
                                >
                                    <FileText size={18} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 gap-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl overflow-x-auto no-scrollbar">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center justify-center gap-2 flex-1 min-w-[80px] py-2 px-3 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/25"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/30"
                                        }`}
                                >
                                    <Icon size={14} className={isActive ? "text-white" : ""} />
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive
                                            ? "bg-white/20 text-white"
                                            : "bg-slate-200 dark:bg-slate-700/50 text-slate-500"
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- Scrollable Content --- */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-44 pb-20 custom-scrollbar">

                {/* Mobile Actions Grid (only visible on mobile if needed, or keeping interactions within tabs) */}
                {/* Action Buttons Area */}
                {!isLive && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        {/* Transcribe Action */}
                        <div className="relative group">
                            <button
                                onClick={() => handleAction("transcribing")}
                                disabled={actionLoading.transcribing || !meeting.audioUrl}
                                title={!meeting.audioUrl ? "No audio recording available to transcribe" : "Generate a text transcription of the meeting"}
                                className={`w-full flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${meeting.audioUrl
                                    ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200/60 dark:border-amber-700/30 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1"
                                    : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed"
                                    }`}
                            >
                                <div className={`p-3 rounded-full ${meeting.audioUrl ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                                    }`}>
                                    {actionLoading.transcribing ? (
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Cpu size={20} />
                                    )}
                                </div>
                                <div className="text-center">
                                    <span className={`block font-bold text-sm ${meeting.audioUrl ? "text-slate-800 dark:text-slate-100" : "text-slate-500 font-medium"}`}>
                                        {meeting.transcript ? "Regenerate Transcript" : "Generate Transcript"}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                                        Convert audio to text
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Summarize Action */}
                        <div className="relative group">
                            <button
                                onClick={() => handleAction("summarizing")}
                                disabled={actionLoading.summarizing || !meeting.transcript}
                                title={!meeting.transcript ? "Generate a transcript first to enable summarization" : "Generate an AI summary of the meeting"}
                                className={`w-full flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${meeting.transcript
                                    ? "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 border-indigo-200/60 dark:border-indigo-700/30 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
                                    : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed"
                                    }`}
                            >
                                <div className={`p-3 rounded-full ${meeting.transcript ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                                    }`}>
                                    {actionLoading.summarizing ? (
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Zap size={20} />
                                    )}
                                </div>
                                <div className="text-center">
                                    <span className={`block font-bold text-sm ${meeting.transcript ? "text-slate-800 dark:text-slate-100" : "text-slate-500 font-medium"}`}>
                                        {meeting.summary ? "Regenerate Summary" : "Generate Summary"}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                                        AI-powered insights
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* PDF Action */}
                        <div className="relative group">
                            <button
                                onClick={handleGenerateTranscriptPdf}
                                disabled={actionLoading.generatingTranscriptPdf || !meeting.audioUrl}
                                title={!meeting.audioUrl ? "No audio available" : "Download transcript as PDF"}
                                className={`w-full flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${meeting.audioUrl
                                    ? "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 border-red-200/60 dark:border-red-700/30 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-1"
                                    : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed"
                                    }`}
                            >
                                <div className={`p-3 rounded-full ${meeting.audioUrl ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                                    }`}>
                                    {actionLoading.generatingTranscriptPdf ? (
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <FileText size={20} />
                                    )}
                                </div>
                                <div className="text-center">
                                    <span className={`block font-bold text-sm ${meeting.audioUrl ? "text-slate-800 dark:text-slate-100" : "text-slate-500 font-medium"}`}>
                                        Transcript PDF
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                                        Download report
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                <div className="animate-fade-in-up">
                    {activeTab === "summary" && <SummaryContent meeting={meeting} onDownloadAudio={handleDownloadAudio} />}
                    {activeTab === "transcript" && <TranscriptContent meeting={meeting} />}
                    {activeTab === "chat" && <ChatContent meeting={meeting} user={user} />}
                    {activeTab === "participants" && <ParticipantsContent meeting={meeting} user={user} />}
                </div>
            </div>
        </div>
    );
}

// ─── Sub-Components (Styled) ───

function CopyButton({ text }) {
    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        showToast("Copied!", "success");
    };
    const { showToast } = useToast();
    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-indigo-500 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-white/10 px-2 py-1 rounded-lg transition-all group border border-transparent hover:border-indigo-100"
            title="Copy Meeting ID"
        >
            <span className="font-mono">{text?.slice(0, 8)}...</span>
            <Copy size={10} className="group-hover:scale-110 transition-transform" />
        </button>
    );
}

function SummaryContent({ meeting, onDownloadAudio }) {
    if (!meeting.summary && (!meeting.actionItems || meeting.actionItems.length === 0)) {
        return (
            <EmptyState icon={FileText} title="No AI summary" subtitle="Generate a summary using the controls above." />
        );
    }

    return (
        <div className="space-y-4">
            {meeting.summary && (
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <FileText size={16} />
                        </div>
                        Executive Summary
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {meeting.summary}
                    </p>
                </div>
            )}

            {meeting.audioUrl && (
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/10 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white mb-0.5">Meeting Recording</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Review the full audio conversation</p>
                    </div>
                    <button
                        onClick={onDownloadAudio}
                        className="flex items-center gap-1.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all"
                    >
                        <Download size={14} />
                        Download
                    </button>
                </div>
            )}

            {meeting.actionItems && meeting.actionItems.length > 0 && (
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={16} />
                        </div>
                        Action Items
                    </h4>
                    <div className="grid gap-3">
                        {meeting.actionItems.map((item, idx) => (
                            <div key={idx} className="flex gap-3 p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 relative group hover:border-indigo-200 transition-colors">
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-emerald-500 group-hover:border-emerald-500 transition-colors">
                                    <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-emerald-500 transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{item.task || item}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {item.owner && (
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                                                {item.owner}
                                            </span>
                                        )}
                                        {item.deadline && (
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
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

function TranscriptContent({ meeting }) {
    if (!meeting.transcript) {
        return (
            <EmptyState icon={FileText} title="No transcript available" subtitle="Generate a transcript to see conversation text." />
        );
    }
    return (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-2xl p-6 shadow-sm">
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-7 whitespace-pre-wrap font-mono">
                {meeting.transcript}
            </div>
        </div>
    );
}

function ChatContent({ meeting, user }) {
    const messages = meeting.messages || [];
    if (messages.length === 0) {
        return (
            <EmptyState icon={MessageSquare} title="No messages" subtitle="Chat history is empty for this meeting." />
        );
    }
    return (
        <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => {
                const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                const senderName = typeof msg.sender === "object" ? msg.sender.username : "Unknown";
                return (
                    <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[11px] text-slate-500 font-semibold">
                                {isMe ? "You" : senderName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                                {msg.timestamp ? format(new Date(msg.timestamp), "h:mm a") : ""}
                            </span>
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${isMe
                            ? "bg-indigo-500 text-white rounded-tr-sm"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm"
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ParticipantsContent({ meeting, user }) {
    const participants = meeting.participants || [];
    if (participants.length === 0) {
        return <EmptyState icon={Users} title="No participants found" />;
    }
    return (
        <div className="grid gap-3">
            {participants.map((p, idx) => {
                const u = p.user || {};
                const isCurrentUser = u._id === user?._id;
                const isHostParticipant = meeting.host?._id === u._id;
                return (
                    <div
                        key={u._id || idx}
                        className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-white/5 rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Avatar
                                name={u.username || "Unknown"}
                                src={u.avatarUrl}
                                size="40"
                                round={true}
                                className="shadow-sm ring-2 ring-white dark:ring-slate-700"
                            />
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    {u.username || "Unknown"}
                                    {isCurrentUser && <span className="text-xs text-slate-400 font-normal">(You)</span>}
                                </p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {isHostParticipant && (
                                <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                    Host
                                </span>
                            )}
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.status === "joined"
                                ? "text-green-600 bg-green-100 dark:bg-green-900/20"
                                : "text-slate-400 bg-slate-100 dark:bg-slate-800"
                                }`}>
                                {p.status}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function EmptyState({ icon: Icon, title, subtitle }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center opacity-70">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Icon className="text-slate-400 dark:text-slate-500" size={24} />
            </div>
            <h3 className="text-slate-800 dark:text-white font-semibold">{title}</h3>
            {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs">{subtitle}</p>}
        </div>
    );
}

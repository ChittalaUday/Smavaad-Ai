import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMeeting } from "../../context/MeetingContext";
import VideoGrid from "./VideoGrid";
import Controls from "./Controls";
import LiveTranscript from "./LiveTranscript";
import CallWrapUp from "./CallWrapUp";
import Chat from "./Chat";
import ParticipantList from "./ParticipantList";
import InMeetingPersonalChat from "./InMeetingPersonalChat";
import { CALL_STATES } from "../../hooks/useCallStateManager";
import {
    Clock,
    Copy,
    Check,
    Sparkles,
    Video as VideoIcon,
    MessageSquare
} from "lucide-react";
import Avatar from "react-avatar";
import { toast } from "react-toastify";

/**
 * Full-screen overlay that renders the active video call.
 *
 * Integrates:
 *  - LiveTranscript panel
 *  - CallWrapUp card
 *  - Duration display header
 *  - Chat & Participant Sidebars
 *  - In-meeting chat notification toasts
 *  - Floating emoji reactions
 */

// ─── Chat Notification Toast ───
const ChatNotificationToast = ({ sender, text, avatarUrl, onView, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div
            className="flex items-start gap-3 max-w-sm bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl animate-fade-in-down cursor-pointer hover:bg-white/10 transition-all"
            onClick={onView}
        >
            <Avatar name={sender} src={avatarUrl} size="36" round={true} className="shadow-md flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{sender}</p>
                <p className="text-slate-300 text-xs truncate mt-0.5">{text}</p>
            </div>
            <div className="flex-shrink-0 p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                <MessageSquare size={14} />
            </div>
        </div>
    );
};

// ─── Floating Emoji Reaction Animation ───
const FloatingEmoji = ({ emoji, id, onComplete }) => {
    const xOffset = useRef(Math.random() * 200 - 100);
    const size = useRef(32 + Math.random() * 24);
    const duration = useRef(1.5 + Math.random() * 1);

    useEffect(() => {
        const timer = setTimeout(() => onComplete(id), duration.current * 1000);
        return () => clearTimeout(timer);
    }, [id, onComplete]);

    return (
        <span
            className="absolute bottom-24 pointer-events-none select-none z-[10003]"
            style={{
                left: `calc(50% + ${xOffset.current}px)`,
                fontSize: `${size.current}px`,
                animation: `float-up ${duration.current}s ease-out forwards`,
            }}
        >
            {emoji}
        </span>
    );
};

const CallOverlay = () => {
    const {
        activeMeeting,
        leaveMeeting,
        callState,
        transcript,
        extractedIntents,
        callSummary,
        formattedDuration,
        greeting,
        showTranscript,
        toggleTranscript,
        handleDismissWrapUp,
        isSummarizing,
        meetingFiles,
        retrySummarization,
        messages: meetingMessages
    } = useMeeting();

    // UI State
    const [activeSidebar, setActiveSidebar] = useState(null);
    const [chatNotifications, setChatNotifications] = useState([]);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const prevMessageCountRef = useRef(0);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [linkCopied, setLinkCopied] = useState(false);
    const [personalChatData, setPersonalChatData] = useState(null);

    // Track new incoming meeting messages for notifications
    useEffect(() => {
        if (!meetingMessages || meetingMessages.length === 0) {
            prevMessageCountRef.current = 0;
            return;
        }

        const prevCount = prevMessageCountRef.current;
        const currentCount = meetingMessages.length;

        if (currentCount > prevCount && prevCount > 0) {
            const newMessages = meetingMessages.slice(prevCount);
            const incomingMessages = newMessages.filter(msg => !msg.isLocal);

            if (incomingMessages.length > 0 && activeSidebar !== "meeting-chat") {
                incomingMessages.forEach((msg) => {
                    const notif = {
                        id: Date.now() + Math.random(),
                        sender: msg.sender || "Participant",
                        text: msg.text || "",
                        avatarUrl: msg.avatarUrl || null,
                    };
                    setChatNotifications(prev => [...prev.slice(-2), notif]);
                });
                setUnreadChatCount(prev => prev + incomingMessages.length);
            }
        }

        prevMessageCountRef.current = currentCount;
    }, [meetingMessages, activeSidebar]);

    // Clear unread when chat opened
    useEffect(() => {
        if (activeSidebar === "meeting-chat") {
            setUnreadChatCount(0);
            setChatNotifications([]);
        }
    }, [activeSidebar]);

    const dismissNotification = useCallback((id) => {
        setChatNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const handleViewChat = useCallback(() => {
        setActiveSidebar("meeting-chat");
        setChatNotifications([]);
        setUnreadChatCount(0);
    }, []);

    // Emoji reactions
    const handleReaction = useCallback((emoji) => {
        const count = 4 + Math.floor(Math.random() * 4);
        const newReactions = Array.from({ length: count }, (_, i) => ({
            id: Date.now() + i + Math.random(),
            emoji,
        }));
        setFloatingReactions(prev => [...prev, ...newReactions]);
    }, []);

    const removeReaction = useCallback((id) => {
        setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, []);

    // Invite / Copy meeting link
    const handleInvite = useCallback(() => {
        if (!activeMeeting?.meetingId) return;

        const meetingLink = `${window.location.origin}/meeting/${activeMeeting.meetingId}`;

        navigator.clipboard.writeText(meetingLink)
            .then(() => {
                setLinkCopied(true);
                toast.success("Meeting link copied to clipboard!", { autoClose: 2000 });
                setTimeout(() => setLinkCopied(false), 2500);
            })
            .catch(() => {
                // Fallback: select and copy from a temp input
                const input = document.createElement("input");
                input.value = meetingLink;
                document.body.appendChild(input);
                input.select();
                document.execCommand("copy");
                document.body.removeChild(input);
                setLinkCopied(true);
                toast.success("Meeting link copied!", { autoClose: 2000 });
                setTimeout(() => setLinkCopied(false), 2500);
            });
    }, [activeMeeting]);

    const handleParticipantAction = (action, chatData) => {
        if (action === "personal-chat" && chatData) {
            setPersonalChatData(chatData);
            setActiveSidebar("personal-chat");
        } else {
            setActiveSidebar(null);
        }
    };

    console.log("CallOverlay render — activeMeeting:", activeMeeting, "callState:", callState);

    if (!activeMeeting) return null;

    // Show CallWrapUp when call has ENDED
    if (callState === CALL_STATES.ENDED) {
        return (
            <CallWrapUp
                formattedDuration={formattedDuration}
                callSummary={callSummary}
                extractedIntents={extractedIntents}
                transcript={transcript}
                onDismiss={handleDismissWrapUp}
                isLoading={isSummarizing}
                meetingFiles={meetingFiles}
                onRetrySummarize={retrySummarization}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col font-sans">

            {/* ─── Chat Notification Toasts (top center) ─── */}
            {chatNotifications.length > 0 && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[10002] flex flex-col gap-2 items-center pointer-events-auto">
                    {chatNotifications.map((notif) => (
                        <ChatNotificationToast
                            key={notif.id}
                            sender={notif.sender}
                            text={notif.text}
                            avatarUrl={notif.avatarUrl}
                            onView={handleViewChat}
                            onDismiss={() => dismissNotification(notif.id)}
                        />
                    ))}
                </div>
            )}

            {/* --- Top Header Bar --- */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl shadow-lg">
                    {/* Logo / Title Area */}
                    <div className="flex items-center gap-3 border-r border-white/10 pr-4">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <VideoIcon size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white leading-none">SAMVAAD AI</h1>
                            <span className="text-[10px] text-indigo-300 font-medium tracking-wide">Video Meeting</span>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                        </div>
                        <div className="px-2 py-0.5 bg-white/5 rounded-md text-slate-300 font-mono">
                            ID: {activeMeeting.meetingId}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                            <Clock size={12} />
                            <span>{formattedDuration}</span>
                        </div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="pointer-events-auto flex items-center gap-3">
                    <button
                        className={`flex items-center gap-2 px-3 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-lg ${linkCopied
                            ? "bg-emerald-600 shadow-emerald-500/20"
                            : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
                            }`}
                        onClick={handleInvite}
                    >
                        {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                        {linkCopied ? "Copied!" : "Invite"}
                    </button>

                    <button
                        onClick={toggleTranscript}
                        className={`p-2.5 rounded-xl transition-all border ${showTranscript
                            ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                            : "bg-white/10 hover:bg-white/20 border-white/10 text-slate-300"}`}
                        title="Toggle AI Transcript"
                    >
                        <Sparkles size={18} />
                    </button>
                </div>
            </div>

            {/* Greeting Banner (INITIALIZED state) */}
            {greeting && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-indigo-900/80 backdrop-blur border border-indigo-500/30 px-6 py-2 rounded-full text-sm text-indigo-200 shadow-xl animate-fade-in-down">
                    {greeting}
                </div>
            )}

            {/* --- Main Video Area --- */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
                <VideoGrid />

                {/* Floating Live Transcript / Insights Overlay */}
                <LiveTranscript
                    transcript={transcript}
                    extractedIntents={extractedIntents}
                    isOpen={showTranscript}
                    onClose={toggleTranscript}
                />
            </div>

            {/* ─── Sidebars (rendered OUTSIDE overflown-hidden container) ─── */}
            {/* Meeting Chat Sidebar */}
            <Chat
                isOpen={activeSidebar === "meeting-chat"}
                onClose={() => setActiveSidebar(null)}
            />

            {/* Participant List Sidebar */}
            {activeSidebar === "participants" && (
                <ParticipantList
                    onClose={handleParticipantAction}
                />
            )}

            {/* Personal Chat Sidebar */}
            {activeSidebar === "personal-chat" && personalChatData && (
                <InMeetingPersonalChat
                    chatData={personalChatData}
                    onBack={() => setActiveSidebar("participants")}
                    onClose={() => setActiveSidebar(null)}
                />
            )}

            {/* ─── Floating Emoji Reactions ─── */}
            {floatingReactions.map((r) => (
                <FloatingEmoji key={r.id} id={r.id} emoji={r.emoji} onComplete={removeReaction} />
            ))}

            {/* --- Bottom Controls --- */}
            <Controls
                onChatToggle={() => {
                    setActiveSidebar(activeSidebar === "meeting-chat" ? null : "meeting-chat");
                }}
                onParticipantsToggle={() => {
                    setActiveSidebar(activeSidebar === "participants" ? null : "participants");
                }}
                chatBadge={unreadChatCount > 0 ? unreadChatCount : null}
                onReaction={handleReaction}
            />
        </div>
    );
};

export default CallOverlay;

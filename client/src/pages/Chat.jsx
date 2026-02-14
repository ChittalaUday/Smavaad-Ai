import React, { useEffect, useState } from "react";
import UnifiedSidebar from "../components/UnifiedSidebar";
import ChatsSection from "../components/ChatsSection";
import AIChat from "./AIChat";
import AudioPdfSection from "../components/AudioPdfSection";
import MeetingDetail from "../components/MeetingDetail";
import { AddChat } from "../components/AddChat";
import VideoChat from "../components/VideoChat";
import IncomingCall from "../components/IncomingCall";
import { useChat } from "../context/ChatContext";
import { useConnectWebRtc } from "../context/WebRtcContext";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

export default function Chat() {
  const {
    currentSelectedChat,
    activeLeftSidebar,
    setActiveLeftSidebar,
    isChatSelected,
    setIsChatSelected // Assuming this exists to manually toggle if needed
  } = useChat();
  const { showVideoComp, incomingOffer } = useConnectWebRtc();
  const { user } = useAuth();
  const location = useLocation();

  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

  useEffect(() => {
    if (location.state?.sidebar) {
      setActiveLeftSidebar(location.state.sidebar);
    }
  }, [location.state, setActiveLeftSidebar]);

  // Determine if the Right Panel should be visible on Mobile
  const isMobileRightPanelOpen =
    isChatSelected ||
    (activeLeftSidebar === "meeting" && selectedMeetingId) ||
    activeLeftSidebar === "aiChat" ||
    activeLeftSidebar === "audioPdf";

  const renderRightPanel = () => {
    switch (activeLeftSidebar) {
      case "aiChat":
        // Wrapper with mobile back button could be added here
        return (
          <div className="h-full flex flex-col">
            <MobileHeader title="AI Assistant" onBack={() => {
              setActiveLeftSidebar("recentChats");
              setIsChatSelected(false);
            }} />
            <AIChat />
          </div>
        );
      case "audioPdf":
        return (
          <div className="h-full w-full flex flex-col relative">
            <MobileHeader title="Audio to PDF" onBack={() => {
              setActiveLeftSidebar("recentChats");
              setIsChatSelected(false);
            }} />
            <div className="flex-1 w-full relative h-full">
              <AudioPdfSection />
            </div>
          </div>
        );
      case "meeting":
        return <MeetingDetail meetingId={selectedMeetingId} onBack={() => setSelectedMeetingId(null)} user={user} />;
      case "recentChats":
      case "searchUser":
      case "profile":
      default:
        if (currentSelectedChat.current?._id) {
          return <ChatsSection />;
        } else {
          return (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-8 text-center animate-enter">
              <div className="text-8xl mb-6 opacity-30 animate-pulse">✨</div>
              <h1 className="text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                Welcome to Samvaad AI
              </h1>
              <p className="text-lg opacity-70 max-w-md">
                Select a conversation from the sidebar or start a new meeting to begin.
              </p>
            </div>
          );
        }
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-black overflow-hidden relative font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse-slow delay-1000" />
      </div>

      {/* Modals & Overlays */}
      <div className="z-50">
        <AddChat open={true} />
        {!!incomingOffer && (
          <IncomingCall
            incomingOffer={incomingOffer}
            active={!!incomingOffer}
          />
        )}
        <VideoChat show={showVideoComp} />
      </div>

      {/* Main Layout Container */}
      <div className="z-10 flex w-full h-full p-4 gap-4 box-border">

        {/* Left Panel: Sidebar + List */}
        <aside
          className={`
            flex-shrink-0 h-full transition-all duration-300 ease-in-out
            md:block md:w-[320px] lg:w-[360px]
            ${isMobileRightPanelOpen ? "hidden" : "w-full"}
          `}
        >
          <UnifiedSidebar
            activeLeftSidebar={activeLeftSidebar}
            setActiveLeftSidebar={setActiveLeftSidebar}
            onSelectMeeting={setSelectedMeetingId}
            selectedMeetingId={selectedMeetingId}
          />
        </aside>

        {/* Right Panel: Content */}
        <main
          className={`
            flex-1 h-full glass-panel rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-300 border border-white/20 dark:border-white/5
            md:flex
            ${isMobileRightPanelOpen ? "flex" : "hidden"}
          `}
        >
          {renderRightPanel()}
        </main>
      </div>
    </div>
  );
}

// Simple Mobile Header Helper
const MobileHeader = ({ title, onBack }) => (
  <div className="md:hidden flex items-center p-4 border-b border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md">
    <button onClick={onBack} className="mr-3 text-slate-500 hover:text-white">
      <FiMenu size={20} />
    </button>
    <span className="font-semibold text-slate-800 dark:text-white">{title}</span>
  </div>
);

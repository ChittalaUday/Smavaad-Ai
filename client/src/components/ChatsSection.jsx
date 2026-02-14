import React, { useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import {
  BiSearch,
  BsThreeDotsVertical,
  FaFile,
  FiImage,
  ImEnlarge2,
  IoMdSend,
  IoVideocamOutline,
  MdArrowBackIos,
  MdDeleteOutline,
  PiDownloadSimpleBold,
  RxCross2,
} from "../assets";
import { BsMagic, BsRobot } from "react-icons/bs";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import moment from "moment";
import Loading from "./Loading";
import { getOpponentParticipant, limitChar } from "../utils";
import OutsideClickHandler from "react-outside-click-handler";
import { useConnectWebRtc } from "../context/WebRtcContext";
import { useMeeting } from "../context/MeetingContext";
import ViewImage from "./ViewImage";
import Avatar from "react-avatar";
import { summarizeChat, chatWithConversation } from "../api";
import AIChatModal from "./AIChatModal";

const MessageCont = ({ isOwnMessage, message }) => {
  const { deleteChatMessage } = useChat();
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [isOpenView, setIsOpenView] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const { user } = useAuth();
  const { handleCall, setTargetUserId, checkCallStatus, setCallMessageId, meetingSummaryBlob, lastEndedCallMessageId, downloadMeetingSummary } = useConnectWebRtc();

  const handleEnlargeClick = (url) => {
    setCurrentImageUrl(url);
    setIsOpenView(true);
  };

  const isCallMessage = message.content.includes("Started a video call");

  const handleJoinCall = () => {
    checkCallStatus(message.sender._id, (isActive) => {
      if (isActive) {
        setTargetUserId(message.sender._id);
        setCallMessageId(message._id);
        handleCall();
      } else {
        alert("Call has ended");
      }
    });
  };

  return (
    <div className={`flex w-full mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"} gap-3 group`}>

        {/* Avatar for opponent */}
        {!isOwnMessage && (
          <Avatar
            name={message.sender?.username}
            src={message.sender?.avatarUrl}
            size="32"
            round={true}
            className="self-end mb-1 shadow-sm"
          />
        )}

        <div className="flex flex-col relative">
          <div
            className={`p-4 rounded-2xl shadow-sm backdrop-blur-md border border-white/5 
                ${isOwnMessage
                ? "bg-primary text-white rounded-tr-none"
                : "bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 rounded-tl-none"
              }`}
          >
            {/* Initial logic for call/files kept similar but styled */}
            {isCallMessage && !isOwnMessage && (
              <button onClick={handleJoinCall} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg mb-2 text-sm w-full shadow-md transition-transform active:scale-95">
                Join Call
              </button>
            )}
            {message._id === lastEndedCallMessageId && meetingSummaryBlob && (
              <button
                onClick={downloadMeetingSummary}
                className="bg-blue-500 text-white px-3 py-1 rounded-md mb-2 text-sm hover:bg-blue-600 w-full flex items-center justify-center gap-2"
              >
                <PiDownloadSimpleBold className="text-lg" /> Download Transcript
              </button>
            )}

            {/* Attachments */}
            {message.attachments?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {message.attachments.map((file, idx) => {
                  const isImage = file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                  return isImage ? (
                    <img
                      key={idx}
                      src={file.url}
                      className="w-48 h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleEnlargeClick(file.url)}
                    />
                  ) : (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                      <FaFile />
                      <span className="text-xs truncate max-w-[100px]">{file.url.split('/').pop()}</span>
                      <PiDownloadSimpleBold className="cursor-pointer" onClick={() => saveAs(file.url)} />
                    </div>
                  )
                })}
                {isOpenView && (
                  <ViewImage
                    openView={isOpenView}
                    setOpenView={setIsOpenView}
                    imageUrl={currentImageUrl}
                  />
                )}
              </div>
            )}


            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>

          <div className={`flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium ${isOwnMessage ? "justify-end" : "justify-start"}`}>
            <span>{moment(message.createdAt).fromNow()}</span>
            {isOwnMessage && (
              <OutsideClickHandler onOutsideClick={() => setShowMessageMenu(false)}>
                <div className="relative">
                  <BsThreeDotsVertical
                    className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setShowMessageMenu(!showMessageMenu)}
                  />
                  {showMessageMenu && (
                    <div className="absolute bottom-4 right-0 bg-white dark:bg-slate-800 shadow-xl rounded-lg p-1 z-50 min-w-[100px] border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => deleteChatMessage(message._id)}
                        className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full rounded-md text-xs font-semibold"
                      >
                        <MdDeleteOutline /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </OutsideClickHandler>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const SummaryModal = ({ isOpen, onClose, summary, isLoading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white"><BsMagic className="text-purple-500" /> Chat Summary</h2>
          <button onClick={onClose}><RxCross2 /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar">
          {isLoading ? <Loading /> : summary}
        </div>
      </div>
    </div>
  )
}

export default function ChatsSection() {
  const {
    messages,
    currentSelectedChat,
    loadingMessages,
    message,
    setMessage,
    sendChatMessage,
    attachments,
    setAttachments,
    removeFileFromAttachments,
    deleteUserChat,
    setIsChatSelected,
  } = useChat();
  const { user } = useAuth();
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [showAIChat, setShowAIChat] = useState(false);
  const { startCall } = useMeeting();

  const scrollToBottomRef = useRef();

  const toggleSummary = async () => {
    setShowSummary(true);
    if (summaryContent) return; // Don't regenerate if already present (optional optimization)
    setSummaryLoading(true);
    try {
      const res = await summarizeChat(currentSelectedChat.current._id);
      setSummaryContent(res.data.data.summary);
    } catch (e) { console.error(e); }
    finally { setSummaryLoading(false); }
  }

  const handleCallAction = async () => {
    if (currentSelectedChat.current?.isGroupChat) {
      const participants = currentSelectedChat.current.participants.map(p => p._id);
      await startCall(participants);
    } else {
      const opponent = getOpponentParticipant(currentSelectedChat.current?.participants, user._id);
      if (opponent?._id) await startCall([opponent._id]);
    }
  }

  useEffect(() => { scrollToBottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages]);

  const opponent = !currentSelectedChat.current.isGroupChat
    ? getOpponentParticipant(currentSelectedChat.current?.participants, user._id)
    : null;

  return (
    <div className="relative h-full w-full flex flex-col font-sans">
      <SummaryModal isOpen={showSummary} onClose={() => setShowSummary(false)} summary={summaryContent} isLoading={summaryLoading} />
      <AIChatModal isOpen={showAIChat} onClose={() => setShowAIChat(false)} checkId={currentSelectedChat.current?._id} chatFunction={chatWithConversation} />

      {/* 1. Header (Updated to match AIChat style) */}
      <div className="absolute top-0 w-full z-10 p-4">
        <div className="flex items-center justify-between px-6 py-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl shadow-lg">

          {/* Left Side: Back + Avatar + Name */}
          <div className="flex items-center gap-4">
            <button onClick={() => setIsChatSelected(false)} className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors -ml-2">
              <MdArrowBackIos className="text-slate-600 dark:text-slate-300" />
            </button>

            {currentSelectedChat.current.isGroupChat ? (
              <div className="flex -space-x-3">
                {currentSelectedChat.current.participants.slice(0, 3).map(p => (
                  <Avatar key={p._id} name={p.username} src={p.avatarUrl} size="40" round={true} className="border-2 border-white dark:border-slate-800 shadow-sm" />
                ))}
              </div>
            ) : (
              <div className="relative">
                <Avatar name={opponent?.username} src={opponent?.avatarUrl} size="42" round={true} className="shadow-md" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
              </div>
            )}

            <div>
              <h1 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">
                {currentSelectedChat.current.isGroupChat ? currentSelectedChat.current.name : opponent?.username}
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active now</span>
              </div>
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <button className="p-2.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-purple-600 dark:text-purple-400" title="Summarize conversation" onClick={toggleSummary}>
              <BsMagic size={18} />
            </button>
            <button className="p-2.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-blue-600 dark:text-blue-400" title="Ask AI" onClick={() => setShowAIChat(true)}>
              <BsRobot size={18} />
            </button>
            <button className="p-2.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-slate-700 dark:text-slate-200" title="Start Call" onClick={handleCallAction}>
              <IoVideocamOutline size={20} />
            </button>
            {currentSelectedChat.current?.admin?.toString() === user._id && (
              <button className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all shadow-sm" title="Delete Chat" onClick={() => deleteUserChat(currentSelectedChat.current?._id)}>
                <MdDeleteOutline size={20} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 2. Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pt-32 pb-32 flex flex-col w-full">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center"><Loading /></div>
        ) : !messages?.length ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <div className="text-6xl mb-4">👋</div>
            <p>Say hello!</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageCont key={msg._id} isOwnMessage={msg.sender?._id === user?._id} message={msg} />
          ))
        )}
        <div ref={scrollToBottomRef} />
      </div>

      {/* 3. Floating Composer */}
      <div className="absolute bottom-6 w-full px-4 md:px-6 z-20 flex justify-center">
        {/* Preview Attachments */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl shadow-lg animate-slide-up w-fit">
            {attachments.map((file, i) => (
              <div key={i} className="relative group">
                {file.type.startsWith('image') ? (
                  <img src={URL.createObjectURL(file)} className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center"><FaFile /></div>
                )}
                <button onClick={() => removeFileFromAttachments(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><RxCross2 size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 p-2 bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl rounded-full transition-all focus-within:ring-2 focus-within:ring-primary/50 w-full max-w-4xl">
          <label htmlFor="img-upload" className="p-3 text-slate-500 hover:text-primary cursor-pointer transition-colors"><FiImage size={24} /></label>
          <input type="file" id="img-upload" className="hidden" accept="image/*" multiple onChange={e => setAttachments([...e.target.files])} />

          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder:text-slate-400 font-medium px-2"
            placeholder="Type a message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
          />

          <button
            onClick={sendChatMessage}
            disabled={!message && !attachments.length}
            className="p-3 bg-primary hover:bg-primary_hover disabled:bg-slate-400 text-white rounded-full shadow-lg transition-transform active:scale-90"
          >
            <IoMdSend size={20} className="pl-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

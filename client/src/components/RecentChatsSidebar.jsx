import React, { useEffect, useState } from "react";
import { BiSearch } from "../assets";
import { LocalStorage } from "../utils";
import { useChat } from "../context/ChatContext";
import RecentUserChatCard from "./RecentUserChatCard";
import Loading from "./Loading";
import { useAuth } from "../context/AuthContext";

export default function RecentChatsSidebar() {
  const {
    currentUserChats,
    loadingChats,
    getCurrentUserChats,
    setMessages,
    getMessages,
    currentSelectedChat,
    setIsChatSelected,
  } = useChat();
  const { user } = useAuth();

  const [filteredRecentUserChats, setFilteredRecentUserChats] = useState(null);

  const getFilteredRecentChats = (e) => {
    const { value } = e.target;
    // Simple regex filter
    const usernameRegex = new RegExp(value, "i");

    if (value.trim() === "") {
      setFilteredRecentUserChats(currentUserChats);
    } else {
      setFilteredRecentUserChats(
        currentUserChats.filter((chat) => {
          if (chat?.isGroupChat) {
            return usernameRegex.test(chat.name);
          } else {
            return chat.participants.some((participant) => {
              if (participant._id === user._id) return false;
              return usernameRegex.test(participant.username);
            });
          }
        })
      );
    }
  };

  useEffect(() => {
    setFilteredRecentUserChats(currentUserChats);
  }, [currentUserChats]);

  useEffect(() => {
    getCurrentUserChats();
  }, []);

  return (
    <div className="flex flex-col h-full w-full p-6 pb-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-1">
            Messages
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {currentUserChats?.length || 0} CONVERSATIONS
          </p>
        </div>
        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
          {/* Edit Icon could go here */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
      </div>

      <div className="relative mb-6 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
          <BiSearch size={20} />
        </div>
        <input
          type="text"
          onChange={getFilteredRecentChats}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium shadow-sm"
          placeholder="Search conversations..."
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
        {loadingChats ? (
          <div className="flex justify-center items-center h-40">
            <Loading />
          </div>
        ) : !currentUserChats?.length ? (
          <div className="flex flex-col justify-center items-center h-64 text-center opacity-60">
            <div className="text-4xl mb-4 grayscale opacity-50">👋</div>
            <h1 className="text-lg font-medium text-slate-600 dark:text-slate-300">
              No chats yet
            </h1>
            <p className="text-sm text-slate-400 mt-2">Start a new conversation!</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredRecentUserChats?.map((chat) => (
              <div
                key={chat._id}
                onClick={() => {
                  if (
                    currentSelectedChat.current?._id &&
                    currentSelectedChat.current?._id === chat?._id
                  )
                    return;
                  LocalStorage.set("currentSelectedChat", chat);
                  currentSelectedChat.current = chat;
                  setIsChatSelected(true);
                  setMessages([]);
                  getMessages(currentSelectedChat.current?._id);
                }}
                className={`cursor-pointer transform transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]`}
              >
                {/* 
                    We are reusing RecentUserChatCard but we might need to wrap it to apply styles 
                    without modifying the card itself heavily. 
                    Actually, RecentUserChatCard likely has its own styles. 
                 */}
                <RecentUserChatCard
                  chat={chat}
                  isActive={currentSelectedChat.current?._id === chat._id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

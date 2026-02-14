import React, { useRef, useState } from "react";
import { BiSearch } from "../assets";
import Avatar from "react-avatar";
import { getAvailableUsers } from "../api";
import { useChat } from "../context/ChatContext";

const SearchedUsersResultCard = ({ user }) => {
  const { setOpenAddChat, setNewChatUser } = useChat();

  const handleCreateChatClick = () => {
    setNewChatUser(user);
    setOpenAddChat(true);
  };

  return (
    <div className="flex justify-between p-3 my-2 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 items-center w-full transition-all hover:bg-white/80 dark:hover:bg-white/10">
      <div className="flex gap-3 items-center min-w-0">
        <Avatar
          className="rounded-full object-cover shadow-sm"
          name={user.username}
          src={user.avatarUrl}
          size="40"
          round={true}
        />
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
            {user.username}
          </h3>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
        </div>
      </div>
      <button
        onClick={handleCreateChatClick}
        className="shrink-0 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors shadow-sm"
      >
        Message
      </button>
    </div>
  );
};

export default function SearchUserSidebar() {
  const searchInputRef = useRef();
  const { searchedUsers, setSearchedUsers } = useChat();
  const [loading, setLoading] = useState(false);

  const searchUsers = async () => {
    if (!searchInputRef.current.value.trim()) return;
    setLoading(true);
    try {
      const { data } = await getAvailableUsers(searchInputRef.current.value);
      setSearchedUsers(data.data?.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      searchUsers();
    }
    if (!searchInputRef.current.value.trim()) {
      setSearchedUsers(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-6 pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-1">
          Search
        </h1>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          FIND FRIENDS
        </p>
      </div>

      <div className="relative group mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
          <BiSearch size={20} />
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-md border border-slate-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium shadow-sm"
          placeholder="Search by username or email..."
          ref={searchInputRef}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
        {!searchedUsers ? (
          <div className="flex flex-col items-center justify-center h-48 opacity-50">
            {/* Using standard div for icon placeholder if BiSearch is generic */}
            <BiSearch size={48} className="mb-2 text-slate-300" />
            <p className="text-sm text-center text-slate-500">
              Search for users to start chatting
            </p>
          </div>
        ) : loading ? (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !searchedUsers.length ? (
          <p className="text-center text-slate-400 mt-4">No users found.</p>
        ) : (
          <div className="space-y-2 pb-4">
            {searchedUsers.map((user) => (
              <SearchedUsersResultCard key={user._id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { RiArrowDropDownLine, RiArrowDropUpLine } from "react-icons/ri";
import Avatar from "react-avatar";
import { useAuth } from "../context/AuthContext";

export default function ProfileSidebar() {
  const { user, logout } = useAuth();
  const [isColapsed, setIsColapsed] = useState(false);

  const colapseFieldValues = [
    { title: "Name", value: user.username },
    { title: "Email", value: user.email },
  ];

  return (
    <div className="flex flex-col h-full w-full p-6 pb-0 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
          My Profile
        </h1>
        <button
          onClick={logout}
          className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <Avatar
            className="relative rounded-full object-cover border-4 border-white dark:border-slate-900"
            name={user.username}
            src={user.avatarUrl}
            size="120"
            round={true}
          />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
            {user.username}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed mx-auto">
            {user.bio || "No bio available"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="w-full">
          <button
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all text-slate-700 dark:text-slate-200 font-medium"
            onClick={() => setIsColapsed(!isColapsed)}
          >
            <span>Personal Info</span>
            {isColapsed ? <RiArrowDropUpLine size={24} /> : <RiArrowDropDownLine size={24} />}
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isColapsed ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
              }`}
          >
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-4">
              {colapseFieldValues.map(({ title, value }, index) => (
                <div key={index}>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

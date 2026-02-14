import React, { useState, useContext } from "react";
import { LuUser, PiChats, RiUserSearchLine, logo } from "../assets";
import {
    MessagesSquare,
    Video,
    Bot,
    Search,
    FileText,
    LogOut,
    Moon,
    Sun,
    User
} from "lucide-react";


import { useAuth } from "../context/AuthContext";
import OutsideClickHandler from "react-outside-click-handler";
import Avatar from "react-avatar";
import ThemeContext from "../context/ThemeContext";

import RecentChatsSidebar from "./RecentChatsSidebar";
import MeetingSidebar from "./MeetingSidebar";
import SearchUserSidebar from "./SearchUserSidebar";
import ProfileSidebar from "./ProfileSidebar";

// --- Components ---

const NavItem = ({ Icon, name, active, onClick, tooltip }) => (
    <div className="relative group flex justify-center py-3 w-full">
        <button
            onClick={() => onClick(name)}
            className={`relative p-3 rounded-xl transition-all duration-300  ${active
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white"
                }`}
        >
            <Icon className="text-2xl" />
        </button>

        {/* Active Indicator Bar */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
        )}

        {/* Tooltip */}
        <div className="absolute left-14 ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[60] whitespace-nowrap shadow-xl translate-x-2 group-hover:translate-x-0">
            {tooltip}
        </div>
    </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-white/10 overflow-hidden animate-scale-up">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogOut size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-colors"
                        >
                            Confirm Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function UnifiedSidebar({ activeLeftSidebar, setActiveLeftSidebar, onSelectMeeting, selectedMeetingId }) {
    const { user, logout } = useAuth();
    const { currentTheme, changeCurrentTheme } = useContext(ThemeContext);

    const isDark = currentTheme === 'dark';

    // Fallback theme toggle if Context isn't fully exposed like this
    const handleThemeToggle = () => {
        changeCurrentTheme(isDark ? 'light' : 'dark');
    };

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const navItems = [
        { Icon: MessagesSquare, name: "recentChats", label: "Chats" },
        { Icon: Video, name: "meeting", label: "Meetings" },
        { Icon: Bot, name: "aiChat", label: "AI Assistant" },
        { Icon: Search, name: "searchUser", label: "Search" },
        { Icon: FileText, name: "audioPdf", label: "Audio to PDF" },
    ];


    const handleLogoutConfirm = () => {
        logout();
        setShowLogoutModal(false);
    };

    return (
        <>
            <ConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogoutConfirm}
                title="Log out?"
                message="Are you sure you want to log out of your account?"
            />

            <div className="h-full flex flex-row overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-3xl shadow-2xl relative z-20">

                {/* --- 1. Navigation Rail --- */}
                <div className="w-20 md:w-20 flex flex-col items-center py-6 border-r border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl z-30">
                    {/* Logo */}
                    <div className="mb-6 p-2 rounded-2xl bg-gradient-to-tr from-primary to-purple-500 shadow-xl shadow-primary/20 cursor-pointer transform hover:scale-105 transition-transform" onClick={() => setActiveLeftSidebar('recentChats')}>
                        <img src={logo} alt="Logo" className="w-6 h-6 invert brightness-0" />
                    </div>

                    {/* Nav Items */}
                    <div className="flex-1 flex flex-col gap-3 w-full items-center overflow-visible py-2 z-50">
                        {navItems.map((item) => (
                            <NavItem
                                key={item.name}
                                Icon={item.Icon}
                                name={item.name}
                                active={activeLeftSidebar === item.name}
                                onClick={setActiveLeftSidebar}
                                tooltip={item.label}
                            />
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-10 h-px bg-slate-200 dark:bg-white/10 my-4" />

                    {/* Bottom Actions */}
                    <div className="flex flex-col gap-4 items-center w-full pb-2">
                        {/* Profile Dropdown Trigger */}
                        <div className="relative">
                            <OutsideClickHandler onOutsideClick={() => setShowProfileMenu(false)}>
                                <div
                                    className="cursor-pointer relative group"
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                >
                                    <Avatar
                                        name={user.username}
                                        src={user.avatarUrl}
                                        size="42"
                                        round={true}
                                        className={`border-2 transition-all ${showProfileMenu ? 'border-primary shadow-glow' : 'border-white/20 dark:border-slate-700'}`}
                                    />
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />

                                    {/* Profile Dropdown Menu */}
                                    {showProfileMenu && (
                                        <div className="absolute bottom-full left-14 mb-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-white/10 dark:border-slate-700 overflow-hidden transform origin-bottom-left animate-scale-up z-[100]">
                                            <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-white/5">
                                                <p className="font-bold text-slate-800 dark:text-white truncate">{user.username}</p>
                                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                            </div>
                                            <div className="p-2 flex flex-col gap-1">
                                                <button
                                                    onClick={() => { setActiveLeftSidebar('profile'); setShowProfileMenu(false); }}
                                                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-left"
                                                >
                                                    <User size={16} /> View Profile
                                                </button>
                                                <button
                                                    onClick={() => { handleThemeToggle(); }}
                                                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-left justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isDark ? <Moon size={16} /> : <Sun size={16} />}
                                                        <span>Theme</span>
                                                    </div>
                                                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase font-bold">{isDark ? 'Dark' : 'Light'}</span>
                                                </button>
                                                <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                                                <button
                                                    onClick={() => setShowLogoutModal(true)}
                                                    className="flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left font-medium"
                                                >
                                                    <LogOut size={16} /> Log Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </OutsideClickHandler>
                        </div>
                    </div>
                </div>

                {/* --- 2. List Area (Sidebar Content) --- */}
                <div className="flex-1 min-w-[200px] flex flex-col relative overflow-hidden bg-white/30 dark:bg-slate-900/30">
                    {activeLeftSidebar === "recentChats" && <RecentChatsSidebar />}
                    {activeLeftSidebar === "meeting" && (
                        <MeetingSidebar
                            onSelectMeeting={onSelectMeeting}
                            selectedMeetingId={selectedMeetingId}
                        />
                    )}
                    {activeLeftSidebar === "searchUser" && <SearchUserSidebar />}
                    {activeLeftSidebar === "profile" && <ProfileSidebar />}

                    {["aiChat", "audioPdf"].includes(activeLeftSidebar) && (
                        <div className="p-6 h-full flex flex-col items-center justify-center text-center opacity-40">
                            <div className="w-16 h-16 bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-white/10 dark:to-white/5 rounded-2xl mb-4 flex items-center justify-center">
                                {activeLeftSidebar === 'aiChat' ? <Bot size={32} /> : <FileText size={28} />}
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize mb-1">
                                {activeLeftSidebar === 'aiChat' ? 'AI Assistant' : 'Audio to PDF'}
                            </h2>
                            <p className="text-sm">Select a context to begin</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

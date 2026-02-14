import moment from "moment";
import Avatar from "react-avatar";
import { useAuth } from "../context/AuthContext";
import { getChatObjectMetadata, limitChar } from "../utils";

export default function RecentUserChatCard({ chat, isActive }) {
  const { user } = useAuth();
  const filteredChat = getChatObjectMetadata(chat, user);

  return (
    <div
      className={`flex gap-3 p-3 rounded-xl items-center w-full transition-all duration-200 border border-transparent
        ${isActive
          ? "bg-white/20 dark:bg-white/10 border-white/10 shadow-lg backdrop-blur-md"
          : "hover:bg-white/10 dark:hover:bg-white/5 hover:backdrop-blur-sm hover:translate-x-1"
        }
      `}
    >
      <div className="flex-shrink-0">
        {chat.isGroupChat ? (
          <div className="w-12 h-12 relative flex-shrink-0">
            {chat.participants.slice(0, 3).map((participant, i) => (
              <Avatar
                key={participant._id}
                name={participant.username}
                src={participant.avatarUrl}
                size="32"
                round={true}
                className={`absolute border-2 border-slate-50 dark:border-slate-900 shadow-md ${i === 0 ? "left-0 top-0 z-30" : i === 1 ? "left-3 top-0 z-20" : "left-1.5 top-3 z-10"
                  }`}
              />
            ))}
          </div>
        ) : (
          <div className="relative">
            <Avatar
              className="rounded-full object-cover shadow-md"
              name={filteredChat.title}
              src={filteredChat.avatar}
              size="48"
              round={true}
            />
            {/* Online Indicator (Mocked for now, or use real data if available) */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={`font-semibold text-sm truncate ${isActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"}`}>
            {filteredChat.title}
          </h3>
          <span className={`text-[10px] font-medium ${isActive ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}`}>
            {chat.lastMessage
              ? moment(chat.lastMessage?.createdAt)
                .fromNow(true)
              : ""}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <p className={`text-xs truncate max-w-[140px] ${isActive ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
            {limitChar(filteredChat.lastMessage, 30)}
          </p>
          {/* Unread Badge (Mocked) */}
          {/* <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-glow"></div> */}
        </div>
      </div>
    </div>
  );
}

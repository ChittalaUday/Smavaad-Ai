import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
} from "react";
import { toast } from "react-toastify";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { useMeetingEngine } from "../hooks/useMeetingEngine";

const MeetingContext = createContext(null);

export const useMeeting = () => useContext(MeetingContext);

const ICE_SERVERS = {
    iceServers: [
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
            ],
        },
    ],
};

export const MeetingProvider = ({ children }) => {
    const meetingEngine = useMeetingEngine();

    return (
        <MeetingContext.Provider value={meetingEngine}>
            {children}
        </MeetingContext.Provider>
    );
};

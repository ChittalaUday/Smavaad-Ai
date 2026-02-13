import React, { createContext, useContext } from "react";
import { useMeetingEngine } from "../hooks/useMeetingEngine";

const MeetingContext = createContext(null);

export const useMeeting = () => useContext(MeetingContext);


export const MeetingProvider = ({ children }) => {
    const meetingEngine = useMeetingEngine();

    return (
        <MeetingContext.Provider value={meetingEngine}>
            {children}
        </MeetingContext.Provider>
    );
};

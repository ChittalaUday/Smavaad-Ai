import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMeeting } from "../api";
import { FaVideo } from "react-icons/fa";

export default function MeetingSidebar() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateMeeting = async () => {
        try {
            setLoading(true);
            const response = await createMeeting();
            const { meetingId } = response.data.data;
            navigate(`/meeting/${meetingId}`);
        } catch (error) {
            console.error("Error creating meeting", error);
            alert("Failed to create meeting");
        } finally {
            setLoading(false);
        }
    };

    const joinMeeting = (e) => {
        e.preventDefault();
        if (!meetingCode.trim()) return;
        navigate(`/meeting/${meetingCode}`);
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-backgroundLight1 dark:bg-backgroundDark3 p-4">
            <div className="bg-white dark:bg-backgroundDark2 rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center gap-6">
                <div className="text-primary text-5xl">
                    <FaVideo />
                </div>
                <h1 className="text-2xl font-bold dark:text-white">Video Meetings</h1>
                <p className="text-center text-slate-500 dark:text-slate-400">
                    Create a new meeting or join an existing one.
                </p>

                <div className="w-full space-y-4">
                    <button
                        onClick={handleCreateMeeting}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors bg-primary hover:bg-primary/90 disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "New Meeting"}
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-backgroundDark2 text-slate-500">Or join with code</span>
                        </div>
                    </div>

                    <form onSubmit={joinMeeting} className="flex gap-2">
                        <input
                            type="text"
                            required
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter code"
                            value={meetingCode}
                            onChange={(e) => setMeetingCode(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!meetingCode.trim()}
                            className="px-4 py-2 rounded-lg text-white font-medium bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Join
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

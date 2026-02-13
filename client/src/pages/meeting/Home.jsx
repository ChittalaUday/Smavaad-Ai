import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createMeeting } from "../../api";
import { toast } from "react-toastify";

const MeetingHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
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
            toast.error("Failed to create meeting");
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold">Video Calls</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Premium video meetings for everyone.
                    </p>
                </div>

                <div className="mt-8 space-y-4">
                    <button
                        onClick={handleCreateMeeting}
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "New Meeting"}
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-900 text-gray-400">Or join with code</span>
                        </div>
                    </div>

                    <form onSubmit={joinMeeting} className="mt-4 flex gap-2">
                        <input
                            type="text"
                            required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Enter meeting code"
                            value={meetingCode}
                            onChange={(e) => setMeetingCode(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Join
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MeetingHome;

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import AIChat from "./pages/AIChat";
import MeetingHome from "./pages/meeting/Home";
import MeetingRoom from "./pages/meeting/Room";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { SocketProvider } from "./context/SocketContext";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import WebRtcContextProvider from "./context/WebRtcContext";
import { MeetingProvider, useMeeting } from "./context/MeetingContext";
import IncomingCallNotification from "./components/meeting/IncomingCallNotification";
import CallOverlay from "./components/meeting/CallOverlay";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Renders the active call as a full-screen overlay on top of the chat.
 * Only shown when activeMeeting is set AND user is NOT already on a /meeting page
 * (MeetingRoom renders its own full UI).
 */
const CallLayer = () => {
  const { activeMeeting } = useMeeting();
  const location = useLocation();
  const isOnMeetingPage = location.pathname.startsWith("/meeting");
  if (!activeMeeting || isOnMeetingPage) return null;
  return <CallOverlay />;
};

/**
 * All authenticated routes share providers so state persists.
 * The chat is always the home screen; calls render as overlays.
 */
const AuthenticatedApp = () => {
  return (
    <SocketProvider>
      <ChatProvider>
        <MeetingProvider>
          <IncomingCallNotification />
          <CallLayer />
          <Routes>
            <Route
              path="/chat"
              element={
                <WebRtcContextProvider>
                  <Chat />
                </WebRtcContextProvider>
              }
            />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/meeting" element={<MeetingHome />} />
            <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
          </Routes>
        </MeetingProvider>
      </ChatProvider>
    </SocketProvider>
  );
};

function App() {
  const { token, user } = useAuth();

  return (
    <div className="App">
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route
          path="/"
          element={
            token && user?._id ? (
              <Navigate to="/chat" />
            ) : (
              <Navigate to="/login" />
            )
          }
        ></Route>

        <Route
          exact
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          exact
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* All authenticated routes share providers */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <AuthenticatedApp />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;

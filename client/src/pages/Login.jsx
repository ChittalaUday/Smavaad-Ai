import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { logo } from "../assets";
import {
  Moon,
  Sun,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  Github,
  CheckCircle,
  Sparkles,
  Video
} from "lucide-react";

// Google Icon SVG component since it's not in Lucide
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function Login() {
  const userIdRef = useRef();
  const passwordRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [localError, setLocalError] = useState(null);
  const { login, authError } = useAuth();
  const { showToast } = useToast();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!userIdRef.current.value || !passwordRef.current.value) {
      setLocalError("Please fill in all required fields");
      setTimeout(() => setLocalError(null), 5000);
      return;
    }

    setIsLoading(true);
    const user = {
      userId: userIdRef.current.value,
      password: passwordRef.current.value,
    };
    try {
      await login(user);
      showToast("Login successful!", "success");
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen flex flex-row items-center justify-center p-4 lg:p-8 bg-[#F3F4F6] dark:bg-[#0F172A] transition-colors duration-300 font-sans">

      {/* Floating Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg text-slate-600 dark:text-slate-300 hover:text-primary transition-all z-50"
      >
        <span className="sr-only">Toggle theme</span>
        <div className="dark:hidden"><Moon size={22} /></div>
        <div className="hidden dark:block"><Sun size={22} /></div>
      </button>

      <div className="max-w-[1200px] w-full bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-row min-h-[700px]">

        {/* Left Side - Brand & Design */}
        <div className="w-full md:w-1/2 bg-[#F6F1FF] dark:bg-[#1E1B2E] p-12 md:p-16 relative overflow-hidden flex flex-col justify-between">
          {/* Background Gradient Orbs */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-300/20 dark:bg-purple-900/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-300/20 dark:bg-blue-900/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <img src={logo} alt="Logo" className="w-6 h-6 object-contain invert brightness-0 filter" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">SAMVAAD AI</span>
          </div>

          {/* New Hero Text */}
          <div className="relative z-10 mb-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] mb-6 text-slate-900 dark:text-white">
              Elevate your <br />
              <span className="text-primary">Conversations</span> with Intelligence.
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-md">
              The Chatting and meeting platform for real-time chat, AI assistance, and seamless virtual meetings.
            </p>
          </div>

          {/* Mock Chat Design Elements */}
          <div className="relative z-10 mt-12 w-full max-w-sm">
            {/* Floating Icon - Video */}
            <div className="absolute -top-12 -right-4 w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center text-primary rotate-12 animate-bounce hover:rotate-0 transition-transform cursor-pointer">
              <Video size={24} fill="currentColor" className="text-primary" />
            </div>

            {/* Main Chat Card */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 p-4 rounded-2xl shadow-xl transform transition-transform hover:-translate-y-1 duration-300">
              <div className="flex gap-4 items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                  S
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>

                {/* Purple highlight bar */}
                <div className="h-3 mt-4 bg-gradient-to-r from-primary/30 to-purple-400/30 rounded-full w-5/6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Floating Icon - Sparkles */}
            <div className="absolute -bottom-6 -left-6 w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center text-amber-400 rotate-[-12deg] hover:rotate-0 transition-transform">
              <Sparkles size={28} fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-12 md:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Log in to your account to continue</p>



            <div className="relative mb-8 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <span className="relative bg-white dark:bg-slate-900 px-4 text-sm text-slate-400">Login with email</span>
            </div>

            {/* Error Display */}
            {(authError || localError) && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle size={20} />
                <span className="text-sm font-medium">{localError || authError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-200" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="text-lg">@</span>
                  </div>
                  <input
                    ref={userIdRef}
                    id="email"
                    type="text"
                    placeholder="name@mail.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-200" htmlFor="password">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:text-purple-700 dark:hover:text-purple-400">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-10 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>



              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-lg shadow-purple-500/30 transition-all transform duration-200 
                  ${isLoading
                    ? "bg-primary/70 cursor-not-allowed"
                    : "bg-primary hover:bg-violet-700 hover:-translate-y-0.5"
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <span className="material-icons-outlined text-sm transform transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Create an account
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

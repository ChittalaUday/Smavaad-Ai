/** @type {import('tailwindcss').Config} */
import { fontFamily } from "tailwindcss/defaultTheme";
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8B5CF6", // Violet-500
          foreground: "#FFFFFF",
          hover: "#7C3AED", // Violet-600
        },
        secondary: {
          DEFAULT: "#10B981", // Emerald-500
          foreground: "#FFFFFF",
        },
        background: {
          DEFAULT: "#0F172A", // Slate-900
          light: "#F8FAFC", // Slate-50
        },
        surface: {
          light: "#ffffff",
          dark: "#1E293B", // Slate-800
        },
        glass: {
          light: "rgba(255, 255, 255, 0.7)",
          dark: "rgba(15, 23, 42, 0.6)",
          stroke: "rgba(255, 255, 255, 0.1)",
        },
        muted: {
          DEFAULT: "#64748B", // Slate-500
          foreground: "#94A3B8", // Slate-400
        },
        backgroundLight1: "#ffffff", // Keep for backward compatibility if needed
        backgroundLight2: "#f5f7fb",
        backgroundLight3: "#e6ebf5",
        backgroundDark1: "#36404a",
        backgroundDark2: "#303841",
        backgroundDark3: "#262e35",
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", ...fontFamily.sans],
        sans: ["Plus Jakarta Sans", "sans-serif"],
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
      screens: {
        xs: "480px",
        // 'sm': '640px', // Default
        // 'md': '768px', // Default
        // 'lg': '1024px', // Default
        // 'xl': '1280px', // Default
        // '2xl': '1536px', // Default
        mobile: { max: "768px" }, // Custom for mobile-first overrides if needed
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

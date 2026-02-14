/** @type {import('tailwindcss').Config} */
import { fontFamily } from "tailwindcss/defaultTheme";
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED", // Updated to Violet from new design
        primary_hover: "#6D28D9",
        secondary: "#009A6E",
        "background-light": "#F8FAFC",
        "background-dark": "#0F172A",
        backgroundLight1: "#ffffff", // 50
        backgroundLight2: "#f5f7fb", // 100
        backgroundLight3: "#e6ebf5",

        text_light_primary: "#F2F3F4",
        text_light_secondary: "#F2F3F4",
        text_dark_primary: "#111111",
        text_dark_secondary: "#48494a ",
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
        sm: { max: "640px" },
        md: { max: "768px" },
        lg: { max: "1024px" },
        xl: { max: "1280px" },
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

import type { Config } from "tailwindcss";

export default {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1280px",
      xl: "1920px",
      "2xl": "2560px",
    },
    extend: {
      colors: {
        background: "#070913",
        foreground: "#f8fafc",
        cyan: { DEFAULT: "#00f0ff", glow: "rgba(0, 240, 255, 0.4)" },
        purple: { DEFAULT: "#a855f7", glow: "rgba(168, 85, 247, 0.4)" },
        surface: { 0: "#030712", 1: "#0b0f1d", 2: "#111827", 3: "#1e293b" },
        edge: { DEFAULT: "#1e293b", strong: "#334155" },
      },
      borderRadius: { xs: "4px", sm: "6px", md: "10px", lg: "14px", xl: "20px", "2xl": "28px" },
      spacing: {
        "hud-xs": "0.25rem",
        "hud-sm": "0.5rem",
        "hud-md": "0.75rem",
        "hud-lg": "1rem",
        "hud-xl": "1.5rem",
      },
      fontFamily: {
        orbitron: ["var(--font-orbitron)", "monospace"],
        rajdhani: ["var(--font-rajdhani)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        pulseGlow: "pulseGlow 2s infinite alternate",
        hudFade: "hudFade 180ms ease-out",
        gatePlace: "gatePlace 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        playheadSlide: "playheadSlide 140ms ease-out",
        microPulse: "microPulse 900ms ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%": { boxShadow: "0 0 8px rgba(0, 240, 255, 0.2)" },
          "100%": { boxShadow: "0 0 25px rgba(0, 240, 255, 0.6)" },
        },
        hudFade: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        gatePlace: {
          "0%": { transform: "scale(0.7)", opacity: "0.4" },
          "60%": { transform: "scale(1.12)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        playheadSlide: {
          "0%": { transform: "translateX(-4px)", opacity: "0.6" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        microPulse: {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

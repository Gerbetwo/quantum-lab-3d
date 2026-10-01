import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070913",
        foreground: "#f8fafc",
        cyan: {
          DEFAULT: "#00f0ff",
          glow: "rgba(0, 240, 255, 0.4)",
        },
        purple: {
          DEFAULT: "#a855f7",
          glow: "rgba(168, 85, 247, 0.4)",
        },
      },
      fontFamily: {
        orbitron: ["var(--font-orbitron)", "monospace"],
        rajdhani: ["var(--font-rajdhani)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        pulseGlow: "pulseGlow 2s infinite alternate",
      },
      keyframes: {
        pulseGlow: {
          "0%": { boxShadow: "0 0 8px rgba(0, 240, 255, 0.2)" },
          "100%": { boxShadow: "0 0 25px rgba(0, 240, 255, 0.6)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      // Defaults preserved; explicit so missions can target them by name.
      sm: "640px",
      md: "768px",   // Fase 8 audit: tablet
      lg: "1280px",  // Fase 8 audit: laptop / HUD collapse
      xl: "1920px",  // Fase 8 audit: desktop
      "2xl": "2560px",
    },
    extend: {
      colors: {
        background: "#070913",
        foreground: "#f8fafc",
        cyan: { DEFAULT: "#00f0ff", glow: "rgba(0, 240, 255, 0.4)" },
        purple: { DEFAULT: "#a855f7", glow: "rgba(168, 85, 247, 0.4)" },
        // Design system tokens (new in v0.3.0)
        surface: {
          0: "#030712",
          1: "#0b0f1d",
          2: "#111827",
          3: "#1e293b",
        },
        edge: {
          DEFAULT: "#1e293b",
          strong: "#334155",
        },
      },
      borderRadius: { xs: "4px", sm: "6px", md: "10px", lg: "14px", xl: "20px", "2xl": "28px" },
      spacing: {
        // HUD scale
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
      },
      keyframes: {
        pulseGlow: {
          "0%": { boxShadow: "0 0 8px rgba(0, 240, 255, 0.2)" },
          "100%": { boxShadow: "0 0 25px rgba(0, 240, 255, 0.6)" },
        },
        hudFade: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
    },
  },
  plugins: [],
} satisfies Config;

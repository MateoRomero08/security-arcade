import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary)",
          "primary-hover": "var(--brand-primary-hover)",
          "primary-muted": "var(--brand-primary-muted)",
          secondary: "var(--brand-secondary)",
          accent: "var(--brand-accent)",
          warning: "var(--brand-warning)",
          bg: "var(--brand-bg)",
          "bg-light": "var(--brand-bg-light)",
          surface: "var(--brand-surface)",
          "surface-elevated": "var(--brand-surface-elevated)",
          border: "var(--brand-border)",
          text: "var(--brand-text)",
          muted: "var(--brand-text-muted)",
          success: "var(--brand-success)",
          danger: "var(--brand-danger)",
        },
      },
      borderRadius: {
        "brand-sm": "var(--brand-radius-sm)",
        "brand-md": "var(--brand-radius-md)",
        "brand-lg": "var(--brand-radius-lg)",
        "brand-xl": "var(--brand-radius-xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        arcade: ['"Press Start 2P"', "monospace"],
        pixel: ["Silkscreen", "monospace"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2s infinite",
        "float-slow": "floatSlow 3.5s ease-in-out infinite",
        "scanline": "scanline 8s linear infinite",
        "fade-slide-up": "fadeSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(67, 229, 104, 0.55)" },
          "50%": { boxShadow: "0 0 0 12px rgba(67, 229, 104, 0)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        fadeSlideUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;


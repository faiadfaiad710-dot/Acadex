import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--color-base)",
        card: "var(--color-card)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        glass: "rgba(255,255,255,0.08)",
        "glass-border": "rgba(255,255,255,0.15)",
        text: "var(--color-text)",
        subtle: "var(--color-subtle)",
        accent: "var(--color-accent)",
        accentSoft: "var(--color-accent-soft)",
        success: "var(--color-success)",
        danger: "var(--color-danger)"
      },
      boxShadow: {
        card: "0 20px 60px rgba(15, 23, 42, 0.12)"
      },
      fontFamily: {
        heading: ["var(--font-brand)", "var(--font-bangla)", "sans-serif"],
        body: ["var(--font-brand)", "var(--font-bangla)", "sans-serif"],
        bangla: ["var(--font-brand)", "var(--font-bangla)", "sans-serif"]
      },
      backgroundImage: {
        "soft-grid":
          "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--color-border) 60%, transparent) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;

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
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
        bangla: ["var(--font-bangla)"]
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

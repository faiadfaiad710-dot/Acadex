import { ThemeName } from "@/lib/types";

export const DEFAULT_SUBJECTS = [
  { name: "Computer Application in Pharmacy", code: "Pharm-2111" },
  { name: "Physiology and Anatomy -2", code: "Pharm-2109" },
  { name: "Pharmacognosy -2", code: "Pharm-2107" },
  { name: "Basic Pharmaceutics -1", code: "Pharm-2105" },
  { name: "Pharmaceutical Technology -1", code: "Pharm-2101" },
  { name: "Pharmacology -1", code: "Pharm-2103" },
  { name: "Other", code: "OTHER" }
] as const;

export const THEMES: Record<
  ThemeName,
  {
    label: string;
    colors: Record<string, string>;
  }
> = {
  aurora: {
    label: "Aurora",
    colors: {
      "--color-base": "#f7f4ed",
      "--color-card": "#fffdf8",
      "--color-muted": "#efe8dd",
      "--color-border": "#dccfbd",
      "--color-text": "#2e2a24",
      "--color-subtle": "#6b6258",
      "--color-accent": "#c46334",
      "--color-accent-soft": "#f2d5c7",
      "--color-success": "#2f855a",
      "--color-danger": "#b42318"
    }
  },
  scholar: {
    label: "Scholar Blue",
    colors: {
      "--color-base": "#eef3ff",
      "--color-card": "#ffffff",
      "--color-muted": "#dfe7fb",
      "--color-border": "#c2d1f5",
      "--color-text": "#0f1b3d",
      "--color-subtle": "#516089",
      "--color-accent": "#315efb",
      "--color-accent-soft": "#d8e2ff",
      "--color-success": "#0f9d7a",
      "--color-danger": "#d14343"
    }
  },
  sunrise: {
    label: "Sunrise Gold",
    colors: {
      "--color-base": "#fff7e8",
      "--color-card": "#fffdf7",
      "--color-muted": "#ffe5b8",
      "--color-border": "#f4cf88",
      "--color-text": "#473117",
      "--color-subtle": "#7e5d30",
      "--color-accent": "#dd7a00",
      "--color-accent-soft": "#ffe6bf",
      "--color-success": "#2c8b54",
      "--color-danger": "#c2410c"
    }
  },
  emerald: {
    label: "Emerald Garden",
    colors: {
      "--color-base": "#eefaf4",
      "--color-card": "#fbfffd",
      "--color-muted": "#d8efe3",
      "--color-border": "#b8dccb",
      "--color-text": "#173a2e",
      "--color-subtle": "#4d7567",
      "--color-accent": "#1c8b5f",
      "--color-accent-soft": "#d0f0e2",
      "--color-success": "#107a4f",
      "--color-danger": "#b83232"
    }
  },
  midnight: {
    label: "Midnight Slate",
    colors: {
      "--color-base": "#101723",
      "--color-card": "#162131",
      "--color-muted": "#213148",
      "--color-border": "#324760",
      "--color-text": "#edf4ff",
      "--color-subtle": "#adc1dd",
      "--color-accent": "#4ab0ff",
      "--color-accent-soft": "#163755",
      "--color-success": "#4ad8a7",
      "--color-danger": "#ff7b7b"
    }
  },
  liquid: {
    label: "Liquid Glass",
    colors: {
      "--color-base": "#dff3ff",
      "--color-card": "rgba(255,255,255,0.48)",
      "--color-muted": "rgba(255,255,255,0.28)",
      "--color-border": "rgba(255,255,255,0.42)",
      "--color-text": "#0b2440",
      "--color-subtle": "#45627e",
      "--color-accent": "#26a7ff",
      "--color-accent-soft": "rgba(38,167,255,0.18)",
      "--color-success": "#17c6a3",
      "--color-danger": "#ff6f91"
    }
  }
};

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "academic-session";
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

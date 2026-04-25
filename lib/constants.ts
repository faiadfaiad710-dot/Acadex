import { SurfaceMode, ThemeName } from "@/lib/types";

export const DEFAULT_SUBJECTS = [
  { name: "Computer Application in Pharmacy", code: "Pharm-2111" },
  { name: "Physiology and Anatomy -2", code: "Pharm-2109" },
  { name: "Pharmacognosy -2", code: "Pharm-2107" },
  { name: "Basic Pharmaceutics -1", code: "Pharm-2105" },
  { name: "Pharmaceutical Technology -1", code: "Pharm-2101" },
  { name: "Pharmacology -1", code: "Pharm-2103" },
  { name: "Other", code: "OTHER" }
] as const;

export const SURFACE_MODES: Record<
  SurfaceMode,
  {
    label: string;
    colors: Record<string, string>;
  }
> = {
  light: {
    label: "Light",
    colors: {
      "--color-base": "#eef3ff",
      "--color-card": "#ffffff",
      "--color-muted": "#dfe7fb",
      "--color-border": "#c2d1f5",
      "--color-text": "#0f1b3d",
      "--color-subtle": "#516089"
    }
  },
  dark: {
    label: "Dark",
    colors: {
      "--color-base": "#0f1726",
      "--color-card": "#172234",
      "--color-muted": "#213148",
      "--color-border": "#344860",
      "--color-text": "#edf4ff",
      "--color-subtle": "#adc1dd"
    }
  },
  black: {
    label: "Black",
    colors: {
      "--color-base": "#020305",
      "--color-card": "#090c12",
      "--color-muted": "#11161f",
      "--color-border": "#202938",
      "--color-text": "#f4f7fb",
      "--color-subtle": "#93a0b5"
    }
  }
};

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
      "--color-accent": "#c46334",
      "--color-accent-soft": "#f2d5c7",
      "--color-success": "#2f855a",
      "--color-danger": "#b42318"
    }
  },
  scholar: {
    label: "Scholar Blue",
    colors: {
      "--color-accent": "#315efb",
      "--color-accent-soft": "#d8e2ff",
      "--color-success": "#0f9d7a",
      "--color-danger": "#d14343"
    }
  },
  sunrise: {
    label: "Sunrise Gold",
    colors: {
      "--color-accent": "#dd7a00",
      "--color-accent-soft": "#ffe6bf",
      "--color-success": "#2c8b54",
      "--color-danger": "#c2410c"
    }
  },
  emerald: {
    label: "Emerald Garden",
    colors: {
      "--color-accent": "#1c8b5f",
      "--color-accent-soft": "#d0f0e2",
      "--color-success": "#107a4f",
      "--color-danger": "#b83232"
    }
  },
  midnight: {
    label: "Midnight Slate",
    colors: {
      "--color-accent": "#4ab0ff",
      "--color-accent-soft": "#163755",
      "--color-success": "#4ad8a7",
      "--color-danger": "#ff7b7b"
    }
  }
};

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "academic-session";
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

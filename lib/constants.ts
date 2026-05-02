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
  },
  palette01: {
    label: "Palette 01",
    colors: {
      "--color-accent": "#22577A",
      "--color-accent-soft": "#C7F9CC",
      "--color-success": "#57CC99",
      "--color-danger": "#d14343",
      "--palette-a": "#22577A",
      "--palette-b": "#38A3A5",
      "--palette-c": "#57CC99",
      "--palette-d": "#80ED99",
      "--palette-e": "#C7F9CC"
    }
  },
  palette02: {
    label: "Palette 02",
    colors: {
      "--color-accent": "#C9184A",
      "--color-accent-soft": "#FFB3C1",
      "--color-success": "#FF758F",
      "--color-danger": "#800F2F",
      "--palette-a": "#800F2F",
      "--palette-b": "#C9184A",
      "--palette-c": "#FF4D6D",
      "--palette-d": "#FF758F",
      "--palette-e": "#FFB3C1"
    }
  },
  palette03: {
    label: "Palette 03",
    colors: {
      "--color-accent": "#E2711D",
      "--color-accent-soft": "#FFC971",
      "--color-success": "#FFB627",
      "--color-danger": "#CC5803",
      "--palette-a": "#CC5803",
      "--palette-b": "#E2711D",
      "--palette-c": "#FF9505",
      "--palette-d": "#FFB627",
      "--palette-e": "#FFC971"
    }
  },
  palette04: {
    label: "Palette 04",
    colors: {
      "--color-accent": "#967AA1",
      "--color-accent-soft": "#F5E6E8",
      "--color-success": "#AAA1C8",
      "--color-danger": "#8b3154",
      "--palette-a": "#192A51",
      "--palette-b": "#967AA1",
      "--palette-c": "#AAA1C8",
      "--palette-d": "#D5C6E0",
      "--palette-e": "#F5E6E8"
    }
  },
  palette05: {
    label: "Palette 05",
    colors: {
      "--color-accent": "#99582A",
      "--color-accent-soft": "#FFE6A7",
      "--color-success": "#BB9457",
      "--color-danger": "#6F1D1B",
      "--palette-a": "#6F1D1B",
      "--palette-b": "#BB9457",
      "--palette-c": "#432818",
      "--palette-d": "#99582A",
      "--palette-e": "#FFE6A7"
    }
  },
  palette06: {
    label: "Palette 06",
    colors: {
      "--color-accent": "#8E9AAF",
      "--color-accent-soft": "#FEEAFA",
      "--color-success": "#CBC0D3",
      "--color-danger": "#b4235c",
      "--palette-a": "#8E9AAF",
      "--palette-b": "#CBC0D3",
      "--palette-c": "#EFD3D7",
      "--palette-d": "#FEEAFA",
      "--palette-e": "#DEE2FF"
    }
  }
};

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "academic-session";
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

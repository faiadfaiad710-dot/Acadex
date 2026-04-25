"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "@/lib/i18n/en.json";
import bn from "@/lib/i18n/bn.json";
import { Language, SurfaceMode, ThemeName } from "@/lib/types";
import { SURFACE_MODES, THEMES } from "@/lib/constants";

type Dictionary = typeof en;

const AppContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  surfaceMode: SurfaceMode;
  setSurfaceMode: (surfaceMode: SurfaceMode) => void;
  dictionary: Dictionary;
}>({
  language: "en",
  setLanguage: () => undefined,
  theme: "scholar",
  setTheme: () => undefined,
  surfaceMode: "light",
  setSurfaceMode: () => undefined,
  dictionary: en
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<ThemeName>("scholar");
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>("light");

  useEffect(() => {
    const root = document.documentElement;
    const applyPerformanceMode = () => {
      const deviceMemory =
        "deviceMemory" in navigator ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0) : 0;
      const hardwareConcurrency = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : 8;
      const isLiteDevice = window.innerWidth < 1024 || (deviceMemory > 0 && deviceMemory <= 6) || hardwareConcurrency <= 6;
      root.dataset.performance = isLiteDevice ? "lite" : "full";
    };

    applyPerformanceMode();
    window.addEventListener("resize", applyPerformanceMode);
    return () => window.removeEventListener("resize", applyPerformanceMode);
  }, []);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("afm-language") as Language | null;
    const storedTheme = window.localStorage.getItem("afm-theme") as ThemeName | null;
    const storedSurface = window.localStorage.getItem("afm-surface") as SurfaceMode | null;
    if (storedLanguage) setLanguage(storedLanguage);
    if (storedTheme && storedTheme in THEMES) setTheme(storedTheme);
    if (storedSurface && storedSurface in SURFACE_MODES) setSurfaceMode(storedSurface);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("afm-language", language);
    window.localStorage.setItem("afm-theme", theme);
    window.localStorage.setItem("afm-surface", surfaceMode);
    const root = document.documentElement;
    Object.entries(SURFACE_MODES[surfaceMode].colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    Object.entries(THEMES[theme].colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.dataset.theme = theme;
    root.dataset.surface = surfaceMode;
    root.dataset.language = language;
  }, [language, surfaceMode, theme]);

  const dictionary = useMemo(() => (language === "bn" ? bn : en), [language]);

  return (
    <AppContext.Provider value={{ language, setLanguage, theme, setTheme, surfaceMode, setSurfaceMode, dictionary }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(AppContext);
}

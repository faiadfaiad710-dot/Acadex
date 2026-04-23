"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "@/lib/i18n/en.json";
import bn from "@/lib/i18n/bn.json";
import { Language, ThemeName } from "@/lib/types";
import { THEMES } from "@/lib/constants";

type Dictionary = typeof en;

const AppContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  dictionary: Dictionary;
}>({
  language: "en",
  setLanguage: () => undefined,
  theme: "scholar",
  setTheme: () => undefined,
  dictionary: en
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<ThemeName>("scholar");

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("afm-language") as Language | null;
    const storedTheme = window.localStorage.getItem("afm-theme") as ThemeName | null;
    if (storedLanguage) setLanguage(storedLanguage);
    if (storedTheme) setTheme(storedTheme);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("afm-language", language);
    window.localStorage.setItem("afm-theme", theme);
    const root = document.documentElement;
    Object.entries(THEMES[theme].colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.dataset.theme = theme;
    root.dataset.language = language;
  }, [language, theme]);

  const dictionary = useMemo(() => (language === "bn" ? bn : en), [language]);

  return (
    <AppContext.Provider value={{ language, setLanguage, theme, setTheme, dictionary }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(AppContext);
}

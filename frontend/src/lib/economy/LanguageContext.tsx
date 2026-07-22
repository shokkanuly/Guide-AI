"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "./translations";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("econpulse_language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "ru" || savedLang === "kk")) {
      setLanguageState(savedLang);
    }
    setIsMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("econpulse_language", lang);
  };

  const t = (path: string, replacements?: Record<string, string | number>): string => {
    const parts = path.split(".");
    let obj: any = translations[language];
    
    // Attempt lookup in current language
    let found = true;
    for (const part of parts) {
      if (obj && obj[part] !== undefined) {
        obj = obj[part];
      } else {
        found = false;
        break;
      }
    }

    // Fallback to English if not found
    if (!found || typeof obj !== "string") {
      let enObj: any = translations["en"];
      let fallbackFound = true;
      for (const part of parts) {
        if (enObj && enObj[part] !== undefined) {
          enObj = enObj[part];
        } else {
          fallbackFound = false;
          break;
        }
      }
      obj = fallbackFound ? enObj : path;
    }

    if (typeof obj === "string") {
      let result = obj;
      if (replacements) {
        for (const [key, value] of Object.entries(replacements)) {
          result = result.replace(new RegExp(`{${key}}`, "g"), String(value));
        }
      }
      return result;
    }

    return path;
  };

  // Prevent SSR hydration mismatches by returning placeholder until client hydration completes
  if (!isMounted) {
    const serverT = (path: string, replacements?: Record<string, string | number>): string => {
      const parts = path.split(".");
      let obj: any = translations["en"];
      for (const part of parts) {
        obj = obj?.[part];
      }
      if (typeof obj === "string") {
        let result = obj;
        if (replacements) {
          for (const [key, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(`{${key}}`, "g"), String(value));
          }
        }
        return result;
      }
      return path;
    };
    return (
      <LanguageContext.Provider value={{ language: "en", setLanguage: () => {}, t: serverT }}>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

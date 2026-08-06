"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  isLocale,
  messages,
  type Locale,
} from "@/lib/i18n/messages";

const LOCALE_STORAGE_KEY = "tawie-locale";

function readLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

/** Resolve a dotted key path (`"home.subtitle"`) against a locale tree. */
function resolve(tree: unknown, path: string): string | undefined {
  let node: unknown = tree;
  for (const part of path.split(".")) {
    if (node && typeof node === "object" && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

type Translate = (key: string, vars?: Record<string, string | number>) => string;

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translate;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window === "undefined" ? DEFAULT_LOCALE : readLocale(),
  );

  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback<Translate>(
    (key, vars) => {
      const raw =
        resolve(messages[locale], key) ??
        resolve(messages[DEFAULT_LOCALE], key) ??
        key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, name) =>
        name in vars ? String(vars[name]) : `{${name}}`,
      );
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Convenience hook returning just the translate function. */
export function useTranslations(): Translate {
  return useI18n().t;
}

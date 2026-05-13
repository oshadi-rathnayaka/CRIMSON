import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const STORAGE_KEY = "crimson_citizen_settings";

const DEFAULT_SETTINGS = {
  preferences: {
    language: "english",
    theme: "light",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24hour",
  },
  notifications: {
    caseStatus: false,
    supportRequest: false,
    emergencyAlerts: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  accessibility: {
    textSize: 50,
    highContrast: false,
    screenReader: false,
  },
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      preferences:   { ...DEFAULT_SETTINGS.preferences,   ...parsed.preferences },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
      accessibility: { ...DEFAULT_SETTINGS.accessibility, ...parsed.accessibility },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function resolveTheme(theme) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [settings, setSettings] = useState(loadSettings);
  const syncedUserIdRef = useRef(null);
  const textScale = 0.85 + ((settings.accessibility.textSize - 10) / 90) * 0.5;

  // ── On login: override localStorage with backend-saved settings ──────────
  useEffect(() => {
    if (!user?._id || syncedUserIdRef.current === String(user._id)) return;
    if (!user.settings) return;
    syncedUserIdRef.current = String(user._id);

    // Prefer local settings when present so recent in-app theme changes
    // are preserved across route transitions (e.g. Settings -> Home).
    const local = loadSettings();
    const merged = {
      preferences:   { ...DEFAULT_SETTINGS.preferences,   ...user.settings.preferences,   ...local.preferences },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...user.settings.notifications, ...local.notifications },
      accessibility: { ...DEFAULT_SETTINGS.accessibility, ...user.settings.accessibility, ...local.accessibility },
    };
    setSettings(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }, [user?._id]);

  const effectiveTheme = resolveTheme(settings.preferences.theme);

  // Apply theme + contrast to <html> so ALL elements inherit it.
  // On the home page only: if an officer is logged in, defer to their theme.
  // All citizen-specific pages always use citizen settings regardless of logged-in role.
  useEffect(() => {
    const html = document.documentElement;

    const isOfficerOnHome = pathname === "/" && user?.role === "officer";
    if (isOfficerOnHome) {
      const officerTheme = user?.settings?.preferences?.theme === "dark" ? "dark" : "light";
      html.setAttribute("data-theme", officerTheme);
      html.style.colorScheme = officerTheme === "dark" ? "dark" : "light";
      return () => {
        html.removeAttribute("data-theme");
        html.style.colorScheme = "";
      };
    }

    html.setAttribute("data-theme", effectiveTheme);
    html.setAttribute("data-contrast", settings.accessibility.highContrast ? "high" : "normal");
    html.style.setProperty("--citizen-text-scale", String(textScale));

    // color-scheme tells browser to use dark native UI elements
    html.style.colorScheme = effectiveTheme === "dark" ? "dark" : "light";

    return () => {
      // Clean up when leaving citizen pages
      html.removeAttribute("data-theme");
      html.removeAttribute("data-contrast");
      html.style.removeProperty("--citizen-text-scale");
      html.style.colorScheme = "";
    };
  }, [effectiveTheme, settings.accessibility.highContrast, textScale, pathname, user?.role, user?.settings?.preferences?.theme]);

  // Listen for OS theme changes when "system" is selected
  useEffect(() => {
    if (settings.preferences.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.setAttribute("data-theme", resolveTheme("system"));
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.preferences.theme]);

  // ── Persist to localStorage + backend ───────────────────────────────────
  const persistSettings = useCallback((next) => {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (user) {
      api.put("/auth/settings", next).catch(() => {});
    }
  }, [user]);

  // ── Granular updaters — always pass full settings object to persistSettings
  const updatePreferences = useCallback(
    (patch) => {
      setSettings((prev) => {
        const next = { ...prev, preferences: { ...prev.preferences, ...patch } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const updateNotifications = useCallback(
    (patch) => {
      setSettings((prev) => {
        const next = { ...prev, notifications: { ...prev.notifications, ...patch } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const updateAccessibility = useCallback(
    (patch) => {
      setSettings((prev) => {
        const next = { ...prev, accessibility: { ...prev.accessibility, ...patch } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  return (
    <SettingsContext.Provider
      value={{ settings, effectiveTheme, updatePreferences, updateNotifications, updateAccessibility, saveSettings: persistSettings }}
    >
      <div style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within <SettingsProvider>");
  return ctx;
}

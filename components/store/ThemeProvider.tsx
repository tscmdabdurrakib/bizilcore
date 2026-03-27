"use client";

import { createContext, useContext } from "react";
import type { ThemeConfig } from "@/lib/themes";

interface ThemeDefaults {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  accent: string;
}

interface ThemeContextValue {
  theme: ThemeConfig;
  primary: string;
  accent: string;
  defaults: ThemeDefaults;
}

const FALLBACK_DEFAULTS: ThemeDefaults = {
  bg: "#ffffff",
  surface: "#f9fafb",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  primary: "#0F6E56",
  accent: "#00E676",
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: {} as ThemeConfig,
  primary: "#0F6E56",
  accent: "#00E676",
  defaults: FALLBACK_DEFAULTS,
});

export function useStoreTheme() {
  return useContext(ThemeContext);
}

interface Props {
  theme: ThemeConfig;
  primary: string;
  accent: string;
  children: React.ReactNode;
}

export function StoreThemeProvider({ theme, primary, accent, children }: Props) {
  const defaults: ThemeDefaults = {
    bg: theme.colors.background,
    surface: theme.colors.surface,
    text: theme.colors.text,
    muted: theme.colors.textMuted,
    border: theme.colors.border,
    primary,
    accent,
  };

  const borderRadiusValue =
    theme.components.borderRadius === "rounded-none" ? "0" :
    theme.components.borderRadius === "rounded-sm" ? "4px" :
    theme.components.borderRadius === "rounded-md" ? "8px" :
    theme.components.borderRadius === "rounded-xl" ? "12px" :
    theme.components.borderRadius === "rounded-2xl" ? "16px" :
    theme.components.borderRadius === "rounded-full" ? "9999px" :
    "8px";

  const cssVars = {
    "--store-primary": primary,
    "--store-accent": accent,
    "--store-bg": theme.colors.background,
    "--store-surface": theme.colors.surface,
    "--store-text": theme.colors.text,
    "--store-muted": theme.colors.textMuted,
    "--store-border": theme.colors.border,
    "--store-radius": borderRadiusValue,
    "--store-font-heading": theme.typography.fontHeading,
    "--store-font-body": theme.typography.fontBody,
    "--nav-bg": theme.layout.navBg,
    "--nav-text": theme.layout.navTextColor,
    "--theme-primary": primary,
    "--theme-accent": accent,
    "--theme-bg": theme.colors.background,
    "--theme-surface": theme.colors.surface,
    "--theme-text": theme.colors.text,
    "--theme-text-muted": theme.colors.textMuted,
    "--theme-border": theme.colors.border,
    "--theme-font-heading": theme.typography.fontHeading,
    "--theme-font-body": theme.typography.fontBody,
  } as React.CSSProperties;

  return (
    <ThemeContext.Provider value={{ theme, primary, accent, defaults }}>
      <div
        style={cssVars}
        className={`store-theme-${theme.id}`}
        data-theme={theme.id}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * BizilCore Design System — CSS-variable-based tokens
 * Dark mode is applied via `html.dark` class (toggled via ThemeToggle in header)
 */
export const S = {
  bg:           "var(--c-bg)",
  surface:      "var(--c-surface)",
  border:       "var(--c-border)",
  text:         "var(--c-text)",
  secondary:    "var(--c-text-sub)",
  muted:        "var(--c-text-muted)",
  primary:      "var(--c-primary)",
  primaryLight: "var(--c-primary-light)",
  primaryText:  "var(--c-primary-text)",
} as const;

/** Semantic tint pairs — bg/text/icon for dashboard cards & widgets */
export const T = {
  success: {
    bg: "var(--bg-success-soft)",
    text: "var(--bg-success-text)",
    border: "var(--bg-success-border)",
    iconBg: "var(--icon-green-bg)",
    iconText: "var(--icon-green-text)",
  },
  danger: {
    bg: "var(--bg-danger-soft)",
    text: "var(--bg-danger-text)",
    border: "var(--bg-danger-border)",
    iconBg: "var(--icon-red-bg)",
    iconText: "var(--icon-red-text)",
  },
  warning: {
    bg: "var(--bg-warning-soft)",
    text: "var(--bg-warning-text)",
    border: "var(--bg-warning-border)",
    iconBg: "var(--icon-amber-bg)",
    iconText: "var(--icon-amber-text)",
  },
  info: {
    bg: "var(--bg-info-soft)",
    text: "var(--bg-info-text)",
    border: "var(--bg-info-border)",
    iconBg: "var(--icon-blue-bg)",
    iconText: "var(--icon-blue-text)",
  },
  purple: {
    bg: "var(--bg-purple-soft)",
    text: "var(--bg-purple-text)",
    border: "var(--bg-purple-soft)",
    iconBg: "var(--icon-purple-bg)",
    iconText: "var(--icon-purple-text)",
  },
} as const;

export type ThemeColors = typeof S;
export type TintName = keyof typeof T;

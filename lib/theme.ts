/**
 * BizilCore Design System — CSS-variable-based tokens
 * Dark mode is applied via `html.dark` class (toggled in settings)
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

export type ThemeColors = typeof S;

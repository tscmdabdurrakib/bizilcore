export type ThemeConfig = {
  id: string;
  name: string;
  namebn: string;
  description: string;
  category: string;

  layout: {
    navStyle: "topbar_logo_left" | "topbar_centered" | "minimal_sticky";
    navBg: string;
    navTextColor: string;
    heroStyle: "fullwidth_image" | "split_text_image" | "banner_slider" | "text_only_centered";
    heroHeight: string;
    productGridCols: 2 | 3 | 4;
    productCardStyle: "shadow_card" | "borderless" | "outlined" | "image_overlay";
    footerStyle: "minimal" | "columns" | "dark_full";
    sectionOrder: string[];
  };

  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    badge: string;
  };

  typography: {
    fontHeading: string;
    fontBody: string;
    headingWeight: string;
    heroSize: string;
    productNameSize: string;
  };

  components: {
    borderRadius: string;
    buttonStyle: "solid" | "outline" | "soft" | "ghost";
    buttonRadius: string;
    shadows: boolean;
    animations: boolean;
    imageAspectRatio: "square" | "portrait" | "landscape";
  };
};

export const minimalTheme: ThemeConfig = {
  id: "minimal",
  name: "Minimal",
  namebn: "মিনিমাল",
  description: "সাধারণ ও পরিষ্কার ডিজাইন, সব ধরনের পণ্যের জন্য",
  category: "general",

  layout: {
    navStyle: "minimal_sticky",
    navBg: "#ffffff",
    navTextColor: "#000000",
    heroStyle: "text_only_centered",
    heroHeight: "50vh",
    productGridCols: 4,
    productCardStyle: "outlined",
    footerStyle: "minimal",
    sectionOrder: ["hero", "all_products", "categories", "featured", "about"],
  },

  colors: {
    primary: "#000000",
    accent: "#0070f3",
    background: "#ffffff",
    surface: "#fafafa",
    text: "#000000",
    textMuted: "#666666",
    border: "#eaeaea",
    badge: "#0070f3",
  },

  typography: {
    fontHeading: "Inter",
    fontBody: "Inter",
    headingWeight: "700",
    heroSize: "text-5xl",
    productNameSize: "text-sm",
  },

  components: {
    borderRadius: "rounded-md",
    buttonStyle: "solid",
    buttonRadius: "rounded-md",
    shadows: false,
    animations: false,
    imageAspectRatio: "square",
  },
};

export const THEMES: Record<string, ThemeConfig> = {
  minimal: minimalTheme,
};

export function getThemeConfig(themeId: string): ThemeConfig {
  return THEMES[themeId] ?? THEMES.minimal;
}

export const FONT_URLS: Record<string, string> = {
  "Inter": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap",
};

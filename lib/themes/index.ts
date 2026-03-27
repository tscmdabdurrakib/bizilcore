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

export const boldTheme: ThemeConfig = {
  id: "bold",
  name: "Bold",
  namebn: "বোল্ড",
  description: "Fashion ও clothing brand এর জন্য",
  category: "fashion",

  layout: {
    navStyle: "topbar_logo_left",
    navBg: "#111111",
    navTextColor: "#ffffff",
    heroStyle: "fullwidth_image",
    heroHeight: "90vh",
    productGridCols: 3,
    productCardStyle: "image_overlay",
    footerStyle: "dark_full",
    sectionOrder: ["hero", "featured", "categories", "all_products"],
  },

  colors: {
    primary: "#111111",
    accent: "#ff3d00",
    background: "#f8f8f8",
    surface: "#ffffff",
    text: "#111111",
    textMuted: "#666666",
    border: "#eeeeee",
    badge: "#ff3d00",
  },

  typography: {
    fontHeading: "Bebas Neue",
    fontBody: "Inter",
    headingWeight: "900",
    heroSize: "text-7xl",
    productNameSize: "text-lg",
  },

  components: {
    borderRadius: "rounded-none",
    buttonStyle: "solid",
    buttonRadius: "rounded-none",
    shadows: false,
    animations: true,
    imageAspectRatio: "portrait",
  },
};

export const elegantTheme: ThemeConfig = {
  id: "elegant",
  name: "Elegant",
  namebn: "এলিগেন্ট",
  description: "গহনা, বুটিক ও luxury পণ্যের জন্য",
  category: "fashion",

  layout: {
    navStyle: "topbar_centered",
    navBg: "#1a0a00",
    navTextColor: "#d4af37",
    heroStyle: "split_text_image",
    heroHeight: "70vh",
    productGridCols: 3,
    productCardStyle: "borderless",
    footerStyle: "dark_full",
    sectionOrder: ["hero", "featured", "all_products", "about"],
  },

  colors: {
    primary: "#1a0a00",
    accent: "#d4af37",
    background: "#fdfaf5",
    surface: "#ffffff",
    text: "#1a0a00",
    textMuted: "#8b7355",
    border: "#e8dcc8",
    badge: "#d4af37",
  },

  typography: {
    fontHeading: "Cormorant Garamond",
    fontBody: "Hind Siliguri",
    headingWeight: "600",
    heroSize: "text-6xl",
    productNameSize: "text-base",
  },

  components: {
    borderRadius: "rounded-sm",
    buttonStyle: "outline",
    buttonRadius: "rounded-none",
    shadows: false,
    animations: true,
    imageAspectRatio: "square",
  },
};

export const freshTheme: ThemeConfig = {
  id: "fresh",
  name: "Fresh",
  namebn: "ফ্রেশ",
  description: "খাবার, রেস্তোরাঁ ও grocery এর জন্য",
  category: "food",

  layout: {
    navStyle: "topbar_logo_left",
    navBg: "#ffffff",
    navTextColor: "#1a1a1a",
    heroStyle: "banner_slider",
    heroHeight: "60vh",
    productGridCols: 4,
    productCardStyle: "shadow_card",
    footerStyle: "columns",
    sectionOrder: ["hero", "categories", "featured", "all_products", "about"],
  },

  colors: {
    primary: "#2e7d32",
    accent: "#ff6f00",
    background: "#f9fbe7",
    surface: "#ffffff",
    text: "#1b5e20",
    textMuted: "#558b2f",
    border: "#dcedc8",
    badge: "#ff6f00",
  },

  typography: {
    fontHeading: "Hind Siliguri",
    fontBody: "Hind Siliguri",
    headingWeight: "700",
    heroSize: "text-5xl",
    productNameSize: "text-sm",
  },

  components: {
    borderRadius: "rounded-xl",
    buttonStyle: "solid",
    buttonRadius: "rounded-full",
    shadows: true,
    animations: true,
    imageAspectRatio: "square",
  },
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

export const vibrantTheme: ThemeConfig = {
  id: "vibrant",
  name: "Vibrant",
  namebn: "ভাইব্র্যান্ট",
  description: "শিশু পণ্য, গিফট ও lifestyle এর জন্য",
  category: "general",

  layout: {
    navStyle: "topbar_logo_left",
    navBg: "#7c3aed",
    navTextColor: "#ffffff",
    heroStyle: "split_text_image",
    heroHeight: "70vh",
    productGridCols: 3,
    productCardStyle: "shadow_card",
    footerStyle: "columns",
    sectionOrder: ["hero", "categories", "featured", "all_products", "about"],
  },

  colors: {
    primary: "#7c3aed",
    accent: "#f59e0b",
    background: "#fdf4ff",
    surface: "#ffffff",
    text: "#1e1b4b",
    textMuted: "#6d28d9",
    border: "#e9d5ff",
    badge: "#f59e0b",
  },

  typography: {
    fontHeading: "Nunito",
    fontBody: "Hind Siliguri",
    headingWeight: "800",
    heroSize: "text-5xl",
    productNameSize: "text-base",
  },

  components: {
    borderRadius: "rounded-2xl",
    buttonStyle: "soft",
    buttonRadius: "rounded-full",
    shadows: true,
    animations: true,
    imageAspectRatio: "square",
  },
};

export const THEMES: Record<string, ThemeConfig> = {
  bold: boldTheme,
  elegant: elegantTheme,
  fresh: freshTheme,
  minimal: minimalTheme,
  vibrant: vibrantTheme,
};

export function getThemeConfig(themeId: string): ThemeConfig {
  return THEMES[themeId] ?? THEMES.minimal;
}

export const FONT_URLS: Record<string, string> = {
  "Bebas Neue": "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
  "Cormorant Garamond": "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&display=swap",
  "Hind Siliguri": "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap",
  "Nunito": "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800&display=swap",
  "Inter": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap",
};

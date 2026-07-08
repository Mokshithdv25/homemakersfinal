/** Portfolio look & feel presets for pro public profiles. */

export const PORTFOLIO_LAYOUTS = [
  { id: "classic", label: "Classic hero", description: "Centered name, full-width cover — great for architects." },
  { id: "editorial", label: "Editorial", description: "Taller hero, magazine-style — strong for design studios." },
  { id: "compact", label: "Compact", description: "Shorter hero, dense info — ideal for trades & contractors." },
];

export const PORTFOLIO_THEMES = [
  {
    id: "warm-studio",
    name: "Warm studio",
    tagline: "HomeMakers default — trusted terracotta",
    accent: "#C85F2B",
    accentSoft: "#FDF0D8",
    border: "#EFE3D2",
    heroOverlay: "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.68) 100%)",
    layout: "classic",
    swatch: ["#C85F2B", "#FDF0D8", "#1C1917"],
  },
  {
    id: "minimal-slate",
    name: "Minimal slate",
    tagline: "Clean lines, cool neutrals",
    accent: "#334155",
    accentSoft: "#F1F5F9",
    border: "#E2E8F0",
    heroOverlay: "linear-gradient(to bottom, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.75) 100%)",
    layout: "editorial",
    swatch: ["#334155", "#F8FAFC", "#0F172A"],
  },
  {
    id: "heritage-clay",
    name: "Heritage clay",
    tagline: "Earthy browns — villas & restoration",
    accent: "#9A3412",
    accentSoft: "#FFEDD5",
    border: "#FED7AA",
    heroOverlay: "linear-gradient(135deg, rgba(68,36,20,0.2) 0%, rgba(28,25,23,0.72) 100%)",
    layout: "classic",
    swatch: ["#9A3412", "#FFEDD5", "#44403C"],
  },
  {
    id: "coastal-blue",
    name: "Coastal blue",
    tagline: "Calm blue-grey — contemporary homes",
    accent: "#1D4ED8",
    accentSoft: "#DBEAFE",
    border: "#BFDBFE",
    heroOverlay: "linear-gradient(to bottom, rgba(30,58,138,0.15) 0%, rgba(15,23,42,0.7) 100%)",
    layout: "editorial",
    swatch: ["#1D4ED8", "#EFF6FF", "#1E3A5F"],
  },
  {
    id: "forest-craft",
    name: "Forest craft",
    tagline: "Deep green — sustainable & landscape",
    accent: "#047857",
    accentSoft: "#D1FAE5",
    border: "#A7F3D0",
    heroOverlay: "linear-gradient(to bottom, rgba(6,78,59,0.2) 0%, rgba(6,24,20,0.75) 100%)",
    layout: "compact",
    swatch: ["#047857", "#ECFDF5", "#14532D"],
  },
  {
    id: "noir-contrast",
    name: "Noir contrast",
    tagline: "High contrast — bold portfolios",
    accent: "#F97316",
    accentSoft: "#FFF7ED",
    border: "#292524",
    heroOverlay: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.88) 100%)",
    layout: "compact",
    swatch: ["#F97316", "#FAFAF9", "#0C0A09"],
  },
];

export const DEFAULT_PORTFOLIO_THEME_ID = "warm-studio";
export const DEFAULT_PORTFOLIO_LAYOUT = "classic";

export function resolvePortfolioTheme(themeId, layoutOverride) {
  const base = PORTFOLIO_THEMES.find((t) => t.id === themeId) || PORTFOLIO_THEMES[0];
  const layout = layoutOverride || base.layout || DEFAULT_PORTFOLIO_LAYOUT;
  return { ...base, layout };
}

export function getPortfolioThemeFromRecord(record) {
  if (!record || typeof record !== "object") {
    return resolvePortfolioTheme(DEFAULT_PORTFOLIO_THEME_ID);
  }
  return resolvePortfolioTheme(
    record.portfolio_theme || record.theme_id || DEFAULT_PORTFOLIO_THEME_ID,
    record.portfolio_layout || null,
  );
}

export function portfolioThemeCssVars(theme) {
  const t = theme || resolvePortfolioTheme(DEFAULT_PORTFOLIO_THEME_ID);
  return {
    "--hm-portfolio-accent": t.accent,
    "--hm-portfolio-accent-soft": t.accentSoft,
    "--hm-portfolio-border": t.border,
    "--hm-portfolio-hero-overlay": t.heroOverlay,
  };
}

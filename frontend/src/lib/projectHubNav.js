/**
 * Sidebar destinations for project hub pages (Documents, Team, Shop, Find Pros, etc.).
 * Paths must match App.js routes.
 */
export const PROJECT_HUB_NAV = [
  { icon: "⊞", label: "Overview", path: "/project" },
  { icon: "📅", label: "Timeline", path: "#" },
  { icon: "✓", label: "Tasks", path: "#" },
  { icon: "₹", label: "Budget", path: "#" },
  { icon: "📸", label: "Site Feed", path: "#" },
  { icon: "📄", label: "Documents", path: "/documents" },
  { icon: "🧭", label: "Design journey", path: "/project/journey" },
  { icon: "🛒", label: "Shop", path: "/project/shop" },
  { icon: "👷", label: "Find Pros", path: "/project/browse" },
  { icon: "👥", label: "Team", path: "/team" },
  { icon: "⚙️", label: "Settings", path: "#" },
];

/** Whether a sidebar item should render as active for the current pathname. */
export function hubNavActive(pathname, itemPath) {
  if (!itemPath || itemPath === "#") return false;
  if (itemPath === "/project/browse") return pathname === "/project/browse" || pathname === "/marketplace";
  return pathname === itemPath;
}

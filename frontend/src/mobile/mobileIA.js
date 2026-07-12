/**
 * Mobile IA: Houzz-style shell + HomeMakers product flows.
 *
 * Framework (inspired by Houzz):
 *   bottom tabs · search-first discovery · saved boards · project hub · profile
 *
 * Our details (already on desktop):
 *   Build new home · Remodel · Marketplace (published portfolios) · Project PM · Pro portfolio onboarding
 */

export const MOBILE_TABS = [
  { id: "home", label: "Home", path: "/" },
  { id: "design", label: "Design", path: "/design" },
  { id: "pros", label: "Pros", path: "/browse" },
  { id: "project", label: "Project", path: "/project" },
  { id: "you", label: "You", path: "/account" },
];

/** HomeMakers core flows — primary entry points on Home & Design tabs. */
export const HM_CORE_FLOWS = [
  {
    id: "build",
    label: "Build a new home",
    sub: "Your brief → AI designs & budget",
    path: "/build/new-home",
    icon: "build",
  },
  {
    id: "remodel",
    label: "Remodel your home",
    sub: "Room photos → AI concepts & costs",
    path: "/build/remodel",
    icon: "remodel",
  },
  {
    id: "pros",
    label: "Find pros",
    sub: "Published portfolios · Bengaluru & beyond",
    path: "/browse",
    icon: "pros",
  },
  {
    id: "project",
    label: "Manage project",
    sub: "Saved phases, tasks & AI v0",
    path: "/project",
    icon: "project",
  },
];

/** Pro-side flow (You tab). */
export const HM_PRO_FLOWS = [
  {
    id: "portfolio",
    label: "Build your portfolio",
    sub: "Craft → details → theme → photos → go live",
    path: "/craft",
  },
  {
    id: "pro-dashboard",
    label: "Pro dashboard",
    sub: "Leads & profile strength",
    path: "/pro",
  },
];

/** Indian home context — room filters for pro portfolio discovery on Home. */
export const INDIAN_ROOM_FILTERS = [
  { id: "all", label: "All work" },
  { id: "architect", label: "Architects", craft: "architect" },
  { id: "contractor", label: "Contractors", craft: "contractor" },
  { id: "kitchen", label: "Modular kitchen", craft: null },
  { id: "puja", label: "Puja room", craft: null },
  { id: "villa", label: "Villas & plots", craft: "architect" },
];

export function flowTypeLabel(flowType, source) {
  if (flowType === "remodel" || source === "remodel") return "Remodel";
  if (flowType === "new_home" || source === "build-new") return "New home build";
  return "Home project";
}

export function projectStatusLabel(status) {
  if (status === "v0_ready") return "AI v0 ready";
  if (status === "submitted") return "Brief submitted";
  if (status === "active") return "On site";
  return status || "In progress";
}

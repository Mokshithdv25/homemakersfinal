import axios from "axios";
import { publicAsset } from "./publicAsset";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const isDev = process.env.NODE_ENV === "development";
const normalizedBackendUrl =
  BACKEND_URL && !String(BACKEND_URL).includes("undefined")
    ? BACKEND_URL.replace(/\/$/, "")
    : "";

/** In dev, CRA proxy sends /api → localhost:8000 when REACT_APP_BACKEND_URL is unset. */
const apiBase = normalizedBackendUrl
  ? `${normalizedBackendUrl}/api`
  : isDev
    ? "/api"
    : null;

const aiClient = apiBase
  ? axios.create({
      baseURL: apiBase,
      timeout: 200000,
    })
  : null;

const WAKE_ATTEMPTS = 3;
const WAKE_DELAY_MS = 28000;
const IMAGE_ATTEMPTS = 3;
const IMAGE_RETRY_DELAY_MS = 12000;

export function isAiBackendConfigured() {
  return Boolean(aiClient);
}

/** Fire-and-forget warm-up so the free-tier backend wakes before first AI use. */
export function warmAiBackend() {
  if (!aiClient) return;
  aiClient.get("/ai/status", { timeout: 120000 }).catch(() => {
    /* cold start or offline — the generate flow has its own wake retries */
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True when URL is from Grok/xAI (not stock Unsplash or local template paths). */
export function isGrokConceptUrl(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  if (u.includes("unsplash.com")) return false;
  if (u.includes("/floorplan_") || u.endsWith("floorplan_ground.png") || u.endsWith("floorplan_first.png")) {
    return false;
  }
  if (u.startsWith("data:image")) return true;
  if (u.includes("x.ai") || u.includes("imgen.x.ai")) return true;
  return false;
}

/** At least one elevation/concept image from Grok (floor plans may still be indicative templates). */
export function bundleHasGrokConcepts(bundle) {
  const images = Array.isArray(bundle?.images) ? bundle.images : [];
  return images.some((img) => isGrokConceptUrl(img?.url));
}

/** Strip engineer notes before UI; keep bundle shape. */
export function sanitizeV0Bundle(bundle) {
  if (!bundle || typeof bundle !== "object") return bundle;
  const { provider_note: _note, ...rest } = bundle;
  return rest;
}

export function sanitizePlanBundle(bundle) {
  return sanitizeV0Bundle(bundle);
}

/** Hostname only — safe to show in UI (no secrets). */
export function getAiBackendHost() {
  if (!normalizedBackendUrl) return null;
  try {
    return new URL(normalizedBackendUrl).host;
  } catch {
    return normalizedBackendUrl;
  }
}

async function fallbackDelay() {
  await new Promise((r) => setTimeout(r, 400));
}

function buildFloorPlanMocks(floors, headline) {
  const f = String(floors || "G+1").trim();
  const slots = [];
  if (f === "G") {
    slots.push({ label: "Ground floor plan v0", file: "floorplan_ground.png", hint: "Single-level layout from your brief" });
    slots.push({ label: "Alternate ground layout v0", file: "floorplan_first.png", hint: "Second zoning option for discussion" });
  } else if (f === "G+1") {
    slots.push({ label: "Ground floor plan v0", file: "floorplan_ground.png", hint: "Zoning + room grid (not GFC)" });
    slots.push({ label: "First floor plan v0", file: "floorplan_first.png", hint: "Upper level blocking + baths" });
  } else if (f === "G+2") {
    slots.push({ label: "Ground floor plan v0", file: "floorplan_ground.png", hint: "Ground level program" });
    slots.push({ label: "First floor plan v0", file: "floorplan_first.png", hint: "Mid level bedrooms / living" });
    slots.push({ label: "Second floor plan v0", file: "floorplan_first.png", hint: "Top floor / terrace level (indicative)" });
  } else {
    slots.push({ label: "Ground floor plan v0", file: "floorplan_ground.png", hint: "Ground level" });
    slots.push({ label: "First floor plan v0", file: "floorplan_first.png", hint: "First floor" });
    slots.push({ label: "Second floor plan v0", file: "floorplan_first.png", hint: "Second floor" });
    slots.push({ label: "Third floor plan v0", file: "floorplan_ground.png", hint: "Top floor / terrace (indicative)" });
  }
  return slots.map((s) => ({
    url: publicAsset(s.file),
    label: s.label,
    hint: `${s.hint} — ${headline}`,
  }));
}

/** Dev-only fallback when no backend URL is configured. */
function mockV0ImagesClient(flow, brief) {
  const headline =
    brief?.location?.split?.(",")?.[0]?.trim?.() ||
    brief?.room ||
    "Project";
  const isRemodel = flow === "remodel";
  const floors = brief?.floors || "G+1";

  if (isRemodel) {
    return {
      mock: true,
      floor_plans: [
        {
          url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1000&q=80",
          label: `${headline} — layout v0 (plan sketch)`,
          hint: "Furniture + circulation overlay on room footprint",
        },
        {
          url: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9ce?w=1000&q=80",
          label: "Services & ceiling v0",
          hint: "Lighting grid + services assumptions for discussion",
        },
      ],
      images: [
        {
          url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=75",
          label: "Interior concept — main view",
          hint: "Layout, palette & key furniture",
        },
        {
          url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=75",
          label: "Interior concept — complementary view",
          hint: "Materials, lighting & detail",
        },
      ],
    };
  }

  return {
    mock: true,
    floor_plans: buildFloorPlanMocks(floors, headline),
    images: [
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=75",
        label: "Exterior concept — street view",
        hint: "Front façade, massing & materials",
      },
      {
        url: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=75",
        label: "Exterior concept — complementary view",
        hint: "Garden/rear connection & roof study",
      },
    ],
  };
}

function remodelBudgetInr(brief) {
  if (brief?.budgetInr) return Number(brief.budgetInr);
  const n = parseInt(String(brief?.budgetAmount ?? "0"), 10) || 0;
  if (n <= 0) return 700000;
  return String(brief?.budgetUnit || "").toLowerCase().startsWith("cr")
    ? n * 10_000_000
    : n * 100_000;
}

function mockEstimateClient(flow, brief) {
  const headline =
    brief?.location?.split?.(",")?.[0]?.trim?.() ||
    brief?.room ||
    "Project";
  if (flow === "remodel") {
    const cap = remodelBudgetInr(brief);
    const weights = [
      ["Demolition & site prep (indicative)", 0.08],
      ["Civil & carpentry (indicative)", 0.34],
      ["Electrical & lighting (indicative)", 0.16],
      ["Finishes & fixtures (indicative)", 0.34],
      ["Contingency (within cap)", 0.08],
    ];
    let running = 0;
    const estimate_lines = weights.slice(0, -1).map(([label, pct]) => {
      const amount_inr = Math.round(cap * pct);
      running += amount_inr;
      return { label, amount_inr, note: `${headline} — room-scope v0` };
    });
    estimate_lines.push({
      label: weights[weights.length - 1][0],
      amount_inr: Math.max(cap - running, 0),
      note: "Stays inside your stated budget band",
    });
    const total_indicative_inr = estimate_lines.reduce((s, l) => s + l.amount_inr, 0);
    return {
      mock: true,
      estimate_lines,
      total_indicative_inr,
      milestones: [
        { title: "Concept lock & samples", timeframe: "Weeks 1–2" },
        { title: "Working drawings & BOQ", timeframe: "Weeks 3–5" },
        { title: "Execution on site", timeframe: "Per timeline in brief" },
        { title: "Snag & handover", timeframe: "Final week" },
      ],
      project_summary: `Indicative ${brief?.room || "room"} remodel in ${headline} scoped to ~₹${Math.round(total_indicative_inr / 100000)} L (your budget band).`,
    };
  }
  const estimate_lines = [
    { label: "Structure & shell (indicative)", amount_inr: 2650000, note: `${headline} — tied to floor plans v0` },
    { label: "Exterior facade package", amount_inr: 620000, note: "Elevations v0 + materials allowance" },
    { label: "Core interiors (indicative)", amount_inr: 980000, note: "Kitchen, wardrobes, baths baseline" },
    { label: "Services (MEP rough-in)", amount_inr: 540000, note: "Electrical, plumbing, basic HVAC points" },
  ];
  const total_indicative_inr = estimate_lines.reduce(
    (s, l) => s + (typeof l.amount_inr === "number" ? l.amount_inr : 0),
    0,
  );
  return {
    mock: true,
    estimate_lines,
    total_indicative_inr,
    milestones: [
      { title: "Approve v0 direction", timeframe: "This week" },
      { title: "Lock scope & estimate", timeframe: "Next" },
      { title: "Execution window", timeframe: "Per timeline in brief" },
    ],
    project_summary:
      flow === "remodel" ? `Remodel roadmap for ${headline}.` : `Build roadmap for ${headline}.`,
  };
}

async function wakeAiBackend(onStatus) {
  if (!aiClient) return false;
  for (let i = 0; i < WAKE_ATTEMPTS; i++) {
    if (i > 0) {
      onStatus?.(`Waking AI server… (attempt ${i + 1} of ${WAKE_ATTEMPTS})`);
      await sleep(WAKE_DELAY_MS);
    } else {
      onStatus?.("Connecting to AI…");
    }
    try {
      await aiClient.get("/ai/status", { timeout: 90000 });
      return true;
    } catch {
      /* retry */
    }
  }
  return false;
}

function mergeFloorPlansFromTemplate(data, flow, brief) {
  if (data.floor_plans?.length) return data;
  const tmpl = mockV0ImagesClient(flow, brief);
  return { ...data, floor_plans: tmpl.floor_plans };
}

/**
 * Design images from wizard brief → backend → Grok Imagine.
 * Waits for real Grok URLs; never returns instant stock placeholders in production.
 */
export async function requestV0Images(flow, brief, { onStatus } = {}) {
  const safeBrief = brief && typeof brief === "object" ? brief : {};
  if (!aiClient) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AI service is not configured. Please try again in a few minutes.");
    }
    await fallbackDelay();
    return sanitizeV0Bundle(mockV0ImagesClient(flow, safeBrief));
  }

  const postImages = () =>
    aiClient.post("/ai/v0-images", { flow, brief: safeBrief }, { timeout: 200000 });

  onStatus?.("Preparing AI design generation…");
  await wakeAiBackend(onStatus);

  let lastError = null;

  for (let attempt = 1; attempt <= IMAGE_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      onStatus?.(`Generating concepts… (attempt ${attempt} of ${IMAGE_ATTEMPTS})`);
      await sleep(IMAGE_RETRY_DELAY_MS);
    } else {
      onStatus?.("Generating your design pack… (about 1–3 minutes)");
    }

    try {
      const { data } = await postImages();
      if (bundleHasGrokConcepts(data)) {
        onStatus?.("Design concepts ready.");
        const merged = mergeFloorPlansFromTemplate(data, flow, safeBrief);
        return sanitizeV0Bundle(merged);
      }
      lastError = new Error("AI did not return generated concept images yet.");
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Could not generate design images. Wait a minute and tap Regenerate.");
}

/**
 * Estimate + milestones from same brief (+ optional image bundle context).
 */
export async function requestEstimatePlan(flow, brief, imageBundle = null) {
  if (!aiClient) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AI service is not configured. Please try again in a few minutes.");
    }
    await fallbackDelay();
    return sanitizePlanBundle(mockEstimateClient(flow, brief));
  }
  const { data } = await aiClient.post("/ai/estimate-plan", {
    flow,
    brief,
    image_bundle: imageBundle,
  });
  return sanitizePlanBundle(data);
}

export function formatAiApiError(err) {
  if (err?.code === "ECONNABORTED") {
    return "This is taking longer than usual — the AI server may be waking up. Wait a moment and tap Regenerate.";
  }
  if (err?.message === "Network Error" || err?.code === "ERR_NETWORK") {
    return "Could not reach the AI service. Wait a minute and try again.";
  }
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((x) => (typeof x === "object" && x.msg ? x.msg : String(x))).join(" ");
  }
  return err?.message || "Generation failed. Try again.";
}

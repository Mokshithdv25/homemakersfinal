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
      timeout: 180000,
    })
  : null;

export function isAiBackendConfigured() {
  return Boolean(aiClient);
}

/** Quick check: is Render AI up and is Grok configured? */
export async function fetchAiBackendStatus() {
  if (!aiClient) {
    return { ok: false, grok_configured: false, host: null, error: "REACT_APP_BACKEND_URL not set on Vercel" };
  }
  try {
    const { data } = await aiClient.get("/ai/status", { timeout: 12000 });
    return { ok: true, host: getAiBackendHost(), ...data };
  } catch (err) {
    return {
      ok: false,
      grok_configured: false,
      host: getAiBackendHost(),
      error: formatAiApiError(err),
    };
  }
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
      provider_note: "",
    };
  }
  const estimate_lines =
      [
          { label: "Structure & shell (indicative)", amount_inr: 2650000, note: `${headline} — tied to floor plans v0` },
          { label: "Exterior facade package", amount_inr: 620000, note: "Elevations v0 + materials allowance" },
          { label: "Core interiors (indicative)", amount_inr: 980000, note: "Kitchen, wardrobes, baths baseline" },
          { label: "Services (MEP rough-in)", amount_inr: 540000, note: "Electrical, plumbing, basic HVAC points" },
        ];
  const total_indicative_inr = estimate_lines.reduce(
    (s, l) => s + (typeof l.amount_inr === "number" ? l.amount_inr : 0),
    0
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
      flow === "remodel"
        ? `Remodel roadmap for ${headline}.`
        : `Build roadmap for ${headline}.`,
    provider_note: "",
  };
}

/**
 * Design images from wizard brief → backend → Grok Imagine.
 */
export async function requestV0Images(flow, brief) {
  const safeBrief = brief && typeof brief === "object" ? brief : {};
  if (!aiClient) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AI backend is not connected. In Vercel → Settings → Environment Variables, set REACT_APP_BACKEND_URL to https://homemakers-6o3h.onrender.com (no /api), then redeploy the site.",
      );
    }
    await fallbackDelay();
    return mockV0ImagesClient(flow, safeBrief);
  }
  try {
    const { data } = await aiClient.post("/ai/v0-images", { flow, brief: safeBrief });

    if (!data.floor_plans || data.floor_plans.length === 0) {
      const fallbackMock = mockV0ImagesClient(flow, safeBrief);
      data.floor_plans = fallbackMock.floor_plans;
    }

    if (!data.images || data.images.length === 0) {
      const fallbackMock = mockV0ImagesClient(flow, safeBrief);
      return {
        ...fallbackMock,
        floor_plans: data.floor_plans?.length ? data.floor_plans : fallbackMock.floor_plans,
        provider_note: "No live concept images returned — using preview renders.",
      };
    }

    return data;
  } catch (err) {
    const status = err?.response?.status;
    if (status >= 500 || status === 404 || err?.code === "ERR_NETWORK") {
      const mock = mockV0ImagesClient(flow, safeBrief);
      mock.mock = true;
      mock.provider_note =
        status >= 500
          ? "Render image API error — using preview images. Redeploy homemakers-api on Render from latest main, then Regenerate."
          : `Image API unreachable (${formatAiApiError(err)}). Using preview images.`;
      return mock;
    }
    throw err;
  }
}

/**
 * Estimate + milestones from same brief (+ optional image bundle context).
 */
export async function requestEstimatePlan(flow, brief, imageBundle = null) {
  if (!aiClient) {
    await fallbackDelay();
    return mockEstimateClient(flow, brief);
  }
  const { data } = await aiClient.post("/ai/estimate-plan", {
    flow,
    brief,
    image_bundle: imageBundle,
  });
  return data;
}

export function formatAiApiError(err) {
  if (err?.code === "ECONNABORTED") {
    return "Generation timed out — Grok image steps can take 1–2 minutes. Try again.";
  }
  if (err?.message === "Network Error" || err?.code === "ERR_NETWORK") {
    return "Cannot reach the API. Start the backend: cd backend && uvicorn server:app --reload --port 8000";
  }
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((x) => (typeof x === "object" && x.msg ? x.msg : String(x))).join(" ");
  }
  return err?.message || "Generation failed. Try again.";
}

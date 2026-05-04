import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const aiClient =
  BACKEND_URL && !String(BACKEND_URL).includes("undefined")
    ? axios.create({ baseURL: `${BACKEND_URL.replace(/\/$/, "")}/api` })
    : null;

async function fallbackDelay() {
  await new Promise((r) => setTimeout(r, 400));
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
          hint: "Furniture + circulation overlay on room footprint (indicative)",
        },
        {
          url: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9ce?w=1000&q=80",
          label: "Services & ceiling v0",
          hint: "Lighting grid + services assumptions for discussion",
        },
      ],
      images: [
        {
          url: "https://images.unsplash.com/photo-1616594039964-3b6b8f9fbe16?w=640&q=75",
          label: "Interior mood A",
          hint: "Palette + joinery direction",
        },
        {
          url: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=640&q=75",
          label: "Interior mood B",
          hint: "Alternate materials / lighting",
        },
        {
          url: "https://images.unsplash.com/photo-1615874694520-474822394e73?w=640&q=75",
          label: "Interior mood C",
          hint: "Premium finish variant",
        },
      ],
      provider_note: "Set REACT_APP_BACKEND_URL to call /api/ai/v0-images with HM_AI_IMAGE_API_KEY on the server.",
    };
  }

  return {
    mock: true,
    floor_plans: [
      {
        url: `${process.env.PUBLIC_URL || ""}/floorplan_ground.png`,
        label: "Ground floor plan v0",
        hint: `Zoning + room grid for ${headline} (indicative, not GFC)`,
      },
      {
        url: `${process.env.PUBLIC_URL || ""}/floorplan_first.png`,
        label: floors === "G" ? "Alternate ground plan v0" : "First floor plan v0",
        hint: floors === "G" ? "Second layout option from same brief" : "Upper level blocking + baths (indicative)",
      },
    ],
    images: [
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=75",
        label: "Front elevation v0",
        hint: "Street-facing façade concept",
      },
      {
        url: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=75",
        label: "Rear / garden elevation",
        hint: "Opening pattern + outdoor connection",
      },
      {
        url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=75",
        label: "Massing & roof study",
        hint: "Materials + roofline option",
      },
    ],
    provider_note: "Set REACT_APP_BACKEND_URL to call /api/ai/v0-images with HM_AI_IMAGE_API_KEY on the server.",
  };
}

function mockEstimateClient(flow, brief) {
  const headline =
    brief?.location?.split?.(",")?.[0]?.trim?.() ||
    brief?.room ||
    "Project";
  const estimate_lines =
    flow === "remodel"
      ? [
          { label: "Demolition / prep (indicative)", amount_inr: 55000, note: `${headline} — v0 interior scope` },
          { label: "Civil + carpentry (indicative)", amount_inr: 240000, note: "Layout/storage updates from brief" },
          { label: "Electrical + lighting (indicative)", amount_inr: 85000, note: "Interior services allowance" },
          { label: "Finishes + fixtures (indicative)", amount_inr: 190000, note: "Depends on finish tier" },
        ]
      : [
          { label: "Structure & shell (indicative)", amount_inr: 2650000, note: `${headline} — tied to floor plans v0` },
          { label: "Exterior facade package", amount_inr: 620000, note: "Elevations v0 + materials allowance" },
          { label: "Core interiors (indicative)", amount_inr: 980000, note: "Kitchen, wardrobes, baths baseline" },
          { label: "Services (MEP rough-in)", amount_inr: 540000, note: "Electrical, plumbing, basic HVAC points" },
        ];
  const total_indicative_inr = estimate_lines.reduce((s, l) => s + (typeof l.amount_inr === "number" ? l.amount_inr : 0), 0);
  return {
    mock: true,
    estimate_lines,
    total_indicative_inr,
    milestones: [
      { title: "Approve v0 direction", timeframe: "This week" },
      { title: "Lock scope & estimate", timeframe: "Next" },
      { title: "Execution window", timeframe: "Per timeline in brief" },
    ],
    project_summary: flow === "remodel"
      ? `Remodel roadmap for ${headline}.`
      : `Build roadmap for ${headline}.`,
    provider_note: "Set REACT_APP_BACKEND_URL to call /api/ai/estimate-plan with HM_AI_PLAN_API_KEY.",
  };
}

/**
 * Image-generation only — uses server env HM_AI_IMAGE_API_KEY when implemented.
 */
export async function requestV0Images(flow, brief) {
  if (!aiClient) {
    await fallbackDelay();
    return mockV0ImagesClient(flow, brief);
  }
  const { data } = await aiClient.post("/ai/v0-images", { flow, brief });
  return data;
}

/**
 * Estimate + project/milestone structure — uses server env HM_AI_PLAN_API_KEY when implemented.
 * Call after requestV0Images; pass imageBundle for context.
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
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((x) => (typeof x === "object" && x.msg ? x.msg : String(x))).join(" ");
  return err?.message || "Generation failed. Try again.";
}

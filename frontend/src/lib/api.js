import axios from "axios";
import { getSupabase } from "./supabaseClient";
import { withBackendAuth } from "./backendAuth";
import { refreshPortfolioMediaUrls } from "./supabaseStorage";
import { loadBlockedPortfolioIds } from "./portfolioSafetyApi";

const rawBackendUrl = process.env.REACT_APP_BACKEND_URL || "";
const normalizedBackendUrl =
  rawBackendUrl && !String(rawBackendUrl).includes("undefined")
    ? rawBackendUrl.replace(/\/$/, "")
    : "";
export const API = normalizedBackendUrl ? `${normalizedBackendUrl}/api` : "/api";

const supabase = getSupabase();
const PUBLIC_PORTFOLIO_FIELDS =
  "id, craft, full_name, business_name, city, years_experience, short_bio, specialties, photos, cover_photo, profile_photo, slug, profile_strength, portfolio_theme, portfolio_layout, updated_at";

export const api = axios.create({
  baseURL: API,
  timeout: 9000,
});

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `hm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(text = "") {
  return (
    String(text)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "pro"
  );
}

async function getAuthUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

async function createPortfolioSupabase(craft) {
  const id = makeId();
  const ownerUserId = await getAuthUserId();
  const row = {
    id,
    craft,
    owner_user_id: ownerUserId,
    profile_strength: 25,
    step: 1,
    published: false,
    slug: null,
  };
  const { error } = await supabase.from("portfolios").insert(row);
  if (error) throw error;
  return {
    ...row,
    specialties: [],
    photos: [],
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

async function getPortfolioSupabase(id) {
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", id)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Portfolio not found");
  return refreshPortfolioMediaUrls(data);
}

async function updatePortfolioSupabase(id, patch) {
  const { data, error } = await supabase
    .from("portfolios")
    .update({ ...patch, updated_at: nowIso() })
    .eq("id", id)
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Portfolio not found");
  return refreshPortfolioMediaUrls(data);
}

async function publishPortfolioSupabase(id) {
  const existing = await getPortfolioSupabase(id);
  if (!existing?.full_name || !existing?.craft) {
    throw new Error("Profile incomplete");
  }
  const slug = `${slugify(existing.full_name)}-${String(id).slice(-6)}`;
  const { data, error } = await supabase
    .from("portfolios")
    .update({
      slug,
      published: true,
      moderation_status: "pending",
      step: 5,
      profile_strength: 100,
      updated_at: nowIso(),
    })
    .eq("id", id)
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Portfolio not found");
  return refreshPortfolioMediaUrls(data);
}

async function unpublishPortfolioSupabase(id) {
  const ownerUserId = await getAuthUserId();
  if (!ownerUserId) throw new Error("Your session has expired. Sign in again.");
  const { data, error } = await supabase
    .from("portfolios")
    .update({
      published: false,
      moderation_status: "pending",
      updated_at: nowIso(),
    })
    .eq("id", id)
    .eq("owner_user_id", ownerUserId)
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Portfolio not found");
  return refreshPortfolioMediaUrls(data);
}

async function getPublicProfileSupabase(slug) {
  const { data, error } = await supabase
    .from("published_portfolios")
    .select(PUBLIC_PORTFOLIO_FIELDS)
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Profile not found");
  const blocked = await loadBlockedPortfolioIds();
  if (blocked.has(String(data.id))) throw new Error("Profile hidden");
  return refreshPortfolioMediaUrls(data);
}

export async function createPortfolio(craft) {
  if (supabase) return createPortfolioSupabase(craft);
  const { data } = await api.post("/portfolio", { craft }, await withBackendAuth());
  return data;
}

export async function getPortfolio(id) {
  if (supabase) return getPortfolioSupabase(id);
  const { data } = await api.get(`/portfolio/${id}`, await withBackendAuth());
  return refreshPortfolioMediaUrls(data);
}

/** Most recently updated portfolio owned by this user (pro onboarding resume). */
export async function fetchOwnedPortfolio(ownerUserId) {
  if (!supabase || !ownerUserId) return null;
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("fetchOwnedPortfolio:", error.message);
    return null;
  }
  return refreshPortfolioMediaUrls(data);
}

export async function updatePortfolio(id, patch) {
  if (supabase) return updatePortfolioSupabase(id, patch);
  const { data } = await api.patch(`/portfolio/${id}`, patch, await withBackendAuth());
  return data;
}

export async function publishPortfolio(id) {
  if (supabase) return publishPortfolioSupabase(id);
  const { data } = await api.post(`/portfolio/${id}/publish`, null, await withBackendAuth());
  return data;
}

export async function unpublishPortfolio(id) {
  if (supabase) return unpublishPortfolioSupabase(id);
  const { data } = await api.post(`/portfolio/${id}/unpublish`, null, await withBackendAuth());
  return data;
}

export async function getPublicProfile(slug) {
  if (supabase) return getPublicProfileSupabase(slug);
  const { data } = await api.get(`/profile/${slug}`);
  return data;
}

/** Published pros for marketplace / browse (Supabase). */
export async function listPublishedPortfolios({ craft, city, limit = 24 } = {}) {
  if (!supabase) throw new Error("Professional directory is not configured.");
  let q = supabase
    .from("published_portfolios")
    .select(PUBLIC_PORTFOLIO_FIELDS)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (craft) q = q.eq("craft", craft);
  if (city) q = q.ilike("city", `%${city}%`);
  const { data, error } = await q;
  if (error) {
    throw new Error(`Could not load the professional directory: ${error.message}`);
  }
  const blocked = await loadBlockedPortfolioIds();
  const visible = (data || []).filter((row) => !blocked.has(String(row.id)));
  return Promise.all(visible.map(refreshPortfolioMediaUrls));
}

import axios from "axios";
import { getSupabase } from "./supabaseClient";

const rawBackendUrl = process.env.REACT_APP_BACKEND_URL || "";
const normalizedBackendUrl =
  rawBackendUrl && !String(rawBackendUrl).includes("undefined")
    ? rawBackendUrl.replace(/\/$/, "")
    : "";
export const API = normalizedBackendUrl ? `${normalizedBackendUrl}/api` : "/api";

const supabase = getSupabase();

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
  return data;
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
  return data;
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
      step: 4,
      profile_strength: 100,
      updated_at: nowIso(),
    })
    .eq("id", id)
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Portfolio not found");
  return data;
}

async function getPublicProfileSupabase(slug) {
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Profile not found");
  return data;
}

export async function createPortfolio(craft) {
  if (supabase) return createPortfolioSupabase(craft);
  const { data } = await api.post("/portfolio", { craft });
  return data;
}

export async function getPortfolio(id) {
  if (supabase) return getPortfolioSupabase(id);
  const { data } = await api.get(`/portfolio/${id}`);
  return data;
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
  return data;
}

export async function updatePortfolio(id, patch) {
  if (supabase) return updatePortfolioSupabase(id, patch);
  const { data } = await api.patch(`/portfolio/${id}`, patch);
  return data;
}

export async function publishPortfolio(id) {
  if (supabase) return publishPortfolioSupabase(id);
  const { data } = await api.post(`/portfolio/${id}/publish`);
  return data;
}

export async function getPublicProfile(slug) {
  if (supabase) return getPublicProfileSupabase(slug);
  const { data } = await api.get(`/profile/${slug}`);
  return data;
}

/** Published pros for marketplace / browse (Supabase). */
export async function listPublishedPortfolios({ craft, city, limit = 24 } = {}) {
  if (!supabase) return [];
  let q = supabase
    .from("portfolios")
    .select(
      "id, craft, full_name, business_name, city, years_experience, specialties, photos, cover_photo, profile_photo, slug, profile_strength, updated_at"
    )
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (craft) q = q.eq("craft", craft);
  if (city) q = q.ilike("city", `%${city}%`);
  const { data, error } = await q;
  if (error) {
    console.warn("listPublishedPortfolios:", error.message);
    return [];
  }
  return data || [];
}

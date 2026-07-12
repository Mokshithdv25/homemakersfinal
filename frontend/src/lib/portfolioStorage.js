const K_PORTFOLIO = "hm_portfolio";

function mediaKey(portfolioId) {
  return `hm_portfolio_media_${portfolioId || "default"}`;
}

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export function clearAllPortfolioMediaCaches() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && k.startsWith("hm_portfolio_media_")) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

export function getPortfolioBase() {
  return safeParse(localStorage.getItem(K_PORTFOLIO), {});
}

export function setPortfolioBase(base) {
  const safeBase = { ...(base || {}) };
  delete safeBase.photos;
  delete safeBase.cover_photo;
  delete safeBase.profile_photo;
  const payload = JSON.stringify(safeBase);
  try {
    localStorage.setItem(K_PORTFOLIO, payload);
  } catch (err) {
    // Last-resort guard: clear heavy media blobs, then retry base save.
    clearAllPortfolioMediaCaches();
    try {
      localStorage.setItem(K_PORTFOLIO, payload);
    } catch (finalErr) {
      console.error("Failed to save portfolio base:", finalErr);
      throw new Error("Storage quota exceeded even after purging media.");
    }
  }
}

export function getPortfolioMedia(portfolioId) {
  return safeParse(localStorage.getItem(mediaKey(portfolioId)), {
    photos: [],
    cover_photo: "",
    profile_photo: "",
  });
}

export function setPortfolioMedia(portfolioId, media) {
  const payload = {
    photos: Array.isArray(media?.photos) ? media.photos : [],
    cover_photo: media?.cover_photo || "",
    profile_photo: media?.profile_photo || "",
  };
  const key = mediaKey(portfolioId);
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    // Retry with a reduced photo set to avoid hard crashes.
    const reduced = { ...payload, photos: payload.photos.slice(0, Math.min(3, payload.photos.length)) };
    localStorage.setItem(key, JSON.stringify(reduced));
  }
}

/**
 * Move legacy inline media out of hm_portfolio into a dedicated key.
 * This reduces chance of quota errors when saving non-media profile fields.
 */
export function migrateLegacyPortfolioMedia(portfolioId) {
  const base = getPortfolioBase();
  if (!base || typeof base !== "object") return;

  const hasLegacy =
    (Array.isArray(base.photos) && base.photos.length > 0) ||
    !!base.cover_photo ||
    !!base.profile_photo;
  if (!hasLegacy) return;

  const current = getPortfolioMedia(portfolioId);
  const merged = {
    photos: current.photos?.length ? current.photos : base.photos || [],
    cover_photo: current.cover_photo || base.cover_photo || "",
    profile_photo: current.profile_photo || base.profile_photo || "",
  };
  setPortfolioMedia(portfolioId, merged);

  const cleaned = { ...base };
  delete cleaned.photos;
  delete cleaned.cover_photo;
  delete cleaned.profile_photo;
  setPortfolioBase(cleaned);
}

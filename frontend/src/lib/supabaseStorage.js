import { getSupabase } from "./supabaseClient";

export const STORAGE_BUCKETS = {
  v0: "project-v0",
  portfolio: "portfolio-media",
};

function extFromMime(mime) {
  if (!mime) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

function parseDataUrl(dataUrl) {
  const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  const mime = m[1];
  const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  return { mime, bytes, ext: extFromMime(mime) };
}

/**
 * Upload a base64 data URL to Supabase Storage; returns public URL or null.
 */
export async function uploadDataUrl({ bucket, path, dataUrl }) {
  const sb = getSupabase();
  if (!sb || !dataUrl?.startsWith("data:")) return null;
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  const fullPath = path.includes(".") ? path : `${path}.${parsed.ext}`;
  const { error } = await sb.storage.from(bucket).upload(fullPath, parsed.bytes, {
    contentType: parsed.mime,
    upsert: true,
  });
  if (error) {
    console.warn("uploadDataUrl:", error.message);
    return null;
  }
  const { data } = sb.storage.from(bucket).getPublicUrl(fullPath);
  return data?.publicUrl || null;
}

/**
 * Fetch a remote image (e.g. Grok CDN) and re-upload to our bucket for durable storage.
 */
export async function uploadRemoteImage({ bucket, path, url }) {
  const sb = getSupabase();
  if (!sb || !url || String(url).startsWith("data:")) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const ext = extFromMime(blob.type);
    const fullPath = path.endsWith(`.${ext}`) ? path : `${path}.${ext}`;
    const { error } = await sb.storage.from(bucket).upload(fullPath, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: true,
    });
    if (error) {
      console.warn("uploadRemoteImage:", error.message);
      return null;
    }
    const { data } = sb.storage.from(bucket).getPublicUrl(fullPath);
    return data?.publicUrl || null;
  } catch (err) {
    console.warn("uploadRemoteImage fetch failed:", err?.message || err);
    return null;
  }
}

async function mirrorImageToStorage({ userId, projectId, img, folder, idx }) {
  if (!img) return img;
  const remote = img?.url;
  if (!remote) return img;
  if (remote.includes("/storage/v1/object/public/")) {
    return { ...img, stored_url: remote };
  }
  const base = `${userId}/${projectId}/${folder}-${idx}`;
  let stored = null;
  if (remote.startsWith("data:")) {
    stored = await uploadDataUrl({ bucket: STORAGE_BUCKETS.v0, path: base, dataUrl: remote });
  } else {
    stored = await uploadRemoteImage({ bucket: STORAGE_BUCKETS.v0, path: base, url: remote });
  }
  return {
    ...img,
    url: stored || remote,
    source_url: remote.startsWith("data:") ? undefined : remote,
    stored_url: stored,
  };
}

/** Mirror v0 concept images and floor plans to durable storage; returns updated bundle. */
export async function persistV0ImagesToStorage({ userId, projectId, imageBundle }) {
  if (!imageBundle || !userId || !projectId) return imageBundle;
  const images = imageBundle.images?.length
    ? await Promise.all(
        imageBundle.images.map((img, idx) =>
          mirrorImageToStorage({ userId, projectId, img, folder: "concept", idx })
        )
      )
    : imageBundle.images;
  const floorPlansRaw = imageBundle.floor_plans || imageBundle.floorPlans || [];
  const floor_plans = floorPlansRaw.length
    ? await Promise.all(
        floorPlansRaw.map((img, idx) =>
          mirrorImageToStorage({ userId, projectId, img, folder: "floor", idx })
        )
      )
    : floorPlansRaw;
  return {
    ...imageBundle,
    images,
    floor_plans,
    floorPlans: floor_plans,
    storage_mirrored: [...(images || []), ...floor_plans].some((i) => i?.stored_url),
  };
}

/** Upload portfolio photos/cover/profile; returns URL strings for DB. */
export async function uploadPortfolioMediaToStorage({ userId, portfolioId, media }) {
  if (!userId || !portfolioId) return media;
  const base = `${userId}/${portfolioId}`;
  const uploadOne = async (dataUrl, name) => {
    if (!dataUrl?.startsWith("data:")) return dataUrl || "";
    const url = await uploadDataUrl({
      bucket: STORAGE_BUCKETS.portfolio,
      path: `${base}/${name}`,
      dataUrl,
    });
    return url || dataUrl;
  };
  const photos = Array.isArray(media?.photos) ? media.photos : [];
  const storedPhotos = await Promise.all(
    photos.map((p, i) => uploadOne(p, `gallery-${i}`))
  );
  return {
    cover_photo: await uploadOne(media?.cover_photo, "cover"),
    profile_photo: await uploadOne(media?.profile_photo, "profile"),
    photos: storedPhotos.filter(Boolean),
  };
}

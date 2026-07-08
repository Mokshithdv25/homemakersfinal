import { uploadPortfolioMediaToStorage } from "./supabaseStorage";
import { getSupabase } from "./supabaseClient";

/** Upload local data-URL media to Storage and return durable URLs for the portfolios table. */
export async function syncPortfolioMediaForSave(portfolioId, media) {
  const sb = getSupabase();
  if (!sb) return media;
  const { data } = await sb.auth.getSession();
  const userId = data?.session?.user?.id || "anon";
  return uploadPortfolioMediaToStorage({ userId, portfolioId, media });
}

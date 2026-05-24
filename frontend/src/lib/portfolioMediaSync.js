import { uploadPortfolioMediaToStorage } from "./supabaseStorage";
import { getSupabase } from "./supabaseClient";

/** Upload local data-URL media to Storage; return URLs safe for portfolios table. */
export async function syncPortfolioMediaForSave(portfolioId, media) {
  const sb = getSupabase();
  if (!sb) return media;
  const { data } = await sb.auth.getSession();
  const userId = data?.session?.user?.id;
  if (!userId) return media;
  return uploadPortfolioMediaToStorage({ userId, portfolioId, media });
}

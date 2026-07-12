import { uploadPortfolioMediaToStorage } from "./supabaseStorage";
import { getSupabase } from "./supabaseClient";

/** Upload local data-URL media to Storage and return durable URLs for the portfolios table. */
export async function syncPortfolioMediaForSave(portfolioId, media) {
  const sb = getSupabase();
  if (!sb) throw new Error("Portfolio storage is not configured.");
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  const userId = data?.session?.user?.id;
  if (!userId) throw new Error("Sign in before uploading portfolio media.");
  return uploadPortfolioMediaToStorage({ userId, portfolioId, media });
}

/**
 * Root-absolute public URLs — works on nested routes (/build/new-home) and Vercel (homepage ".").
 */
export function publicAsset(filename) {
  const name = String(filename || "").replace(/^\//, "");
  const base = process.env.PUBLIC_URL || "";
  const prefix = !base || base === "." ? "" : base.replace(/\/$/, "");
  return `${prefix}/${name}`;
}

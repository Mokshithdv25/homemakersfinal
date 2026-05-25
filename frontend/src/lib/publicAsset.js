/**
 * Root-absolute public URLs for web (PUBLIC_URL empty). Capacitor builds use PUBLIC_URL=. via npm run build:mobile.
 */
export function publicAsset(filename) {
  const name = String(filename || "").replace(/^\//, "");
  const base = process.env.PUBLIC_URL || "";
  const prefix = !base || base === "." ? "" : base.replace(/\/$/, "");
  return `${prefix}/${name}`;
}

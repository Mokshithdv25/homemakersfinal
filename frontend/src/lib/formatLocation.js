/** Display city/location without appending a hardcoded state. */
export function formatLocationLabel(city) {
  const c = String(city || "").trim();
  if (!c) return "";
  return c;
}

/** Registered legal entity (Razorpay / payment gateway website verification). */
export const LEGAL_BUSINESS_NAME = (process.env.REACT_APP_LEGAL_BUSINESS_NAME || "").trim();

export const UDYAM_REGISTRATION = (process.env.REACT_APP_UDYAM_REGISTRATION || "").trim();

export const LEGAL_BUSINESS_ADDRESS = (process.env.REACT_APP_LEGAL_BUSINESS_ADDRESS || "").trim();

export const SUPPORT_EMAIL = "support@homemakers.online";

export const PUBLIC_WEB_ORIGIN =
  (process.env.REACT_APP_PUBLIC_WEB_URL || "https://www.homemakers.online").replace(/\/$/, "");

/** Footer line: brand + registered name when configured. */
export function legalEntityLine() {
  if (LEGAL_BUSINESS_NAME) {
    return `HomeMakers is a product of ${LEGAL_BUSINESS_NAME}.`;
  }
  return "HomeMakers · homemakers.online";
}

/** Short block for Terms / Pricing (MSME Udyam). */
export function legalEntityDetailsParagraph() {
  if (!LEGAL_BUSINESS_NAME) return null;
  const parts = [
    `${LEGAL_BUSINESS_NAME} is a proprietary enterprise registered under the MSME Udyam Registration system (India).`,
  ];
  if (UDYAM_REGISTRATION) {
    parts.push(`Udyam Registration Number: ${UDYAM_REGISTRATION}.`);
  }
  if (LEGAL_BUSINESS_ADDRESS) {
    parts.push(`Registered office: ${LEGAL_BUSINESS_ADDRESS}.`);
  }
  return parts.join(" ");
}

/** Local intent routing for Homi (pro dashboard) — works offline and as a
 * fallback when the AI backend is unavailable. Mirrors hubAssistantCommands
 * but is scoped to a professional's portfolio, leads, and studio workflow. */

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ");
}

const RESUME_PATH = "/craft";

/** Studio briefing shown when the assistant opens / on "latest". */
export function buildProBriefing(ctx = {}) {
  const name = ctx.firstName ? `${ctx.firstName}, ` : "";
  if (!ctx.published) {
    const pct = ctx.profileStrength ? ` You're **${ctx.profileStrength}%** there.` : "";
    return `${name}your portfolio isn't live yet.${pct} Finish it to get a public link and show up in the marketplace. Say **edit portfolio** to continue, or ask me to **write my bio**.`;
  }
  const lines = [];
  lines.push(`${name}your profile is **live**${ctx.profileStrength ? ` (${ctx.profileStrength}% complete)` : ""}.`);
  if (ctx.leadCount) lines.push(`You have **${ctx.leadCount}** open lead${ctx.leadCount === 1 ? "" : "s"} to review.`);
  lines.push("Say **share my link**, **preview as client**, **review leads**, or ask me to **write my bio** or **draft a client update**.");
  return lines.join(" ");
}

/** Compose a professional bio from portfolio fields — genuinely useful offline. */
export function draftProBio(ctx = {}) {
  const craft = (ctx.craftLabel || "building professional").toLowerCase();
  const who = ctx.businessName || ctx.firstName || "We";
  const isCompany = Boolean(ctx.businessName);
  const verb = isCompany ? "is" : "am";
  const subject = isCompany ? who : "I";
  const city = ctx.city ? ` based in ${ctx.city}` : "";
  const years = ctx.years ? ` with ${ctx.years}+ years of experience` : "";
  const specialties =
    Array.isArray(ctx.specialties) && ctx.specialties.length
      ? ` We specialise in ${ctx.specialties.slice(0, 3).join(", ")}.`
      : "";
  return [
    `${subject} ${verb} a trusted ${craft}${city}${years}.`,
    `From first concept to handover, ${isCompany ? who : "I"} focus${isCompany ? "es" : ""} on honest timelines, clear budgets, and craftsmanship that lasts.${specialties}`,
    `Browse the work below and reach out — let's build something you'll love coming home to.`,
  ].join(" ");
}

/** Draft a short client status update message. */
export function draftClientUpdate(ctx = {}) {
  const who = ctx.businessName || ctx.firstName || "the team";
  return [
    `Hi! Quick update from ${who}:`,
    `• Work is progressing on schedule this week.`,
    `• Next up: finalising selections and confirming the upcoming milestone.`,
    `• Action for you: review the shared board and approve pending items when you can.`,
    `Reply here with any questions — happy to jump on a quick call.`,
  ].join("\n");
}

export function parseProCommand(message, ctx = {}) {
  const t = normalize(message);
  if (!t) return null;

  if (/\b(preview|view profile|as (a )?client|see my profile)\b/.test(t)) {
    return { kind: "preview" };
  }
  if (/\b(copy( my)? link|share( my)? link|share|link)\b/.test(t)) {
    return { kind: "copyLink" };
  }
  if (/\b(edit|portfolio|profile setup|onboard|continue|finish)\b/.test(t)) {
    return { kind: "navigate", path: RESUME_PATH };
  }
  if (/\b(lead|leads|quote|quotes|bid|bids|proposal|proposals|rfq)\b/.test(t)) {
    return { kind: "navigate", path: "/browse" };
  }
  if (/\b(project|projects|hub|client dashboard|manage)\b/.test(t)) {
    return { kind: "navigate", path: "/project" };
  }
  if (/\b(shop|materials?|supplies)\b/.test(t)) {
    return { kind: "navigate", path: "/shop" };
  }
  if (/\b(bio|about|description|intro|write my)\b/.test(t)) {
    return { kind: "reply", text: `Here's a draft bio you can use — tweak and paste into your portfolio:\n\n${draftProBio(ctx)}` };
  }
  if (/\b(client update|status update|message|update my client)\b/.test(t)) {
    return { kind: "reply", text: `Here's a client update you can send:\n\n${draftClientUpdate(ctx)}` };
  }
  if (/\b(estimate|quote draft|takeoff|boq|costing)\b/.test(t)) {
    return {
      kind: "reply",
      text: "For a quick estimate: list each line item, its quantity, and a unit rate — I'll total it. Open the **project hub** to use the Estimate & Takeoff draft, or say **open project hub**.",
    };
  }
  if (/\b(latest|what'?s new|update|status|briefing|summary|today)\b/.test(t)) {
    return { kind: "reply", text: buildProBriefing(ctx) };
  }
  if (/\b(help|commands?|what can you)\b/.test(t)) {
    return {
      kind: "reply",
      text:
        "I can: **preview as client**, **share my link**, **edit portfolio**, **review leads**, **open project hub**, **write my bio**, or **draft a client update**.",
    };
  }
  return null;
}

export function localProAssistantReply(message, ctx = {}) {
  const cmd = parseProCommand(message, ctx);
  if (cmd?.kind === "reply") return { text: cmd.text, action: null };
  if (cmd?.kind === "preview") {
    return { text: "Opening your profile the way a client sees it.", action: { type: "preview" } };
  }
  if (cmd?.kind === "copyLink") {
    return ctx.published
      ? { text: "Copied your profile link to the clipboard — paste it anywhere.", action: { type: "copyLink" } }
      : { text: "Your profile isn't live yet — finish your portfolio first to get a shareable link.", action: null };
  }
  if (cmd?.kind === "navigate") {
    return { text: "Taking you there now.", action: { type: "path", path: cmd.path } };
  }
  return { text: buildProBriefing(ctx), action: null };
}

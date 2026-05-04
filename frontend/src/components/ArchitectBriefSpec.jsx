import React from "react";

const sectionTitle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#78716C",
  marginBottom: 10,
  marginTop: 0,
};

function Row({ label, children }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        padding: "8px 0",
        borderTop: "1px solid #EFE9E2",
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <span style={{ color: "#78716C", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#1C1917", textAlign: "right", maxWidth: "62%" }}>{children}</span>
    </div>
  );
}

/**
 * Human-readable project spec — same view for homeowner and architect (not a code dump).
 */
export function BuildNewHomeSpecView({ form, archResolved, budgetLabel }) {
  const lifestyle = Array.isArray(form.lifestyle) ? form.lifestyle.join(", ") : "—";
  const exterior = Array.isArray(form.exteriorPrefs) ? form.exteriorPrefs.join(", ") : "—";

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <section style={{ marginBottom: 20 }}>
        <h3 style={sectionTitle}>Site & plot</h3>
        <Row label="Location">{form.location || "—"}</Row>
        <Row label="Plot size">{form.dimW && form.dimL ? `${form.dimW} ft × ${form.dimL} ft` : "—"}</Row>
        <Row label="Facing">{form.facing || "—"}</Row>
        <Row label="Road access">{form.roadAccess || "—"}</Row>
        <Row label="Setting">{form.locationType || "—"}</Row>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h3 style={sectionTitle}>Household & spaces</h3>
        <Row label="Family size">{form.familyMembers || "—"} people</Row>
        <Row label="Lifestyle">{lifestyle}</Row>
        <Row label="Master bedrooms">{form.masterBedrooms ?? "—"}</Row>
        <Row label="Other bedrooms">{form.otherBedrooms ?? "—"}</Row>
        <Row label="Living / dining">{`${form.living ?? "—"} living · ${form.dining ?? "—"} dining`}</Row>
        <Row label="Kitchen">{`${form.kitchenCount ?? "—"} · ${form.kitchen ?? "—"}`}</Row>
        <Row label="Bathrooms">{`${form.commonBathrooms ?? "0"} common · ${form.attachedBathrooms ?? "—"} attached`}</Row>
        <Row label="Parking">{`${form.twoWheeler ?? "—"} two-wheel · ${form.fourWheeler ?? "—"} four-wheel · visitor ${form.visitorParking ?? "—"}`}</Row>
        <Row label="Other spaces">{`utility ${form.utility ?? "—"}, storage ${form.storageRooms ?? "—"}, maid ${form.maidRoom ?? "—"}, pooja ${form.poojaRoom ?? "—"}, balconies ${form.balconyCount ?? "—"}, garden ${form.gardenLawn ?? "—"}`}</Row>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h3 style={sectionTitle}>Massing & vastu</h3>
        <Row label="Floors">{form.floors || "—"}</Row>
        <Row label="Built-up target">{form.builtupPct ? `${form.builtupPct}%` : "—"}</Row>
        <Row label="Staircase">{form.staircase || "—"}</Row>
        <Row label="Lift">{form.lift || "—"}</Row>
        <Row label="Vastu">{form.vastu || "—"}</Row>
        <Row label="Overhead tank">{form.overheadTank || "—"}</Row>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h3 style={sectionTitle}>Look, materials & palette</h3>
        <Row label="Architectural style">{archResolved || "—"}</Row>
        <Row label="Finish tier">{form.finishTier || "—"}</Row>
        <Row label="Exterior preferences">{exterior}</Row>
        <Row label="Base colour">{form.colourBase || "—"}</Row>
        <Row label="Accent colour">{form.colourSecondary || "—"}</Row>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h3 style={sectionTitle}>Budget & timeline</h3>
        <Row label="Budget">{budgetLabel}</Row>
        <Row label="Start">{form.startTimeline || "—"}</Row>
        <Row label="Completion">{form.completionTime || "—"}</Row>
        <Row label="Payment mode">{form.paymentMode || "—"}</Row>
        <Row label="Extra notes">{form.budgetNotes?.trim() ? form.budgetNotes : "—"}</Row>
      </section>
    </div>
  );
}

/**
 * Remodel / renovation brief — same readable spec for customer + architect.
 */
export function RemodelSpecView({
  room,
  ptype,
  len,
  breadth,
  area,
  spaceNotes,
  mainGoal,
  painPoints,
  changeLevel,
  budgetLabel,
  budgetNotes,
  startTimeline,
  completionTime,
  layoutOk,
  mustKeep,
  dealbreakers3,
  styles,
  finishTier,
  colourBase,
  colourSecondary,
  postAiNotes,
  inspirationCount,
  photoCount,
}) {
  const pains = Array.isArray(painPoints) ? painPoints.join(", ") : "—";
  const must = Array.isArray(mustKeep) && mustKeep.length ? mustKeep.join(", ") : "—";
  const deal = Array.isArray(dealbreakers3) && dealbreakers3.length ? dealbreakers3.join(", ") : "—";
  const sty = Array.isArray(styles) ? styles.join(" + ") : "—";

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <section style={{ marginBottom: 20 }}>
        <h3 style={sectionTitle}>Space & property</h3>
        <Row label="Room / scope">{room || "—"}</Row>
        <Row label="Property type">{ptype || "—"}</Row>
        <Row label="Approx. size">{len && breadth ? `${len} ft × ${breadth} ft${area ? ` (${area} sq ft)` : ""}` : "—"}</Row>
        <Row label="Reference photos">{typeof photoCount === "number" ? `${photoCount} uploaded` : "—"}</Row>
        <Row label="Inspiration images">{typeof inspirationCount === "number" ? `${inspirationCount} references` : "—"}</Row>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h3 style={sectionTitle}>Goals & constraints</h3>
        <Row label="Main goal">{mainGoal || "—"}</Row>
        <Row label="Pain points">{pains}</Row>
        <Row label="Scope of change">{changeLevel || "—"}</Row>
        <Row label="Layout flexibility">{layoutOk || "—"}</Row>
        <Row label="Must keep">{must}</Row>
        <Row label="Deal-breakers">{deal}</Row>
        <Row label="Space notes">{spaceNotes?.trim() ? spaceNotes : "—"}</Row>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h3 style={sectionTitle}>Style & budget</h3>
        <Row label="Style direction">{sty}</Row>
        <Row label="Finish tier">{finishTier || "—"}</Row>
        <Row label="Palette">{`${colourBase || "—"} / ${colourSecondary || "—"}`}</Row>
        <Row label="Budget">{budgetLabel}</Row>
        <Row label="Budget notes">{budgetNotes?.trim() ? budgetNotes : "—"}</Row>
        <Row label="Start">{startTimeline || "—"}</Row>
        <Row label="Completion">{completionTime || "—"}</Row>
      </section>

      {postAiNotes?.trim() ? (
        <section style={{ marginBottom: 8 }}>
          <h3 style={sectionTitle}>Notes after AI concept</h3>
          <p style={{ fontSize: 13, color: "#44403C", lineHeight: 1.55, margin: 0 }}>{postAiNotes}</p>
        </section>
      ) : null}
    </div>
  );
}

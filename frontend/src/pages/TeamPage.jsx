import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectHubAppHeader, ProjectHubProjectCenter } from "../components/HmBrandLockup";
import {
  hmProjectHubPageBackground,
  hmProjectSidebarAsideStyle,
  hmProjectSidebarFooterStyle,
  hmProjectSidebarNavItemStyle,
  hmProjectSidebarNavScrollStyle,
  hmProjectSidebarProjectCardStyle,
} from "../lib/hmBrand";

const OR = "#C85F2B";

const NAV = [
  { icon: "⊞", label: "Overview", path: "/project" },
  { icon: "📅", label: "Timeline", path: "/project" },
  { icon: "✓", label: "Tasks", path: "/project" },
  { icon: "₹", label: "Budget", path: "/project" },
  { icon: "📸", label: "Site Feed", path: "/project" },
  { icon: "📄", label: "Documents", path: "/documents" },
  { icon: "🛒", label: "Marketplace", path: "/marketplace" },
  { icon: "👥", label: "Team", path: "/team", active: true },
  { icon: "⚙️", label: "Settings", path: "/project" },
];

const ROLE_ORDER = ["architect", "contractor", "engineer", "onsite", "electrician", "plumber", "carpenter"];

const ROLE_COPY = {
  architect: { icon: "📐", title: "Architect" },
  contractor: { icon: "🏗️", title: "Contractor" },
  engineer: { icon: "⚙️", title: "Engineer" },
  onsite: { icon: "👷", title: "On-site engineer" },
  electrician: { icon: "⚡", title: "Electrician" },
  plumber: { icon: "🔧", title: "Plumber" },
  carpenter: { icon: "🪚", title: "Carpenter" },
};

/** Site execution & design roles only (demo contacts). */
const SITE_TEAM = [
  {
    id: "t1",
    roleKey: "architect",
    name: "Neha Verma",
    org: "Verma & Associates",
    email: "neha.verma@vermaarch.in",
    phone: "+91 80 4123 8899",
    address: "100 Feet Road, Indiranagar, Bengaluru 560038",
    notes: "Drawings, approvals, site sign-offs",
  },
  {
    id: "t2",
    roleKey: "contractor",
    name: "Rajesh Kumar",
    org: "Kumar Civil Contractors",
    email: "rajesh@kumarbuild.in",
    phone: "+91 98450 22110",
    address: "Peenya Industrial Area, Bengaluru 560058",
    notes: "Overall execution & subcontractors",
  },
  {
    id: "t3",
    roleKey: "engineer",
    name: "Bharat Hegde",
    org: "Hegde Structural Studio",
    email: "bharat@hegdestruct.in",
    phone: "+91 80 2660 1200",
    address: "Jayanagar 4th Block, Bengaluru 560011",
    notes: "Structural design, RCC, beams, slabs",
  },
  {
    id: "t4",
    roleKey: "onsite",
    name: "Suresh Yadav",
    org: "Kumar Civil Contractors",
    email: "suresh.yadav@kumarbuild.in",
    phone: "+91 98800 44551",
    address: "Shanti Nagar site office, Bengaluru",
    notes: "On-site engineer — daily coordination, checks, records",
  },
  {
    id: "t5",
    roleKey: "electrician",
    name: "Arun Krishnan",
    org: "BrightGrid Electricals",
    email: "arun@brightgrid.in",
    phone: "+91 98451 90221",
    address: "HSR Layout, Bengaluru 560102",
    notes: "Power, DB, earthing, fixtures coordination",
  },
  {
    id: "t6",
    roleKey: "plumber",
    name: "Joseph Mathew",
    org: "FlowRight Plumbing",
    email: "joseph@flowright.in",
    phone: "+91 98452 11880",
    address: "Richmond Town, Bengaluru 560025",
    notes: "Water lines, drainage, sanitary install",
  },
  {
    id: "t7",
    roleKey: "carpenter",
    name: "Manjunath Gowda",
    org: "WoodCraft Interiors",
    email: "manjunath@woodcraft.in",
    phone: "+91 98453 66771",
    address: "Banashankari, Bengaluru 560050",
    notes: "Doors, frames, wardrobes, woodwork",
  },
];

const panel = {
  background: "linear-gradient(180deg, #FDFCFB 0%, #FAF9F7 100%)",
  borderRadius: 12,
  border: "1px solid #E8E6E3",
  boxShadow: "0 1px 2px rgba(28, 25, 23, 0.045)",
};

function Avatar({ name, size = 44 }) {
  const cols = [OR, "#2A6496", "#22A36B", "#7A4FC0", "#D97706"];
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: cols[name.charCodeAt(0) % cols.length],
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function copyText(text, showToast) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard"));
  } else {
    showToast("Copy not supported in this browser");
  }
}

export default function TeamPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const displayed = useMemo(() => {
    let list = SITE_TEAM;
    if (roleFilter !== "all") list = list.filter((c) => c.roleKey === roleFilter);
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          ROLE_COPY[c.roleKey].title.toLowerCase().includes(s) ||
          c.org.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s) ||
          c.phone.replace(/\s/g, "").includes(s.replace(/\s/g, ""))
      );
    }
    return [...list].sort(
      (a, b) => ROLE_ORDER.indexOf(a.roleKey) - ROLE_ORDER.indexOf(b.roleKey) || a.name.localeCompare(b.name)
    );
  }, [q, roleFilter]);

  const renderContactTable = (rows, empty) => (
    <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #E8E6E3", background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
        <thead>
          <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #EDEAE6" }}>
            {["Contact", "Role", "Email", "Phone", "Address", ""].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#9A8F87",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: 28, textAlign: "center", color: "#9A8F87", fontSize: 14 }}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #F5F0EB" }}>
                <td style={{ padding: "14px 14px", verticalAlign: "top" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={c.name} size={44} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#1C1917" }}>{c.name}</div>
                      {c.notes ? <div style={{ fontSize: 12, color: "#9A8F87", marginTop: 4, maxWidth: 220 }}>{c.notes}</div> : null}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 14px", verticalAlign: "top", fontSize: 14, color: "#44403C", maxWidth: 220 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{ROLE_COPY[c.roleKey].icon}</span>
                    <div>
                      <div style={{ fontWeight: 800 }}>{ROLE_COPY[c.roleKey].title}</div>
                      <div style={{ fontSize: 13, color: "#7A6E62", marginTop: 4 }}>{c.org}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 14px", verticalAlign: "top" }}>
                  <a href={`mailto:${c.email}`} style={{ color: OR, fontWeight: 600, fontSize: 14, wordBreak: "break-all" }}>
                    {c.email}
                  </a>
                </td>
                <td style={{ padding: "14px 14px", verticalAlign: "top", whiteSpace: "nowrap" }}>
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} style={{ color: "#1C1917", fontWeight: 600, fontSize: 14 }}>
                    {c.phone}
                  </a>
                </td>
                <td style={{ padding: "14px 14px", verticalAlign: "top", fontSize: 13, color: "#57534E", lineHeight: 1.45, maxWidth: 260 }}>
                  {c.address}
                </td>
                <td style={{ padding: "14px 10px", verticalAlign: "top", whiteSpace: "nowrap" }}>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nORG:${c.org}\nTITLE:${ROLE_COPY[c.roleKey].title}\nEMAIL:${c.email}\nTEL:${c.phone}\nADR:;;${c.address};;;;\nEND:VCARD`,
                        showToast
                      )
                    }
                    style={{
                      border: `1px solid ${OR}`,
                      background: "#fff",
                      color: OR,
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Copy vCard
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: hmProjectHubPageBackground,
        fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
        color: "#1C1917",
      }}
    >
      <ProjectHubAppHeader
        center={<ProjectHubProjectCenter />}
        trailing={
          <>
            <span style={{ fontSize: 18, cursor: "pointer", color: "#7A6E62" }}>🔔</span>
            <Avatar name="Ankit Sharma" size={32} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Hi, Ankit ∨</span>
          </>
        }
      />
      <div style={{ display: "flex", flex: 1, minWidth: 0, minHeight: 0 }}>
      <aside style={hmProjectSidebarAsideStyle}>
        <div style={{ padding: "14px 20px 8px", fontSize: 10, fontWeight: 700, color: "#9A8F87", letterSpacing: "0.08em" }}>PROJECTS</div>
        <div style={{ padding: "0 10px 8px" }}>
          <div style={hmProjectSidebarProjectCardStyle} onClick={() => navigate("/project")}>
            <div style={{ fontWeight: 700, fontSize: 13, color: OR }}>Shanti Nagar Residence</div>
            <div style={{ fontSize: 11, color: "#9A8F87" }}>Sharma Project</div>
          </div>
        </div>
        <nav style={hmProjectSidebarNavScrollStyle}>
          {NAV.map((n) => (
            <div
              key={n.label}
              role="button"
              tabIndex={0}
              onClick={() => navigate(n.path)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(n.path)}
              style={hmProjectSidebarNavItemStyle(!!n.active)}
            >
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              {n.label}
            </div>
          ))}
        </nav>
        <div style={hmProjectSidebarFooterStyle}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Need Help?</div>
          <div style={{ fontSize: 11, color: "#7A6E62", marginBottom: 10 }}>Chat with your project expert</div>
          <button type="button" style={{ width: "100%", background: OR, color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            💬 Start Chat
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="px-5 md:px-10" style={{ flex: 1, paddingTop: 24, paddingBottom: 40, overflowY: "auto" }}>
          {toast ? (
            <div role="status" style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, background: "#F0F8EE", border: "1px solid #C3DEB8", fontSize: 13, color: "#166534" }}>
              {toast}
            </div>
          ) : null}

          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Site team & contacts</h1>
            <p style={{ fontSize: 14, color: "#7A6E62", marginTop: 8, maxWidth: 720, lineHeight: 1.5 }}>
              Architect, contractor, engineer, on-site engineer, electrician, plumber, and carpenter — mail, phone, and address in one place. Tap{" "}
              <strong>mailto</strong> / <strong>tel</strong> on your phone, or <strong>Copy vCard</strong> to import into your contacts app.
            </p>
          </div>

          <div style={{ ...panel, padding: "14px 18px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: roleFilter === "all" ? `2px solid ${OR}` : "1.5px solid #D1C9BF",
                background: roleFilter === "all" ? "#FDF4EF" : "#fff",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                color: "#44403C",
              }}
            >
              All roles
            </button>
            {ROLE_ORDER.map((key) => {
              const r = ROLE_COPY[key];
              const on = roleFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRoleFilter(on ? "all" : key)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: on ? `2px solid ${OR}` : "1.5px solid #D1C9BF",
                    background: on ? "#FDF4EF" : "#fff",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    color: "#44403C",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{r.icon}</span>
                  {r.title}
                </button>
              );
            })}
          </div>

          <div style={{ ...panel, padding: "14px 18px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #D1C9BF", borderRadius: 10, padding: "10px 14px", flex: "1 1 240px", minWidth: 0, background: "#fff" }}>
              <span style={{ color: "#9A8F87" }}>🔍</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, company, email, phone…"
                style={{ border: "none", outline: "none", fontSize: 14, background: "transparent", flex: 1, minWidth: 0 }}
              />
            </div>
            <span style={{ fontSize: 13, color: "#9A8F87", fontWeight: 600 }}>{displayed.length} shown</span>
          </div>

          <section>
            {renderContactTable(displayed, "No contacts match your search or role filter.")}
          </section>
        </div>
      </div>
    </div>
    </div>
  );
}

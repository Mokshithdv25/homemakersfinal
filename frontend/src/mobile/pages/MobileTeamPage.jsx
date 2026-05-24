import React from "react";
import { Phone, Mail } from "lucide-react";
import MobileHeader from "../MobileHeader";

const TEAM = [
  { id: "t1", role: "Architect", name: "Neha Verma", org: "Verma & Associates", phone: "+91 80 4123 8899" },
  { id: "t2", role: "Contractor", name: "Rajesh Kumar", org: "Kumar Civil Contractors", phone: "+91 98450 22110" },
  { id: "t3", role: "On-site engineer", name: "Suresh Yadav", org: "Site office", phone: "+91 98800 44551" },
  { id: "t4", role: "Electrician", name: "Arun Krishnan", org: "BrightGrid Electricals", phone: "+91 98451 90221" },
];

export default function MobileTeamPage() {
  return (
    <>
      <MobileHeader title="Team" subtitle="Site & design contacts" backTo="/project" />
      <div style={{ padding: "8px 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        {TEAM.map((m) => (
          <div key={m.id} className="hm-m-card">
            <div style={{ fontSize: 12, fontWeight: 700, color: "#C85F2B", marginBottom: 4 }}>{m.role}</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{m.name}</div>
            <div style={{ fontSize: 13, color: "#78716C", marginTop: 4 }}>{m.org}</div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="hm-m-contact-link">
                <Phone size={16} /> Call
              </a>
              <span className="hm-m-contact-link muted">
                <Mail size={16} /> Message
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

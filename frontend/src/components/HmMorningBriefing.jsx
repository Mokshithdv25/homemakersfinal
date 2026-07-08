import React, { useMemo } from "react";
import HmHomiMascot from "./HmHomiMascot";
import {
  buildHubAgenda,
  buildHubBadges,
  buildSuggestedActions,
  briefingToSpeech,
  formatBriefingDate,
  getTimeGreeting,
} from "../lib/hubBriefing";
import { buildLatestBriefing } from "../lib/hubAssistantCommands";
import { dispatchHomiCommand } from "./HmCommandCenter";
import "./HmMorningBriefing.css";

function renderInlineBold(text) {
  const parts = String(text || "").split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

export default function HmMorningBriefing({ context, pendingTasks = [], onNavigatePath }) {
  const ctx = useMemo(() => context || {}, [context]);
  const firstName = ctx.userFirstName || "there";
  const badges = useMemo(() => buildHubBadges(ctx, { pendingTasks: pendingTasks.length }), [ctx, pendingTasks.length]);
  const agenda = useMemo(
    () => buildHubAgenda(ctx, { pendingTasks, selectedPhase: ctx.activePhase }),
    [ctx, pendingTasks],
  );
  const suggested = useMemo(() => buildSuggestedActions(ctx), [ctx]);

  const playBriefing = () => {
    const text = buildLatestBriefing(ctx);
    dispatchHomiCommand("latest");
    window.dispatchEvent(new CustomEvent("hm-open-assistant"));
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(briefingToSpeech(text));
      u.rate = 0.95;
      u.lang = "en-IN";
      window.speechSynthesis.speak(u);
    }
  };

  const onAction = (action) => {
    if (action.path) onNavigatePath?.(action.path);
    dispatchHomiCommand(action.message);
    window.dispatchEvent(new CustomEvent("hm-open-assistant"));
  };

  return (
    <div className="hm-morning-brief">
      <div className="hm-morning-brief__hero">
        <div className="hm-morning-brief__hero-row">
          <div className="hm-morning-brief__mascots">
            {[0, 1, 2, 3, 4].map((i) => (
              <HmHomiMascot key={i} size={i === 2 ? 56 : 44} variant="hero" />
            ))}
          </div>
          <p className="hm-morning-brief__tagline">
            The agentic AI operating system for your home build — design, quotes, site, and budget in one hub.
          </p>
        </div>
      </div>

      <div className="hm-morning-brief__card">
        <div className="hm-morning-brief__eyebrow">✨ Morning briefing · {formatBriefingDate()}</div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <h1 className="hm-morning-brief__greeting">
              {getTimeGreeting()}, {firstName} 👋
            </h1>
            <p className="hm-morning-brief__sub">Tap play and Homi will walk you through what matters on your project today.</p>
          </div>
          <button type="button" className="hm-morning-brief__play" onClick={playBriefing}>
            🔊 Play briefing
          </button>
        </div>

        <div className="hm-morning-brief__badges">
          {badges.map((b) => (
            <span key={`${b.label}-${b.value}`} className={`hm-morning-brief__badge hm-morning-brief__badge--${b.tone}`}>
              {b.value} {b.label}
            </span>
          ))}
        </div>

        <p className="hm-morning-brief__agenda">{renderInlineBold(agenda)}</p>

        <div className="hm-morning-brief__actions">
          {suggested.map((a) => (
            <button key={a.label} type="button" className="hm-morning-brief__action" onClick={() => onAction(a)}>
              <span aria-hidden>✨</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

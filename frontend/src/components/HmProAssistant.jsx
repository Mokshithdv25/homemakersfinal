import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { askProAssistant } from "../lib/proAssistantApi";
import { buildProBriefing } from "../lib/proAssistantCommands";
import "./HmProjectAssistant.css";

function renderBold(text) {
  return String(text || "")
    .split("\n")
    .map((line, li) => {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <React.Fragment key={li}>
          {li > 0 ? <br /> : null}
          {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
        </React.Fragment>
      );
    });
}

const QUICK_PROMPTS = [
  { label: "Daily briefing", message: "latest" },
  { label: "Leads needing attention", message: "Which homeowner leads need my attention today?" },
  { label: "Active work", message: "Summarize my active projects" },
  { label: "Draft follow-up", message: "draft a client update" },
];

/**
 * Homi assistant for the professional dashboard. Floating chat that answers
 * portfolio/leads questions, drafts bios & client updates, and runs actions
 * (preview profile, copy link, navigate) via callbacks.
 */
export default function HmProAssistant({ context, onNavigatePath, onPreview, onCopyLink }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      role: "homi",
      text: "Hi! I'm **Homi**, your studio copilot. Ask for a **daily briefing**, ask which **homeowner leads need attention**, review **active work**, or draft an approval-ready client follow-up.",
    },
  ]);
  const scrollRef = useRef(null);
  const ctx = useMemo(() => context || {}, [context]);
  const initialBriefing = useMemo(() => buildProBriefing(ctx), [ctx]);

  const applyAction = useCallback(
    (action) => {
      if (!action) return;
      if (action.type === "path" && action.path) onNavigatePath?.(action.path);
      if (action.type === "preview") onPreview?.();
      if (action.type === "copyLink") onCopyLink?.();
    },
    [onNavigatePath, onPreview, onCopyLink],
  );

  const sendMessage = useCallback(
    async (raw) => {
      const text = String(raw || "").trim();
      if (!text || busy) return;
      setInput("");
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
      setBusy(true);
      setMessages((prev) => [...prev, { id: "typing", role: "homi", text: "Homi is thinking…", typing: true }]);
      try {
        const result = await askProAssistant({ message: text, context: ctx });
        applyAction(result.action);
        setMessages((prev) => {
          const withoutTyping = prev.filter((m) => m.id !== "typing");
          return [...withoutTyping, { id: `h-${Date.now()}`, role: "homi", text: result.text, source: result.source }];
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, ctx, applyAction],
  );

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onSend = (e) => {
      const msg = e?.detail?.message;
      if (msg) {
        setOpen(true);
        sendMessage(msg);
      }
    };
    window.addEventListener("hm-open-assistant", onOpen);
    window.addEventListener("hm-assistant-send", onSend);
    return () => {
      window.removeEventListener("hm-open-assistant", onOpen);
      window.removeEventListener("hm-assistant-send", onSend);
    };
  }, [sendMessage]);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, busy]);

  useEffect(() => {
    if (!open) return;
    setMessages((prev) => (prev.length > 1 ? prev : [{ id: "welcome", role: "homi", text: initialBriefing }]));
  }, [open, initialBriefing]);

  return (
    <>
      {open ? (
        <div className="hm-assistant-panel" role="dialog" aria-label="Homi pro assistant">
          <div className="hm-assistant-head">
            <div className="hm-assistant-avatar" aria-hidden>🛠️</div>
            <div>
              <h3>Homi</h3>
              <p>Lead and active-work Q&amp;A</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              style={{ marginLeft: "auto", border: "none", background: "transparent", fontSize: 20, cursor: "pointer", color: "#78716C", lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          <div className="hm-assistant-chips">
            {QUICK_PROMPTS.map((q) => (
              <button key={q.label} type="button" className="hm-assistant-chip" onClick={() => sendMessage(q.message)} disabled={busy}>
                {q.label}
              </button>
            ))}
          </div>
          <div className="hm-assistant-msgs" ref={scrollRef}>
            {messages.map((m) => (
              <div key={m.id} className={`hm-assistant-bubble ${m.role === "user" ? "user" : "homi"}${m.typing ? " typing" : ""}`}>
                {renderBold(m.text)}
              </div>
            ))}
          </div>
          <form
            className="hm-assistant-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Homi or give a command…"
              disabled={busy}
              aria-label="Message Homi"
            />
            <button type="submit" className="hm-assistant-send" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      ) : null}
      <button
        type="button"
        className={`hm-assistant-fab${open ? " open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close Homi assistant" : "Open Homi assistant"}
        title="Homi — studio copilot"
      >
        {open ? "×" : "✨"}
      </button>
    </>
  );
}

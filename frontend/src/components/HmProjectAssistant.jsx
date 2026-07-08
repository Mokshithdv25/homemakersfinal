import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { askHubAssistant } from "../lib/hubAssistantApi";
import { buildLatestBriefing } from "../lib/hubAssistantCommands";
import "./HmProjectAssistant.css";

function renderBold(text) {
  const parts = String(text || "").split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

const QUICK_PROMPTS = [
  { label: "What's new?", message: "latest" },
  { label: "Tasks", message: "tasks" },
  { label: "Budget", message: "budget" },
  { label: "Design journey", message: "design journey" },
];

export default function HmProjectAssistant({
  context,
  onNavTab,
  onNavigatePath,
  onAddTask,
  defaultPhase = "Structure",
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      role: "homi",
      text: "Hi! I'm **Homi** — your agentic project buddy. Ask for a **latest** briefing, say **tasks** or **budget**, or tell me **add task** _order tile samples_.",
    },
  ]);
  const scrollRef = useRef(null);

  const ctx = useMemo(() => context || {}, [context]);
  const initialBriefing = useMemo(() => buildLatestBriefing(ctx), [ctx]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("hm-open-assistant", onOpen);
    return () => window.removeEventListener("hm-open-assistant", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, busy]);

  const applyAction = useCallback(
    (action) => {
      if (!action) return;
      if (action.type === "nav" && action.nav) onNavTab?.(action.nav);
      if (action.type === "path" && action.path) onNavigatePath?.(action.path);
      if (action.type === "addTask" && action.title) onAddTask?.(action.title, defaultPhase);
    },
    [onNavTab, onNavigatePath, onAddTask, defaultPhase],
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
        const result = await askHubAssistant({ message: text, context: ctx });
        applyAction(result.action);
        setMessages((prev) => {
          const withoutTyping = prev.filter((m) => m.id !== "typing");
          return [
            ...withoutTyping,
            {
              id: `h-${Date.now()}`,
              role: "homi",
              text: result.text,
              source: result.source,
            },
          ];
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, ctx, applyAction],
  );

  useEffect(() => {
    const onSend = (e) => {
      const msg = e?.detail?.message;
      if (msg) {
        setOpen(true);
        sendMessage(msg);
      }
    };
    window.addEventListener("hm-assistant-send", onSend);
    return () => window.removeEventListener("hm-assistant-send", onSend);
  }, [sendMessage]);

  useEffect(() => {
    if (!open) return;
    setMessages((prev) => {
      if (prev.length > 1) return prev;
      return [
        {
          id: "welcome",
          role: "homi",
          text: initialBriefing,
        },
      ];
    });
  }, [open, initialBriefing]);

  return (
    <>
      {open ? (
        <div className="hm-assistant-panel" role="dialog" aria-label="Homi project assistant">
          <div className="hm-assistant-head">
            <div className="hm-assistant-avatar" aria-hidden>
              🏡
            </div>
            <div>
              <h3>Homi</h3>
              <p>Agentic project co-pilot</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              style={{
                marginLeft: "auto",
                border: "none",
                background: "transparent",
                fontSize: 20,
                cursor: "pointer",
                color: "#78716C",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <div className="hm-assistant-chips">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.label}
                type="button"
                className="hm-assistant-chip"
                onClick={() => sendMessage(q.message)}
                disabled={busy}
              >
                {q.label}
              </button>
            ))}
            {!ctx.signedIn ? (
              <button
                type="button"
                className="hm-assistant-chip"
                onClick={() => onNavigatePath?.(ctx.signInPath)}
              >
                Sign in
              </button>
            ) : null}
          </div>
          <div className="hm-assistant-msgs" ref={scrollRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`hm-assistant-bubble ${m.role === "user" ? "user" : "homi"}${m.typing ? " typing" : ""}`}
              >
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
        title="Homi — project assistant"
      >
        {open ? "×" : "✨"}
      </button>
    </>
  );
}

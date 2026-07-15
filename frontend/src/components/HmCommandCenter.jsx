import React, { useState } from "react";
import HmHomiMascot from "./HmHomiMascot";
import { COMMAND_CENTER_TRY_PROMPTS } from "../lib/hubBriefing";
import "./HmCommandCenter.css";

export function dispatchHomiCommand(message) {
  if (!String(message || "").trim()) return;
  window.dispatchEvent(new CustomEvent("hm-assistant-send", { detail: { message: String(message).trim() } }));
}

export default function HmCommandCenter({
  tryPrompts = COMMAND_CENTER_TRY_PROMPTS,
  busy = false,
  title = "Project Q&A command center",
  status = "Grounded in the active project's saved artifacts",
  placeholder = "Ask about scope, tasks, documents, materials, budget, or today's priorities",
}) {
  const [input, setInput] = useState("");

  const submit = (text) => {
    const msg = String(text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    dispatchHomiCommand(msg);
  };

  const onMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      dispatchHomiCommand("help");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const said = e.results?.[0]?.[0]?.transcript;
      if (said) submit(said);
    };
    rec.start();
  };

  return (
    <section className="hm-command-center" aria-label="Homi AI command center">
      <div className="hm-command-center__head">
        <HmHomiMascot size={52} variant="hero" />
        <div>
          <h2 className="hm-command-center__title">{title}</h2>
          <div className="hm-command-center__status">
            <span className="hm-command-center__dot" />
            {status}
          </div>
        </div>
      </div>
      <form
        className="hm-command-center__form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="hm-command-center__input-wrap">
          <input
            className="hm-command-center__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={busy}
            aria-label="Command for Homi"
          />
        </div>
        <div className="hm-command-center__actions">
          <button type="button" className="hm-command-center__mic" onClick={onMic} aria-label="Voice command" title="Voice (where supported)">
            🎤
          </button>
          <button type="submit" className="hm-command-center__send" disabled={busy || !input.trim()} aria-label="Send command">
            ➤
          </button>
        </div>
      </form>
      <div className="hm-command-center__try">
        <span className="hm-command-center__try-label">✨ Try:</span>
        {tryPrompts.map((p) => (
          <button key={p.label} type="button" className="hm-command-center__pill" onClick={() => submit(p.message)} disabled={busy}>
            {p.label}
          </button>
        ))}
      </div>
    </section>
  );
}

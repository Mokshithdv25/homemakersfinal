import axios from "axios";
import { localProAssistantReply } from "./proAssistantCommands";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const isDev = process.env.NODE_ENV === "development";
const normalizedBackendUrl =
  BACKEND_URL && !String(BACKEND_URL).includes("undefined")
    ? BACKEND_URL.replace(/\/$/, "")
    : "";

const apiBase = normalizedBackendUrl ? `${normalizedBackendUrl}/api` : isDev ? "/api" : null;

const client = apiBase ? axios.create({ baseURL: apiBase, timeout: 45000 }) : null;

/**
 * Ask Homi (pro dashboard). Tries the shared AI backend with a pro role hint,
 * and falls back to fully local intent routing so it always responds.
 * @param {{ message: string, context: Record<string, unknown> }} payload
 * @returns {Promise<{ text: string, action: object|null, source?: string }>}
 */
export async function askProAssistant(payload) {
  const { message, context } = payload;
  const local = localProAssistantReply(message, context);

  if (!client) return { ...local, source: "local" };

  try {
    const { data } = await client.post("/ai/hub-assistant", {
      message,
      context: { ...context, role: "pro", surface: "pro-dashboard" },
    });
    const text = String(data?.reply || data?.text || "").trim();
    if (text) {
      return { text, action: data?.action || local.action || null, source: data?.source || "ai" };
    }
  } catch (_) {
    /* fall through to local */
  }
  return { ...local, source: "local" };
}

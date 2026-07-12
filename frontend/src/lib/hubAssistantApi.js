import axios from "axios";
import { localHubAssistantReply } from "./hubAssistantCommands";
import { withBackendAuth } from "./backendAuth";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const isDev = process.env.NODE_ENV === "development";
const normalizedBackendUrl =
  BACKEND_URL && !String(BACKEND_URL).includes("undefined")
    ? BACKEND_URL.replace(/\/$/, "")
    : "";

const apiBase = normalizedBackendUrl
  ? `${normalizedBackendUrl}/api`
  : isDev
    ? "/api"
    : null;

const client = apiBase
  ? axios.create({
      baseURL: apiBase,
      timeout: 45000,
    })
  : null;

/**
 * @param {{ message: string, context: Record<string, unknown> }} payload
 * @returns {Promise<{ text: string, action: object|null, source?: string }>}
 */
export async function askHubAssistant(payload) {
  const { message, context } = payload;
  const local = localHubAssistantReply(message, context);

  if (!client) {
    return { ...local, source: "local" };
  }

  try {
    const { data } = await client.post(
      "/ai/hub-assistant",
      { message, context },
      await withBackendAuth(),
    );
    const text = String(data?.reply || data?.text || "").trim();
    if (text) {
      return {
        text,
        action: data?.action || null,
        source: data?.source || "ai",
      };
    }
  } catch (_) {
    /* fall through */
  }

  return { ...local, source: "local" };
}

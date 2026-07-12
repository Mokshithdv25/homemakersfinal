import axios from "axios";
import { withBackendAuth } from "./backendAuth";

const raw = process.env.REACT_APP_BACKEND_URL || "";
const base = raw && !String(raw).includes("undefined") ? `${raw.replace(/\/$/, "")}/api` : process.env.NODE_ENV === "development" ? "/api" : null;

export async function deleteMyAccount() {
  if (!base) throw new Error("Account deletion is not configured on this deployment.");
  const client = axios.create({ baseURL: base, timeout: 60000 });
  const { data } = await client.delete("/account", await withBackendAuth());
  return data;
}

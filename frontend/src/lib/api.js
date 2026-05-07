import axios from "axios";

const rawBackendUrl = process.env.REACT_APP_BACKEND_URL || "";
const normalizedBackendUrl =
  rawBackendUrl && !String(rawBackendUrl).includes("undefined")
    ? rawBackendUrl.replace(/\/$/, "")
    : "";
export const API = normalizedBackendUrl ? `${normalizedBackendUrl}/api` : "/api";

export const api = axios.create({ baseURL: API });

export const createPortfolio = (craft) =>
  api.post("/portfolio", { craft }).then((r) => r.data);

export const getPortfolio = (id) =>
  api.get(`/portfolio/${id}`).then((r) => r.data);

export const updatePortfolio = (id, patch) =>
  api.patch(`/portfolio/${id}`, patch).then((r) => r.data);

export const publishPortfolio = (id) =>
  api.post(`/portfolio/${id}/publish`).then((r) => r.data);

export const getPublicProfile = (slug) =>
  api.get(`/profile/${slug}`).then((r) => r.data);

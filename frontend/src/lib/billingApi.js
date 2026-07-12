import axios from "axios";
import { withBackendAuth } from "./backendAuth";

const rawBackendUrl = process.env.REACT_APP_BACKEND_URL || "";
const normalizedBackendUrl =
  rawBackendUrl && !String(rawBackendUrl).includes("undefined")
    ? rawBackendUrl.replace(/\/$/, "")
    : "";
const isDev = process.env.NODE_ENV === "development";
const apiBase = normalizedBackendUrl ? `${normalizedBackendUrl}/api` : isDev ? "/api" : null;
const billingClient = apiBase
  ? axios.create({ baseURL: apiBase, timeout: 45000 })
  : null;

let checkoutScriptPromise = null;

function requireBillingClient() {
  if (!billingClient) {
    throw new Error("Payment service is not configured on this deployment.");
  }
  return billingClient;
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;
  checkoutScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load secure checkout.")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load secure checkout."));
    document.body.appendChild(script);
  });
  return checkoutScriptPromise;
}

export async function fetchBillingSummary() {
  const client = requireBillingClient();
  const { data } = await client.get("/billing/me", await withBackendAuth());
  return data;
}

export async function purchasePlan(planId, profile = {}) {
  const client = requireBillingClient();
  const { data: order } = await client.post(
    "/billing/order",
    { plan_id: planId },
    await withBackendAuth(),
  );
  await loadRazorpayCheckout();

  return new Promise((resolve, reject) => {
    let completed = false;
    const checkout = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: "HomeMakers",
      description: order.description,
      order_id: order.order_id,
      prefill: {
        name: profile.name || "",
        email: profile.email || "",
        contact: profile.phone || "",
      },
      theme: { color: "#C85F2B" },
      handler: async (response) => {
        try {
          const { data } = await client.post(
            "/billing/verify",
            response,
            await withBackendAuth(),
          );
          completed = true;
          resolve(data);
        } catch (error) {
          completed = true;
          reject(error);
        }
      },
      modal: {
        ondismiss: () => {
          if (!completed) reject(new Error("Checkout was closed before payment completed."));
        },
      },
    });
    checkout.on("payment.failed", (response) => {
      completed = true;
      reject(new Error(response?.error?.description || "Payment failed. No plan was activated."));
    });
    checkout.open();
  });
}

export function billingErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  return detail || error?.message || "Payment could not be completed. Please try again.";
}

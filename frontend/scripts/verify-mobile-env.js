const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const values = { ...process.env };

function parseEnvFile(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || Object.prototype.hasOwnProperty.call(values, match[1])) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
}

// CRA precedence for production builds: local overrides first, then shared defaults.
[".env.production.local", ".env.local", ".env.production", ".env"].forEach(parseEnvFile);

const errors = [];

function requireHttps(name, { supabase = false } = {}) {
  const raw = String(values[name] || "").trim();
  if (!raw) {
    errors.push(`${name} is missing`);
    return null;
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") errors.push(`${name} must use https`);
    if (["localhost", "127.0.0.1"].includes(url.hostname)) {
      errors.push(`${name} must not point to localhost in a native release`);
    }
    if (supabase && !url.hostname.endsWith(".supabase.co")) {
      errors.push(`${name} must be a Supabase project URL`);
    }
    return url;
  } catch {
    errors.push(`${name} is not a valid URL`);
    return null;
  }
}

const backend = requireHttps("REACT_APP_BACKEND_URL");
const publicWeb = requireHttps("REACT_APP_PUBLIC_WEB_URL");
const supabaseUrl = requireHttps("REACT_APP_SUPABASE_URL", { supabase: true });
const anonKey = String(values.REACT_APP_SUPABASE_ANON_KEY || "").trim();

for (const [name, value] of Object.entries(values)) {
  if (name.startsWith("REACT_APP_") && /(SERVICE.?ROLE|SECRET)/i.test(name) && String(value || "").trim()) {
    errors.push(`${name} must never be exposed to a client build`);
  }
}

if (!anonKey) {
  errors.push("REACT_APP_SUPABASE_ANON_KEY is missing");
} else if (/^sb_secret_/i.test(anonKey)) {
  errors.push("REACT_APP_SUPABASE_ANON_KEY is a Supabase secret key; use a publishable/anon key");
} else if (/service[_-]?role/i.test(anonKey)) {
  errors.push("REACT_APP_SUPABASE_ANON_KEY must never contain a service-role key");
} else if (anonKey.split(".").length === 3) {
  try {
    const payload = JSON.parse(Buffer.from(anonKey.split(".")[1], "base64url").toString("utf8"));
    if (payload.role === "service_role") {
      errors.push("REACT_APP_SUPABASE_ANON_KEY is a service-role JWT; use the anon key");
    }
  } catch {
    errors.push("REACT_APP_SUPABASE_ANON_KEY is not a valid publishable/anon key");
  }
}

if (errors.length) {
  process.stderr.write(`Native release environment is invalid:\n- ${errors.join("\n- ")}\n`);
  process.stderr.write("Set public Supabase values in frontend/.env.production.local or the deploy dashboard and retry.\n");
  process.exit(1);
}

process.stdout.write(
  `Client release environment OK (API ${backend.host}, web ${publicWeb.host}, auth ${supabaseUrl.host}).\n`,
);

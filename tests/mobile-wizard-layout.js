/**
 * Mobile viewport layout checks for /build/new-home and /build/remodel.
 * Run: node tests/mobile-wizard-layout.js [baseUrl]
 * Default baseUrl: http://localhost:3000
 */
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://localhost:3000";
const VIEWPORT = { width: 390, height: 844 };

async function assertWizardLayout(page, path, label) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector(".hm-wizard-main", { timeout: 30000 });

  const visibleAsides = await page.locator(".hm-wizard-layout > aside").evaluateAll((nodes) =>
    nodes.filter((n) => {
      const s = window.getComputedStyle(n);
      return s.display !== "none" && s.visibility !== "hidden";
    }).length,
  );

  if (visibleAsides > 0) {
    throw new Error(`${label}: expected 0 visible side asides on mobile, got ${visibleAsides}`);
  }

  const barVisible = await page.locator(".hm-wizard-mobile-bar").isVisible();
  if (!barVisible) {
    throw new Error(`${label}: mobile step bar should be visible`);
  }

  const mainBox = await page.locator(".hm-wizard-main").boundingBox();
  if (!mainBox || mainBox.width < 300) {
    throw new Error(`${label}: main column too narrow (${mainBox?.width})`);
  }

  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 8);
  if (overflowX) {
    throw new Error(`${label}: horizontal page overflow detected`);
  }

  console.log(`OK ${label} — main width ${Math.round(mainBox.width)}px, step bar visible`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  try {
    await assertWizardLayout(page, "/build/new-home", "New home wizard");
    await assertWizardLayout(page, "/build/remodel", "Remodel wizard");
    console.log("\nAll mobile wizard layout checks passed.");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

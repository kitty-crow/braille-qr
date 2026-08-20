import { join, normalize } from "node:path";
import { chromium, webkit, type BrowserType, type BrowserContextOptions } from "playwright";

const root = join(import.meta.dir, "..", "..");
const dist = join(root, "site", "dist");
const mount = "/unicode-qr-studio/";

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(request) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(mount)) return new Response("Not found", { status: 404 });

    let rel = decodeURIComponent(url.pathname.slice(mount.length));
    if (!rel || rel.endsWith("/")) rel += "index.html";
    const safe = normalize(rel).replace(/^\.\.(?:\/|\\)/u, "");
    const file = Bun.file(join(dist, safe));
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    return new Response(file);
  },
});

const pageUrl = `http://127.0.0.1:${server.port}${mount}`;

async function exercise(
  name: string,
  browserType: BrowserType,
  contextOptions: BrowserContextOptions,
): Promise<void> {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const runtimeErrors: string[] = [];

  page.on("pageerror", error => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });

  try {
    await page.goto(pageUrl, { waitUntil: "domcontentloaded" });

    await page.locator("[data-mini] .mini-grid .mini-cell").first().waitFor({ state: "attached" });
    await page.locator("[data-preview] .qr-grid .qr-cell").first().waitFor({ state: "attached" });

    const text = page.locator("[data-text]");
    if (await text.inputValue() !== "https://kittycrow.dev") {
      throw new Error(`${name}: default generator payload was not initialised.`);
    }

    const heroCells = await page.locator("[data-mini] .mini-cell").count();
    const initialCells = await page.locator("[data-preview] .qr-cell").count();
    if (heroCells === 0 || initialCells === 0) {
      throw new Error(`${name}: initial hero or generator QR is empty.`);
    }

    const preview = page.locator("[data-preview]");
    if (await preview.isHidden()) throw new Error(`${name}: initial generator QR is hidden.`);

    for (const selector of ["[data-copy]", "[data-download-text]", "[data-copy-embed]", "[data-download-html]"]) {
      if (await page.locator(selector).isDisabled()) {
        throw new Error(`${name}: ${selector} stayed disabled after initial generation.`);
      }
    }

    const initialQr = await page.locator("[data-preview] .qr-grid").textContent() ?? "";
    const changedPayload = "https://example.test/unicode-qr-studio/browser-interaction-check?value=42";
    await text.fill(changedPayload);
    await page.waitForFunction(
      ({ selector, before }) => document.querySelector(selector)?.textContent !== before,
      { selector: "[data-preview] .qr-grid", before: initialQr },
    );

    if (await text.inputValue() !== changedPayload) {
      throw new Error(`${name}: textarea edit did not persist.`);
    }

    const changedQr = await page.locator("[data-preview] .qr-grid").textContent() ?? "";
    if (!changedQr || changedQr === initialQr) {
      throw new Error(`${name}: editing the payload did not regenerate the QR.`);
    }

    const metrics = await page.locator("[data-metrics]").innerText();
    if (!metrics.includes(`${changedPayload.length} chars`) || !metrics.includes("Unicode cells")) {
      throw new Error(`${name}: metrics did not update with the edited payload.`);
    }

    const beforeScale = await page.locator("[data-preview] .qr-grid").textContent() ?? "";
    await page.locator("[data-scale]").selectOption("4");
    await page.waitForFunction(
      ({ selector, before }) => document.querySelector(selector)?.textContent !== before,
      { selector: "[data-preview] .qr-grid", before: beforeScale },
    );

    const tokenButton = page.locator("[data-token]");
    await tokenButton.click();
    await page.waitForFunction(() => /^[0-9A-F]{128}$/u.test((document.querySelector("[data-text]") as HTMLTextAreaElement | null)?.value ?? ""));

    const compactTab = page.locator('[data-embed-mode="compact"]');
    const staticTab = page.locator('[data-embed-mode="static"]');
    await compactTab.waitFor({ state: "visible" });
    await page.locator("[data-embed-view] pre code").first().waitFor({ state: "attached" });

    await page.waitForFunction(() => Boolean(document.querySelector("[data-embed-view] .hljs")), undefined, { timeout: 15_000 });
    if (await page.locator("[data-embed-view] .hljs-tag, [data-embed-view] .hljs-name, [data-embed-view] .hljs-attr").count() === 0) {
      throw new Error(`${name}: HTML code was not token-coloured by highlight.js.`);
    }

    await staticTab.click();
    if (await staticTab.getAttribute("aria-selected") !== "true") {
      throw new Error(`${name}: static embed tab did not become selected.`);
    }
    await page.locator("[data-embed-view] pre code").first().waitFor({ state: "attached" });

    await compactTab.click();
    if (await compactTab.getAttribute("aria-selected") !== "true") {
      throw new Error(`${name}: compact embed tab did not become selected again.`);
    }

    if (runtimeErrors.length) {
      throw new Error(`${name}: browser runtime errors:\n${runtimeErrors.join("\n")}`);
    }

    console.log(`${name}: generator and embed interactions passed`);
  } finally {
    await context.close();
    await browser.close();
  }
}

try {
  await exercise("Chromium", chromium, {
    viewport: { width: 1280, height: 900 },
  });

  await exercise("WebKit mobile", webkit, {
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });
} finally {
  server.stop(true);
}

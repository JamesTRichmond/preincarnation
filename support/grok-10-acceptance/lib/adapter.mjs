import { executeAgainstSeam } from "./executor.mjs";
import { contrastRatio } from "./contrast.mjs";
import { needsSeam, releaseSeamBlock } from "./page-assertions.mjs";

const GAME_MARKER = /preincarnation|ellis perch|addison county/i;

export async function inspectPage(url, screenshotDir) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    return {
      launched: false,
      error: `playwright import failed: ${error.message}`,
      playable: false,
      seam: false,
      markers: false,
      consoleErrors: [],
      physicalDevice: false,
    };
  }
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const consoleErrors = [];
  page.on("pageerror", (error) => consoleErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    const surface = await page.evaluate(() => {
      const seam = window.__PREINCARNATION_TEST__;
      const bodyText = (document.body?.innerText || "").slice(0, 2000);
      return {
        title: document.title || "",
        bodyText,
        hasCanvas: Boolean(document.querySelector("canvas")),
        hasSeam: Boolean(seam && typeof seam.getState === "function" && typeof seam.dispatch === "function"),
        seamVersion: seam?.version ?? null,
      };
    });
    const markers = GAME_MARKER.test(`${surface.title}\n${surface.bodyText}`);
    const shot = `${screenshotDir}/boot-emulated-1280x720.png`;
    await page.screenshot({ path: shot, fullPage: false });
    return {
      launched: true,
      browser,
      page,
      error: null,
      playable: Boolean(markers || surface.hasSeam),
      seam: Boolean(surface.hasSeam && surface.seamVersion === 1),
      seamVersion: surface.seamVersion,
      markers,
      hasCanvas: surface.hasCanvas,
      title: surface.title,
      bodySnippet: surface.bodyText.slice(0, 500),
      consoleErrors,
      screenshot: shot,
      physicalDevice: false,
      emulation: "Chromium headless viewport 1280x720. Not a physical phone.",
    };
  } catch (error) {
    await browser.close();
    return {
      launched: false,
      error: error.message,
      playable: false,
      seam: false,
      markers: false,
      consoleErrors,
      physicalDevice: false,
    };
  }
}

export async function runScenario(page, scenario) {
  let execution;
  try {
    execution = await page.evaluate(
      async ({ source, script }) => {
        const execute = eval(`(${source})`);
        return execute(window.__PREINCARNATION_TEST__, script);
      },
      { source: executeAgainstSeam.toString(), script: scenario.script || [] },
    );
  } catch (error) {
    return {
      error: null,
      blockedReason: `In-page seam runner could not start (${error.message}). Not scored as a pass.`,
      before: null,
      after: null,
      samples: [],
      checkpoints: {},
      metrics: {},
    };
  }
  execution.metrics = { ...(execution.metrics || {}), ...(await measure(page, scenario)) };
  const seamFont = execution.after?.ui?.minFontPx;
  if (execution.metrics.minFontPx == null && typeof seamFont === "number") {
    execution.metrics.minFontPx = seamFont;
  }
  if (execution.metrics.minTouchPx == null) {
    const boxes = execution.after?.touch?.boxes || {};
    const names = ["move", "blade", "interact", "offhand", "pause"];
    const sizes = names
      .map((name) => boxes[name])
      .filter((box) => box && typeof box.width === "number" && typeof box.height === "number")
      .map((box) => Math.min(box.width, box.height));
    if (sizes.length === names.length) execution.metrics.minTouchPx = Math.min(...sizes);
  }
  if (execution.metrics.minContrast == null && typeof execution.after?.ui?.minContrast === "number") {
    execution.metrics.minContrast = execution.after.ui.minContrast;
  }
  if (execution.blockedReason && !needsSeam(scenario)) {
    releaseSeamBlock(execution, scenario);
  }
  if (scenario.measure?.ifMissing === "blocked") {
    const missing = (scenario.measure.require || []).filter((key) => execution.metrics[key] == null);
    if (missing.length) {
      execution.error = null;
      execution.blockedReason = `Not measurable (${missing.join(", ")}). Chromium emulation is not physical-phone testing. Not scored as a pass.`;
    }
  }
  return execution;
}

async function measure(page, scenario) {
  const viewport = scenario.measure?.viewport;
  if (viewport) await page.setViewportSize(viewport);
  await page.waitForTimeout(50);
  return page.evaluate((contrastSource) => {
    const ratio = eval(`(${contrastSource})`);
    const parseColor = (text) => {
      const match = String(text || "").match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1].split(",").map((part) => parseFloat(part));
      if (parts.length >= 4 && parts[3] === 0) return null;
      return { r: parts[0], g: parts[1], b: parts[2] };
    };
    const backgroundOf = (el) => {
      let node = el;
      while (node) {
        const color = parseColor(getComputedStyle(node).backgroundColor);
        if (color) return color;
        node = node.parentElement;
      }
      return { r: 255, g: 255, b: 255 };
    };
    const root = document.documentElement;
    const fonts = [];
    const contrasts = [];
    for (const el of document.querySelectorAll("body *")) {
      const text = [...el.childNodes]
        .filter((node) => node.nodeType === 3)
        .map((node) => node.textContent)
        .join("")
        .trim();
      if (!text) continue;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (rect.width <= 0 || rect.height <= 0 || style.visibility === "hidden" || style.display === "none") continue;
      fonts.push(parseFloat(style.fontSize));
      const foreground = parseColor(style.color);
      if (foreground) contrasts.push(ratio(foreground, backgroundOf(el)));
    }
    const touchBoxes = {};
    for (const el of document.querySelectorAll("[data-touch]")) {
      const rect = el.getBoundingClientRect();
      touchBoxes[el.getAttribute("data-touch")] = { width: rect.width, height: rect.height };
    }
    const required = ["move", "blade", "interact", "offhand", "pause"];
    const sizes = required
      .map((name) => touchBoxes[name])
      .filter((box) => box)
      .map((box) => Math.min(box.width, box.height));
    const surface = document.querySelector("canvas") || document.body;
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      horizontalOverflow: root.scrollWidth - root.clientWidth,
      minFontPx: fonts.length ? Math.min(...fonts) : null,
      minContrast: contrasts.length ? Math.min(...contrasts) : null,
      textNodeCount: fonts.length,
      touchBoxes,
      minTouchPx: sizes.length === required.length ? Math.min(...sizes) : null,
      touchAction: surface ? getComputedStyle(surface).touchAction : null,
      bodyText: (document.body?.innerText || "").slice(0, 1500),
      emulation: "chromium-emulated-viewport",
      physicalDevice: false,
    };
  }, contrastRatio.toString());
}

export async function closeInspection(inspection) {
  if (inspection?.browser) await inspection.browser.close();
}

const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const { join } = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");
const manifest = require("../themes/manifest.json");

const studio = pathToFileURL(join(__dirname, "../studio/index.html")).href;
const themeDirectory = join(__dirname, "../themes");

async function captureDownload(page, button, filename) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: button }).click(),
  ]);
  assert.equal(download.suggestedFilename(), filename);
  return readFile(await download.path());
}

async function importConfig(page, filename) {
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: "Import config" }).click(),
  ]);
  await chooser.setFiles(filename);
  await page.getByRole("status").getByText("Configuration imported.").waitFor();
}

function observeErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (entry) => {
    if (entry.type() === "error" || entry.type() === "warning") errors.push(entry.text());
  });
  page.on("request", (request) => {
    if (!/^(file|blob|data):/.test(request.url())) errors.push(`External request: ${request.url()}`);
  });
  return errors;
}

test("the offline Studio imports and exports all 12 public themes on desktop and mobile", async (t) => {
  assert.equal(manifest.themes.length, 12);
  const { chromium } = require(process.env.CHADRACULA_PLAYWRIGHT || "playwright");
  const browser = await chromium.launch({ executablePath: process.env.CHADRACULA_CHROMIUM, headless: true });
  try {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 320, height: 760 }]) {
      await t.test(`${viewport.width}px viewport`, async () => {
        const page = await browser.newPage({ viewport, offline: true });
        try {
          const errors = observeErrors(page);
          await page.goto(studio);
          assert.equal(page.url(), studio);
          assert.equal(await page.title(), "Chadracula Studio · Discord theme builder");
          assert.equal(await page.getByRole("heading", { name: "Chadracula Studio" }).isVisible(), true);
          for (const variant of manifest.themes) {
            const configFile = join(themeDirectory, variant.configuration.file);
            await importConfig(page, configFile);
            assert.equal(await page.locator("#accent").inputValue(), variant.accent);
            const preview = page.locator('.preview-window[data-preview="working"]');
            assert.deepEqual(await preview.evaluate((node) => ({
              layout: node.dataset.layout,
              window: node.dataset.window,
              accent: node.style.getPropertyValue("--chad-accent"),
              muted: node.style.getPropertyValue("--chad-muted"),
            })), {
              layout: variant.layout, window: variant.window,
              accent: variant.accentColor, muted: variant.mutedColor,
            }, variant.name);
            assert.equal(await page.locator("#opacity-row").isVisible(), variant.window === "glass", variant.name);
            assert.equal(await page.locator("#opacity").inputValue(), "80", variant.name);
            assert.equal(await page.locator("#foreground-muted").inputValue(), "", variant.name);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, variant.name);
            const [expectedCSS, expectedConfig] = await Promise.all([
              readFile(join(themeDirectory, variant.styles.file)), readFile(configFile),
            ]);
            assert.deepEqual(await captureDownload(page, "Download CSS", variant.styles.file), expectedCSS, variant.name);
            assert.deepEqual(await captureDownload(page, "Save config", "Chadracula-Studio.json"), expectedConfig, variant.name);
            await page.reload();
            assert.equal(await page.locator("#accent").inputValue(), variant.accent, variant.name);
            assert.equal(await preview.getAttribute("data-layout"), variant.layout, variant.name);
            assert.equal(await preview.getAttribute("data-window"), variant.window, variant.name);
          }
          assert.deepEqual(errors, []);
        } finally {
          await page.close();
        }
      });
    }

    await t.test("both original Glass templates retain the cyan muted override", async () => {
      const page = await browser.newPage({ offline: true });
      try {
        await page.goto(studio);
        await page.locator("#advanced > summary").click();
        for (const layout of ["flat", "framed"]) {
          await importConfig(page, join(__dirname, "../templates", `${layout}-glass`, "config.json"));
          await page.locator(`.preview-window[data-preview="working"][data-layout="${layout}"][data-window="glass"]`).waitFor();
          assert.equal(await page.locator("#foreground-muted").inputValue(), "palette:cyan");
          assert.equal(await page.locator("#layout").inputValue(), layout);
          const css = await captureDownload(page, "Download CSS", `chadracula-violet-glass-${layout}-cyan.theme.css`);
          assert.match(css.toString(), /--chad-muted: #2CCCFF;/);
          assert.equal(await page.locator("#opacity").inputValue(), "80");
        }
      } finally {
        await page.close();
      }
    });
  } finally {
    await browser.close();
  }
});

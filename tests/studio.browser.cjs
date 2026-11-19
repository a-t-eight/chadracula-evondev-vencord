const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const { join } = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");
const { palette } = require("../studio/theme.js");

const playwright = process.env.CHADRACULA_PLAYWRIGHT || "playwright";
const executablePath = process.env.CHADRACULA_CHROMIUM;

test("palette presets and custom formats drive preview and downloads in the offline Studio", async () => {
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 760 } });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(pathToFileURL(join(__dirname, "../studio/index.html")).href);
    const accent = page.locator("#accent");
    const accentEditor = page.locator("#accent-editor");
    const format = accentEditor.getByLabel("Color format");
    const workingAccent = () => page.locator('.preview-window[data-preview="working"]')
      .evaluate((node) => node.style.getPropertyValue("--chad-accent"));
    const save = async (button, filename) => {
      const [download] = await Promise.all([page.waitForEvent("download"), page.locator(button).click()]);
      if (filename) assert.equal(download.suggestedFilename(), filename);
      return readFile(await download.path(), "utf8");
    };

    for (const [group, colors] of [["Base30", palette.base30], ["Base16", palette.base16]]) {
      const options = await accent.locator(`optgroup[label="${group}"] option`).evaluateAll((elements) =>
        elements.map(({ value, label }) => [value, label]));
      assert.deepEqual(options, Object.entries(colors).map(([name, hex]) => [name, `${name} · ${hex}`]));
    }
    await accent.selectOption("base0A");
    assert.equal(await workingAccent(), "#62D6E8");
    assert.equal(JSON.parse(await save("#save-config")).config.accent, "base0A");
    assert.match(await save("#download-css", "chadracula-base0a-solid-framed-teal.theme.css"),
      /^ \* @name chadracula-base0a-solid-framed-teal$/m);

    const legacy = { format: "chadracula-studio", version: 1, config: { accent: "#50FA7B" } };
    await page.locator("#config-file").setInputFiles({
      name: "legacy.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(legacy)),
    });
    const hex = accentEditor.getByLabel("Hex value");
    await page.waitForFunction(() => document.querySelector('#accent-editor [aria-label="Hex value"]')?.value === "#50FA7B");
    assert.equal(await accent.inputValue(), "custom");
    assert.equal(await workingAccent(), "#50FA7B");
    await hex.fill("#12");
    assert.equal(await hex.getAttribute("aria-invalid"), "true");
    assert.equal(await workingAccent(), "#50FA7B");
    assert.equal(JSON.parse(await save("#save-config")).config.accent, "#50FA7B");

    await format.focus();
    await format.press("Tab");
    assert.equal(await hex.evaluate((node) => node === document.activeElement), true);
    await format.selectOption("rgb");
    const red = accentEditor.getByLabel("Red", { exact: true });
    assert.equal(await red.inputValue(), "80");
    await red.fill("256");
    assert.equal(await red.getAttribute("aria-invalid"), "true");
    assert.equal(await workingAccent(), "#50FA7B");
    await red.fill("15");
    assert.equal(await workingAccent(), "#0FFA7B");
    await format.selectOption("hsv");
    await format.selectOption("hex");
    assert.equal(await hex.inputValue(), "#0FFA7B");

    await hex.fill("#000000");
    await format.selectOption("hsv");
    await accentEditor.getByLabel("Hue (degrees)").fill("240");
    await accentEditor.getByLabel("Saturation (%)").fill("100");
    assert.equal(await workingAccent(), "#000000");
    await format.selectOption("rgb");
    await format.selectOption("hsv");
    await accentEditor.getByLabel("Value (%)").fill("100");
    assert.equal(await workingAccent(), "#0000FF");
    assert.match(await save("#download-css", "chadracula-0000ff-solid-framed-teal.theme.css"), /--chad-accent: #0000FF;/);
    assert.equal(await accentEditor.locator("[data-accent-swatch]").evaluate((node) => getComputedStyle(node).backgroundColor), "rgb(0, 0, 255)");
    const saturation = accentEditor.getByLabel("Saturation (%)");
    await saturation.fill("0");
    await accentEditor.getByLabel("Hue (degrees)").fill("120");
    assert.equal(await workingAccent(), "#FFFFFF");
    await saturation.fill("50");
    assert.equal(await workingAccent(), "#80FF80");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
  }
});

test("plain arrows step immediately through collapsed palette choices while preserving focus", async () => {
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(join(__dirname, "../studio/index.html")).href);
    const accent = page.locator("#accent");
    const working = page.locator('[data-preview="working"]');
    await accent.selectOption("brownred");
    await accent.focus();
    await accent.evaluate((node) => {
      window.arrowEvents = [];
      for (const type of ["keydown", "keyup"]) {
        node.addEventListener(type, (event) => {
          window.arrowEvents.push([type, event.key, event.repeat, event.defaultPrevented]);
        });
      }
    });
    await page.keyboard.down("ArrowDown");
    assert.equal(await accent.inputValue(), "base00");
    assert.equal(await accent.evaluate((node) => node.matches(":open")), false);
    assert.equal(await working.evaluate((node) => node.style.getPropertyValue("--chad-accent")), "#141423");
    await page.keyboard.down("ArrowDown");
    assert.equal(await accent.inputValue(), "base01");
    await page.keyboard.up("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    assert.equal(await accent.inputValue(), "brownred");
    assert.equal(await accent.evaluate((node) => node === document.activeElement), true);
    assert.deepEqual((await page.evaluate(() => window.arrowEvents)).slice(0, 3), [
      ["keydown", "ArrowDown", false, true],
      ["keydown", "ArrowDown", true, true],
      ["keyup", "ArrowDown", false, true],
    ]);
    const modifiedIsUncanceled = await accent.evaluate((node) => node.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, cancelable: true }),
    ));
    assert.equal(modifiedIsUncanceled, true);

    await page.keyboard.press("Space");
    assert.equal(await accent.evaluate((node) => node.matches(":open")), true);
    await page.keyboard.press("ArrowDown");
    // Headless Chromium cannot drive the native popup via CDP, but the page
    // must leave its key events alone while the popup is open.
    assert.deepEqual((await page.evaluate(() => window.arrowEvents)).slice(-2), [
      ["keydown", "ArrowDown", false, false],
      ["keyup", "ArrowDown", false, false],
    ]);
    await accent.click();
    assert.equal(await accent.evaluate((node) => node.matches(":open")), false);
    await accent.click();
    assert.equal(await accent.evaluate((node) => node.matches(":open")), true);
    await accent.click();

    const link = page.locator("#link");
    await link.selectOption("accent");
    await link.press("ArrowDown");
    assert.equal(await link.inputValue(), "palette:white");
    assert.equal(await working.evaluate((node) => node.style.getPropertyValue("--chad-link")), "#F8F8F2");
  } finally {
    await browser.close();
  }
});

test("role picks preserve palette aliases, custom formats and inherited surface choices", async () => {
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 760 } });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(pathToFileURL(join(__dirname, "../studio/index.html")).href);
    const working = page.locator('[data-preview="working"]');
    const previewColor = (role) => working.evaluate((node, name) => node.style.getPropertyValue(`--chad-${name}`), role);
    for (const id of ["text", "selection", "threads", "link", "mention", "surface-canvas", "surface-sidebar", "surface-raised", "surface-rail", "surface-input", "foreground-text", "foreground-muted"]) {
      const picker = page.locator(`#${id}`);
      assert.deepEqual(await picker.locator("optgroup").evaluateAll((groups) => groups.map(({ label }) => label)), ["Recommended", "Base30", "Base16"]);
      for (const [group, colors] of [["Base30", palette.base30], ["Base16", palette.base16]]) {
        const options = await picker.locator(`optgroup[label="${group}"] option`).evaluateAll((elements) =>
          elements.map(({ value, label }) => [value, label]));
        assert.deepEqual(options, Object.entries(colors).map(([name, hex]) => [`palette:${name}`, `${name} · ${hex}`]), id);
      }
    }
    assert.equal(await page.locator("#layout option, #window option").count(), 4);
    await page.locator("#threads").selectOption("palette:blue");
    assert.equal(await previewColor("thread-1"), "#2CCCFF");
    assert.equal(await previewColor("thread-6"), "#2CCCFF");
    await page.locator("#threads").selectOption("palette:cyan");
    await page.locator("#link").selectOption("custom");
    const linkEditor = page.locator("#link-editor");
    const hex = linkEditor.getByLabel("Hex value");
    assert.equal(await hex.isVisible(), true);
    await hex.fill("#abc");
    assert.equal(await hex.getAttribute("aria-invalid"), "true");
    await hex.fill("#AABBCC");
    assert.equal(await previewColor("link"), "#AABBCC");
    await linkEditor.locator("[data-accent-format]").selectOption("rgb");
    assert.equal(await linkEditor.getByLabel("Red", { exact: true }).inputValue(), "170");
    await linkEditor.getByLabel("Red", { exact: true }).fill("180");
    assert.equal(await previewColor("link"), "#B4BBCC");
    await linkEditor.locator("[data-accent-format]").selectOption("hsv");
    assert.equal(await linkEditor.getByLabel("Hue (degrees)").inputValue(), "222.5");

    await page.locator("#advanced > summary").click();
    const canvas = page.locator("#surface-canvas");
    assert.equal(await canvas.inputValue(), "");
    const original = await previewColor("canvas");
    await canvas.selectOption("palette:one_bg2");
    assert.equal(await previewColor("canvas"), "#2B2B4C");
    await canvas.selectOption("");
    assert.equal(await previewColor("canvas"), original);

    await page.reload();
    assert.equal(await page.locator("#threads").inputValue(), "palette:cyan");
    assert.equal(await page.locator("#link").inputValue(), "custom");
    assert.equal(await previewColor("link"), "#B4BBCC");
    const [download] = await Promise.all([page.waitForEvent("download"), page.locator("#download-css").click()]);
    assert.match(await readFile(await download.path(), "utf8"), /--chad-link: #B4BBCC;/);
    await page.locator("#layout").selectOption("flat");
    assert.equal(await working.getAttribute("data-layout"), "flat");
    await page.locator("#window").selectOption("glass");
    await page.locator("#opacity").fill("82");
    assert.equal(await previewColor("window-opacity"), "0.82");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
  }
});

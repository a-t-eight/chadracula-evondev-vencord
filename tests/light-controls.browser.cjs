const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const { exportCSS } = require("../studio/theme.js");

test("themed Light supplies legible secondary button text and icons", async () => {
  const { chromium } = require(process.env.CHADRACULA_PLAYWRIGHT || "playwright");
  const browser = await chromium.launch({ executablePath: process.env.CHADRACULA_CHROMIUM, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html class="theme-light"><head><style>
      .theme-light {
        --control-secondary-text-default: #28282d;
        --control-secondary-text-hover: #28282d;
        --control-secondary-text-active: #28282d;
        --control-secondary-icon-default: #28282d;
        --control-secondary-icon-hover: #28282d;
        --control-secondary-icon-active: #28282d;
        --control-primary-text-default: #fff;
        --control-primary-background-default: #5865f2;
      }
      .theme-darker {
        --control-secondary-text-default: #eee;
        --control-secondary-icon-default: #eee;
      }
      .vc-settings-quickActions-pill, .secondary_F7qvhY {
        color: var(--control-secondary-text-default);
        background-color: #32314a;
      }
      .secondary_F7qvhY:hover { color: var(--control-secondary-text-hover); }
      .secondary_F7qvhY:active { color: var(--control-secondary-text-active); }
      .secondary_F7qvhY:disabled { opacity: .5; pointer-events: none; }
      .secondary_F7qvhY svg { fill: var(--control-secondary-icon-default); }
      .secondary_F7qvhY:hover svg { fill: var(--control-secondary-icon-hover); }
      .secondary_F7qvhY:active svg { fill: var(--control-secondary-icon-active); }
      #primary { color: var(--control-primary-text-default); background: var(--control-primary-background-default); }
    </style></head><body><div id="app-mount">
      <button id="search" class="secondary_F7qvhY">Find or start a conversation</button>
      <section class="theme-light">
        <button id="quick" class="vc-settings-quickActions-pill">Quick action</button>
        <button id="edit" class="secondary_F7qvhY"><svg width="12" height="12"><rect width="12" height="12"/></svg> Edit</button>
        <button id="dismiss" class="secondary_F7qvhY">No thanks</button>
        <button id="disabled" class="secondary_F7qvhY" disabled>Disabled</button>
      </section>
      <button id="primary">Primary action</button>
      <div class="theme-light custom-user-profile-theme"><button id="profile" class="secondary_F7qvhY">Profile</button></div>
      <div class="theme-light enable-forced-colors"><button id="forced" class="secondary_F7qvhY">Forced colors</button></div>
    </div></body></html>`);
    const color = (id) => page.locator(`#${id}`).evaluate((element) => getComputedStyle(element).color);
    const editColors = () => page.locator("#edit").evaluate((element) => [
      getComputedStyle(element).color, getComputedStyle(element.querySelector("svg")).fill,
    ]);
    const setMode = (mode) => page.evaluate((value) => { document.documentElement.className = value; }, mode);
    const nativeLight = "rgb(40, 40, 45)";
    const themedInk = "rgb(248, 248, 242)";

    const styles = ["all", "by-appearance", "dark-only"].map((mode) => [mode, exportCSS({
      appearanceMode: mode, accent: "nord_blue",
    })]);
    styles.push(["switcher", readFileSync(join(__dirname, "../switchers/chadracula-appearance-switcher.theme.css"), "utf8")]);
    for (const [appearanceMode, content] of styles) {
      await setMode("theme-light");
      const style = await page.addStyleTag({ content });
      const active = appearanceMode !== "dark-only";
      const ink = active ? themedInk : nativeLight;
      for (const id of ["search", "quick", "dismiss"]) assert.equal(await color(id), ink, `${appearanceMode} ${id}`);
      assert.deepEqual(await editColors(), [ink, ink], appearanceMode);
      await page.locator("#edit").hover();
      assert.deepEqual(await editColors(), [ink, ink], `${appearanceMode} hover`);
      await page.mouse.down();
      assert.deepEqual(await editColors(), [ink, ink], `${appearanceMode} active`);
      await page.mouse.up();
      await page.mouse.move(500, 500);

      assert.equal(await color("profile"), nativeLight, appearanceMode);
      assert.equal(await color("forced"), nativeLight, appearanceMode);
      assert.deepEqual(await page.locator("#disabled").evaluate((element) => {
        const { opacity, pointerEvents } = getComputedStyle(element);
        return [element.disabled, opacity, pointerEvents];
      }), [true, "0.5", "none"], appearanceMode);
      assert.deepEqual(await page.locator("#primary").evaluate((element) => {
        const { color, backgroundColor } = getComputedStyle(element);
        return [color, backgroundColor];
      }), active ? ["rgb(20, 20, 35)", "rgb(5, 195, 255)"] : ["rgb(255, 255, 255)", "rgb(88, 101, 242)"], appearanceMode);

      await setMode("theme-darker");
      assert.equal(await color("search"), "rgb(238, 238, 238)", appearanceMode);
      assert.deepEqual(await editColors(), [nativeLight, nativeLight], `${appearanceMode} independent Light provider`);
      await style.evaluate((element) => element.remove());
    }
  } finally {
    await browser.close();
  }
});

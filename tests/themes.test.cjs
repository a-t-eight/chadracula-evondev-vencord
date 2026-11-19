const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const theme = require("../studio/theme.js");

const themesPath = join(__dirname, "../themes");
const manifest = require("../themes/manifest.json");
const templates = {
  framed: require("../templates/framed-glass/config.json"),
  flat: require("../templates/flat-glass/config.json"),
};
const accentValues = {
  nord_blue: { fill: "#05C3FF", glassText: "#12C6FF" },
  pink: { fill: "#FF6BCB", glassText: "#FF97DB" },
  violet: { fill: "#9A86FD", glassText: "#BDB0FE" },
};

function verifiedFile({ file, sha256 }) {
  const data = readFileSync(join(themesPath, file));
  assert.equal(createHash("sha256").update(data).digest("hex"), sha256, file);
  return data.toString("utf8");
}

function renderRules(css) {
  const start = css.indexOf("\n@media not (forced-colors: active)");
  assert.ok(start !== -1);
  return css.slice(start);
}

test("release contains each accent, material, and layout and preserves other template settings", () => {
  assert.deepEqual([manifest.format, manifest.version, manifest.themes.length], ["chadracula-release", 1, 12]);
  const expected = Object.keys(accentValues).flatMap((accent) => ["glass", "solid"].flatMap((window) => (
    ["framed", "flat"].map((layout) => `${accent} ${window} ${layout}`)
  )));
  assert.deepEqual(manifest.themes.map(({ accent, window, layout }) => `${accent} ${window} ${layout}`).sort(), expected.sort());

  for (const { name, accent, layout, window, accentColor, mutedColor, styles, configuration } of manifest.themes) {
    const expectedName = `chadracula-${accent.replaceAll("_", "-")}-${window}-${layout}-teal`;
    assert.equal(name, expectedName);
    assert.equal(styles.file, `${expectedName}.theme.css`);
    assert.equal(configuration.file, `${expectedName}.json`);
    const payload = JSON.parse(verifiedFile(configuration));
    const template = templates[layout];
    const expectedConfig = { ...template.config, accent, window };
    assert.deepEqual(expectedConfig.foregrounds, { muted: "palette:cyan" });
    delete expectedConfig.foregrounds;
    assert.deepEqual(payload, { ...template, config: expectedConfig }, name);
    assert.deepEqual(theme.normalizeConfig(payload.config), payload.config, name);

    const css = verifiedFile(styles);
    assert.equal(css, theme.exportCSS(payload.config), name);
    assert.match(css, new RegExp(`^ \\* @name ${expectedName}$`, "m"));
    assert.equal(renderRules(css), renderRules(theme.exportCSS({ ...template.config, window })), name);
    const roles = theme.roleValues(payload.config);
    assert.equal(roles["--chad-pane-radius"], layout === "framed" ? "10px" : "0px", name);
    assert.equal(roles["--chad-window-opacity"], window === "glass" ? "0.8" : "1", name);
    assert.equal(accentColor, accentValues[accent].fill, name);
    assert.equal(mutedColor, window === "glass" ? "#ADB9DF" : "#92A2D4", name);
    assert.equal(roles["--chad-muted"], mutedColor, name);
  }
});

const channels = (hex) => hex.slice(1).match(/../g).map((channel) => Number.parseInt(channel, 16));

function contrast(first, second) {
  function luminance(hex) {
    return channels(hex).reduce((total, channel, index) => {
      const srgb = channel / 255;
      const linear = srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
      return total + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
  }

  const a = luminance(first) + 0.05;
  const b = luminance(second) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

function composite(surface, opacity, backdrop) {
  return "#" + channels(surface).map((channel) => (
    Math.round(channel * opacity + backdrop * (1 - opacity)).toString(16).padStart(2, "0")
  )).join("");
}

test("release accent fills, focus and text retain their configured colors and contrast", () => {
  for (const { name, accent, window, styles, configuration } of manifest.themes) {
    const { config } = JSON.parse(verifiedFile(configuration));
    const roles = theme.roleValues(config);
    const value = (role) => roles[`--chad-${role}`];
    const check = (ink, surface, minimum) => {
      const ratio = contrast(value(ink), surface);
      assert.ok(ratio >= minimum, `${name}: ${ink} on ${surface} contrasts ${ratio.toFixed(2)}`);
    };
    assert.equal(value("accent"), accentValues[accent].fill, name);
    assert.equal(value("accent-text"), accentValues[accent][window === "glass" ? "glassText" : "fill"], name);
    const css = verifiedFile(styles);
    assert.match(css, /^  --border-focus: var\(--chad-accent-text\);$/m);
    assert.match(css, /^  --input-border-active: var\(--chad-accent-text\);$/m);

    for (const fill of ["accent", "accent-hover", "accent-active"]) check("on-accent", value(fill), 4.5);
    for (const surface of ["input", "raised", "hover", "active"]) {
      check("muted", value(surface), 4.5);
      check("accent-text", value(surface), 4.5);
      check("control-border", value(surface), 3);
    }
    const opacity = Number(value("window-opacity"));
    for (const surface of ["canvas", "sidebar", "rail"]) {
      for (const backdrop of [0, 255]) {
        const fill = composite(value(surface), opacity, backdrop);
        for (const ink of ["text", "muted", "accent-text", "link", "mention"]) {
          check(ink, fill, 4.5);
        }
        check("control-border", fill, 3);
      }
    }
    for (let index = 1; index <= 6; index += 1) {
      const role = `thread-${index}`;
      for (const fill of [composite(value("sidebar"), opacity, 0), composite(value("sidebar"), opacity, 255), value("hover"), value("active")]) {
        check(role, fill, 4.5);
      }
    }
  }
});

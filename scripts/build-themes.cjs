const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { mkdirSync, readdirSync, readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const theme = require("../studio/theme.js");
const { exportMobileTheme } = require("./export-mobile.cjs");

const root = join(__dirname, "..");
const themesDirectory = join(root, "themes");
const accents = [
  { accent: "nord_blue", label: "Nord Blue" },
  { accent: "pink", label: "Pink" },
  { accent: "violet", label: "Violet" },
];
const finishes = ["glass", "solid"];
const layouts = ["framed", "flat"];
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const digest = (content) => createHash("sha256").update(content).digest("hex");

function loadTemplate(layout) {
  const template = JSON.parse(readFileSync(join(root, "templates", `${layout}-glass`, "config.json"), "utf8"));
  const { format, version, config } = template;
  assert.deepEqual([format, version, config.layout, config.window, config.opacity],
    ["chadracula-studio", 1, layout, "glass", 80]);
  assert.deepEqual(theme.normalizeConfig(config), config, `${layout} template must use normalized Studio choices`);
  return template;
}

function buildFiles() {
  const output = new Map();
  const mobile = new Map();
  const themes = [];
  const mobileThemes = [];
  const templates = Object.fromEntries(layouts.map((layout) => [layout, loadTemplate(layout)]));
  assert.deepEqual(templates.framed.config, { ...templates.flat.config, layout: "framed" });

  function addFile(file, content) {
    assert.ok(!output.has(file), `Duplicate release file ${file}`);
    output.set(file, content);
    return { file, sha256: digest(content) };
  }

  for (const { accent, label } of accents) {
    for (const window of finishes) {
      for (const layout of layouts) {
        const template = templates[layout];
        const config = theme.setColorChoice({ ...template.config, accent, window }, "foreground-muted", "");
        const { name, filename } = theme.exportIdentity(config);
        const roles = theme.roleValues(config);
        const accentColor = theme.inputColor(config, "accent");
        if (window === "solid" && layout === "flat") {
          const file = `${accent.replaceAll("_", "-")}.json`;
          const mobileTheme = exportMobileTheme(config, label);
          const content = json(mobileTheme);
          mobile.set(file, content);
          mobileThemes.push({ name: mobileTheme.name, accent, accentColor, file, sha256: digest(content) });
        }
        themes.push({
          name, accent, accentColor, window, layout,
          mutedColor: roles["--chad-muted"],
          styles: addFile(filename, theme.exportCSS(config)),
          configuration: addFile(`${name}.json`, json({ ...template, config })),
        });
      }
    }
  }
  addFile("manifest.json", json({ format: "chadracula-release", version: 1, themes }));
  mobile.set("manifest.json", json({ format: "chadracula-mobile-release", version: 1, themes: mobileThemes }));
  return { desktop: output, mobile };
}

const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === "--check"), "Usage: node scripts/build-themes.cjs [--check]");
const { desktop, mobile } = buildFiles();
for (const [directory, files] of [[themesDirectory, desktop], [join(root, "mobile"), mobile]]) {
  if (args[0] === "--check") {
    assert.deepEqual(readdirSync(directory).sort(), [...files.keys()].sort(), `Unexpected files in ${directory}`);
    for (const [file, content] of files) {
      assert.ok(readFileSync(join(directory, file)).equals(Buffer.from(content)), `${file} differs from the Studio export`);
    }
  } else {
    mkdirSync(directory, { recursive: true });
    for (const [file, content] of files) writeFileSync(join(directory, file), content);
  }
}
console.log(`${args.length ? "Verified" : "Generated"} ${(desktop.size - 1) / 2} Studio themes and configurations, plus ${mobile.size - 1} mobile themes.`);

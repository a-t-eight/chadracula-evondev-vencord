const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

function loadEngine() {
  try {
    return require("../studio/theme.js");
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") throw error;
    assert.fail("The studio theme engine is unavailable");
  }
}

test("Base46 keys, aliases, and values match the pinned Lua source", () => {
  const theme = loadEngine();
  const pinned = readFileSync(
    join(__dirname, "../notices/chadracula-evondev.lua"),
    "utf8",
  );
  const base30 = Object.fromEntries([...pinned.match(/M.base_30 = \{([^}]+)\}/s)[1]
    .matchAll(/(\w+) = "(#[0-9a-f]{6})"/gi)].map(([, key, value]) => [key, value.toUpperCase()]));
  const base16 = Object.fromEntries([...pinned.match(/M.base_16 = \{([^}]+)\}/s)[1]
    .matchAll(/(base\w+) = (?:"(#[0-9a-f]{6})"|M.base_30\.(\w+))/gi)]
    .map(([, key, value, alias]) => [key, value?.toUpperCase() ?? base30[alias]]));
  assert.deepEqual(theme.palette.base30, base30);
  assert.deepEqual(theme.palette.base16, base16);
  const css = theme.exportCSS();
  for (const [index, palette] of [[30, base30], [16, base16]]) {
    for (const [key, value] of Object.entries(palette)) {
      assert.ok(css.includes(`--chad-base${index}-${key}: ${value};`), key);
    }
  }
});

test("standalone export is reproducible and has no remote dependencies", () => {
  const theme = loadEngine();
  const css = theme.exportCSS();
  assert.equal(css, theme.exportCSS(theme.normalizeConfig({})));
  assert.match(css, /@name chadracula-dark-purple-solid-framed-teal/);
  assert.doesNotMatch(css, /@import|\burl\s*\(/i);
  assert.equal(theme.roleValues()["--chad-accent"], "#A166F6");
  assert.equal(theme.roleValues()["--chad-text"], "#F8F8F2");
});

test("every exported name matches its lowercase filename stem", () => {
  const theme = loadEngine();
  const cases = [
    [{}, "chadracula-dark-purple-solid-framed-teal"],
    [{ accent: "violet", window: "glass", opacity: 80, layout: "framed", foregrounds: { muted: "palette:cyan" } },
      "chadracula-violet-glass-framed-cyan"],
    [{ accent: "nord_blue", window: "glass", opacity: 75, layout: "flat", foregrounds: { muted: "palette:baby_pink" } },
      "chadracula-nord-blue-glass-flat-baby-pink"],
    [{ accent: "base0D", foregrounds: { muted: "palette:base0A" } }, "chadracula-base0d-solid-framed-base0a"],
    [{ accent: "#1AcDf0", window: "glass", foregrounds: { muted: "#12AbCd" } },
      "chadracula-1acdf0-glass-framed-12abcd"],
    [{ accent: "*/malformed", window: "file:///untrusted", foregrounds: { muted: "palette:missing" } },
      "chadracula-dark-purple-solid-framed-teal"],
  ];
  for (const [config, name] of cases) {
    assert.equal(theme.exportCSS(config).match(/^ \* @name (.*)$/m)?.[1], name);
    assert.deepEqual(theme.exportIdentity(config), { name, filename: `${name}.theme.css` });
  }
  assert.equal(theme.filename, theme.exportIdentity().filename);
});

test("theme cards describe the selected colors, pane, and window finish", () => {
  const theme = loadEngine();
  const cases = [
    [{ opacity: 80 }, "dark purple, teal muted text, framed, solid"],
    [{ accent: "nord_blue", foregrounds: { muted: "palette:baby_pink" }, layout: "flat", window: "glass" },
      "nord blue, baby pink muted text, flat, glass"],
    [{ accent: "base0E", foregrounds: { muted: "palette:base0F" } }, "base0e, base0f muted text, framed, solid"],
    [{ accent: "#1AcDf0", foregrounds: { muted: "#12AbCd" }, window: "glass" }, "#1acdf0, #12abcd muted text, framed, glass"],
  ];
  for (const [config, styling] of cases) {
    const [header] = theme.exportCSS(config).split("\n\n", 1);
    const fields = Object.fromEntries([...header.matchAll(/^ \* @(\w+) (.*)$/gm)].map(([, field, text]) => [field, text]));
    assert.deepEqual(fields, {
      name: theme.exportIdentity(config).name,
      description: `${styling}, supports transparency - adapted chadracula-evondev for discord`,
      author: "a-t-eight",
      version: "1.0.1",
    });
  }
});

test("appearance accents round-trip with canonical keys, custom hex, and the fixed accent fallback", () => {
  const theme = loadEngine();
  const config = theme.normalizeConfig({
    appearanceMode: "by-appearance",
    accent: "violet",
    appearanceAccents: { light: "nord_blue", ash: "missing", dark: "base0D", onyx: "#bAda55", invalid: "pink" },
    link: "accent",
    threads: "accent",
    selection: "accent",
  });
  assert.deepEqual(config.appearanceAccents, { light: "nord_blue", ash: "violet", dark: "base0D", onyx: "#BADA55" });
  const reloaded = theme.normalizeConfig(JSON.parse(JSON.stringify(config)));
  assert.equal(reloaded.appearanceMode, "by-appearance");
  assert.deepEqual(reloaded, config);
  for (const [appearance, color, readable] of [
    ["light", "#05C3FF", "#05C3FF"], ["ash", "#9A86FD", "#A998FD"],
    ["dark", "#20E3B2", "#20E3B2"], ["onyx", "#BADA55", "#BADA55"],
  ]) {
    const values = theme.roleValues(reloaded, appearance);
    assert.equal(values["--chad-accent"], color, appearance);
    assert.equal(values["--chad-selected"], color, appearance);
    assert.equal(values["--chad-link"], readable, appearance);
    assert.equal(values["--chad-thread-1"], readable, appearance);
  }
  const fixed = theme.normalizeConfig({ ...reloaded, appearanceMode: "all" });
  assert.deepEqual(fixed.appearanceAccents, reloaded.appearanceAccents);
  assert.equal(theme.roleValues(fixed, "light")["--chad-accent"], "#9A86FD");
  assert.equal(theme.roleValues({ ...reloaded, appearanceMode: "invalid" }, "light")["--chad-accent"], "#9A86FD");
  assert.equal(theme.exportCSS({ ...fixed, appearanceMode: "dark-only" }), theme.exportCSS({ accent: "violet", link: "accent", threads: "accent", selection: "accent" }));
});

test("theme cards identify the all-appearance exports and their accent choices", () => {
  const theme = loadEngine();
  const fixed = { appearanceMode: "all", accent: "violet", window: "glass" };
  const adaptive = { ...fixed, appearanceMode: "by-appearance", appearanceAccents: { light: "nord_blue", ash: "pink", dark: "violet", onyx: "#50FA7B" } };
  assert.equal(theme.exportIdentity(fixed).filename, "chadracula-violet-all-appearances-glass-framed-teal.theme.css");
  assert.match(theme.exportCSS(fixed), /^ \* @description violet across all Discord appearances,/m);
  const filename = "chadracula-appearance-accents-glass-framed-teal.theme.css";
  assert.equal(theme.exportIdentity(adaptive).filename, filename);
  assert.equal(theme.exportCSS(adaptive).match(/^ \* @name (.*)$/m)?.[1] + ".theme.css", filename);
  assert.match(theme.exportCSS(adaptive), /^ \* @description nord blue on Light, pink on Ash, violet on Dark, #50fa7b on Onyx,/m);
});

test("export provenance links the palette and retains its pinned upstream license", () => {
  const theme = loadEngine();
  const css = theme.exportCSS();
  const provenance = css.slice(0, css.indexOf(":root {"));
  const pin = "https://github.com/NvChad/base46/blob/267954c8663607823f03a3259bb8deb15688212f";
  assert.match(provenance, /The original theme credits Dracula Official\./);
  assert.ok(provenance.includes("https://github.com/evondev/evondev-dracula"));
  assert.match(provenance, /BrunoKrugel introduced the chadracula-evondev adaptation to NvChad Base46\./);
  assert.ok(provenance.includes("https://github.com/NvChad/base46/pull/242"));
  assert.ok(provenance.includes(`${pin}/lua/base46/themes/chadracula-evondev.lua`));
  assert.ok(provenance.includes(`${pin}/LICENSE`));
  const license = readFileSync(join(__dirname, "../notices/LICENSE-base46"), "utf8").trimEnd();
  assert.ok(provenance.includes(license.split("\n").map((line) => line ? `   ${line}` : "").join("\n")));
});

test("inputs affect the CSS roles consumed by the studio and export", () => {
  const theme = loadEngine();
  const config = {
    accent: "orange",
    text: "cool",
    layout: "flat",
    window: "glass",
    opacity: 77,
    threads: "accent",
    link: "cyan",
    selection: "accent",
    mention: "violet",
  };
  const values = theme.roleValues(config);
  const expected = {
    "--chad-accent": "#FFB86C",
    "--chad-text": "#E9E9F4",
    "--chad-pane-radius": "0px",
    "--chad-pane-frame": "none",
    "--chad-window-opacity": "0.77",
    "--chad-selected": "#FFB86C",
    "--chad-selected-text": "#141423",
    "--chad-thread-6": "#FFB86C",
  };
  const css = theme.exportCSS(config);
  for (const [name, value] of Object.entries(expected)) {
    assert.equal(values[name], value);
    assert.ok(css.includes(`${name}: ${value};`), name);
  }
  assert.equal(theme.roleValues({ link: "cyan" })["--chad-link"], "#2CCCFF");
  assert.notEqual(theme.roleValues({ mention: "violet" })["--chad-mention"], "#FFB86C");
  assert.ok(contrast(values["--chad-mention"], values["--chad-mention-chip-bg"]) >= 4.5);
  for (const name of ["--chad-link", "--chad-mention"]) {
    assert.ok(css.includes(`${name}: ${values[name]};`), name);
  }
  assert.match(css, /#app-mount\s*\{[^}]*background-color:\s*transparent/);
  assert.equal(theme.roleValues({ opacity: 77 })["--chad-window-opacity"], "1");
});

test("every canonical accent name round-trips through config and CSS export", () => {
  const theme = loadEngine();
  assert.deepEqual(new Set(theme.options.accent.map(({ value }) => value)),
    new Set(Object.values(theme.palette).flatMap(Object.keys)));
  assert.equal(theme.options.accent.find(({ value }) => value === "dark_purple").label, "Dark purple");
  for (const colors of Object.values(theme.palette)) {
    for (const [accent, hex] of Object.entries(colors)) {
      const revived = theme.normalizeConfig(JSON.parse(JSON.stringify(theme.normalizeConfig({ accent }))));
      assert.equal(revived.accent, accent);
      assert.equal(theme.roleValues(revived)["--chad-accent"], hex);
      assert.ok(theme.exportCSS(revived).includes(`--chad-accent: ${hex};`), accent);
    }
  }
  assert.equal(theme.normalizeConfig({ accent: "#50fa7b" }).accent, "#50FA7B");
});

test("every editor role offers the complete canonical palette with separate recommendation values", () => {
  const theme = loadEngine();
  const recommendations = {
    accent: [], text: ["warm", "cool"], link: ["sky", "cyan", "accent"],
    selection: ["tinted", "neutral", "accent"], mention: ["orange", "violet", "cyan"],
    threads: ["rainbow", "accent", "neutral"],
    "surface-canvas": [""], "surface-sidebar": [""], "surface-raised": [""],
    "surface-rail": [""], "surface-input": [""], "foreground-text": [""], "foreground-muted": [""],
  };
  assert.deepEqual(Object.keys(theme.colorRoles).sort(), Object.keys(recommendations).sort());
  for (const [role, expected] of Object.entries(recommendations)) {
    const { recommended, palette, cssRole } = theme.colorRoles[role];
    assert.deepEqual(recommended.map(({ value }) => value), expected, role);
    assert.deepEqual(palette.map(({ label }) => label), ["Base30", "Base16"]);
    for (const [index, group] of palette.entries()) {
      const entries = Object.entries(Object.values(theme.palette)[index]);
      assert.deepEqual(group.options.map(({ value, color }) => [value, color]),
        entries.map(([key, color]) => [role === "accent" ? key : `palette:${key}`, color]), role);
      for (const { value, color } of group.options) {
        assert.ok(!expected.includes(value));
        const saved = theme.setColorChoice({ accent: "grey" }, role, value);
        const config = theme.normalizeConfig(JSON.parse(JSON.stringify(saved)));
        assert.equal(theme.getColorChoice(config, role), value, role);
        assert.equal(theme.inputColor(config, role), color, role);
        const effective = theme.roleValues(config)[`--chad-${cssRole}`];
        assert.match(effective, /^#[0-9A-F]{6}$/, role);
        assert.ok(theme.exportCSS(config).includes(`--chad-${cssRole}: ${effective};`), role);
      }
    }
  }
});

test("custom colors round-trip in all role editors and reject invalid choices", () => {
  const theme = loadEngine();
  for (const role of Object.keys(theme.colorRoles)) {
    const chosen = theme.setColorChoice({ accent: "grey" }, role, "#34dbca");
    const config = theme.normalizeConfig(JSON.parse(JSON.stringify(chosen)));
    assert.equal(theme.getColorChoice(config, role), "#34DBCA", role);
    assert.equal(theme.inputColor(config, role), "#34DBCA", role);
    for (const invalid of ["#bad", "palette:constructor", "palette:__proto__", "#34DBCA; color:red", {}]) {
      assert.deepEqual(theme.setColorChoice(config, role, invalid), config, role);
    }
  }
});

test("main text choices honor and can clear older foreground overrides", () => {
  const theme = loadEngine();
  const legacy = theme.normalizeConfig({ accent: "grey", text: "cool", foregrounds: { text: "#eeeeee", muted: "#abcded" } });
  assert.equal(theme.getColorChoice(legacy, "text"), "#EEEEEE");
  assert.equal(theme.getColorChoice(legacy, "foreground-text"), "#EEEEEE");
  assert.equal(theme.roleValues(legacy)["--chad-text"], "#EEEEEE");
  const recommended = theme.setColorChoice(legacy, "text", "warm");
  assert.equal(theme.getColorChoice(recommended, "text"), "warm");
  assert.equal(theme.getColorChoice(recommended, "foreground-text"), "");
  assert.equal(theme.roleValues(recommended)["--chad-text"], "#F8F8F2");
  assert.deepEqual(recommended.foregrounds, { muted: "#ABCDED" });
  const cleared = theme.setColorChoice(legacy, "foreground-text", "");
  assert.equal(theme.getColorChoice(cleared, "text"), "cool");
  assert.equal(theme.roleValues(cleared)["--chad-text"], "#E9E9F4");
});

test("custom role colors resolve to exportable colors with readable paired ink", () => {
  const theme = loadEngine();
  const values = theme.roleValues({
    text: "#eeeedd", link: "palette:base0A", mention: "palette:base0B", selection: "palette:base07", threads: "palette:base0A",
    surfaces: { canvas: "palette:black", raised: "palette:white" },
    foregrounds: { muted: "palette:teal" },
  });
  assert.equal(values["--chad-canvas"], "#141423");
  assert.equal(values["--chad-text"], "#EEEEDD");
  assert.equal(values["--chad-selected"], "#F7F7FB");
  assert.deepEqual(values, theme.roleValues({
    text: "#EEEEDD", link: "#62D6E8", mention: "#E5C697", selection: "#F7F7FB", threads: "#62D6E8",
    surfaces: { canvas: "#141423", raised: "#F8F8F2" }, foregrounds: { muted: "#92A2D4" },
  }));
  for (const [ink, fill] of [["text", "raised"], ["muted", "raised"], ["link", "selected-surface"], ["mention", "mention-chip-bg"]]) {
    assert.ok(contrast(values[`--chad-${ink}`], values[`--chad-${fill}`]) >= 4.5, `${ink} on ${fill}`);
  }
  for (const suffix of [1, 2, 3, 4, 5, 6, "single"]) assert.equal(values[`--chad-thread-${suffix}`], "#62D6E8");

  const selectionChoices = theme.colorRoles.selection.palette.flatMap(({ options }) => options.map(({ value }) => value));
  for (const selection of [...selectionChoices, "#000000", "#FFFFFF", "#767676"]) {
    const roles = theme.roleValues({ selection });
    assert.ok(contrast(roles["--chad-selected-text"], roles["--chad-selected"]) >= 4.5, selection);
  }
});

test("invalid inputs cannot escape into exported CSS and opacity has safe limits", () => {
  const theme = loadEngine();
  assert.deepEqual(theme.normalizeConfig({
    accent: "#A166F6; } @import 'payload';",
    text: "toString",
    layout: "full",
    window: null,
    opacity: {},
    threads: ["neutral"],
    link: "constructor",
    selection: false,
    mention: null,
  }), theme.defaults);
  assert.equal(theme.normalizeConfig({ accent: "#bada55", opacity: "1000" }).accent, "#BADA55");
  assert.equal(theme.normalizeConfig({ opacity: 2 }).opacity, 75);
  assert.equal(theme.normalizeConfig({ opacity: 180 }).opacity, 100);
  assert.equal(theme.normalizeConfig({ opacity: "oops" }).opacity, 90);
});

function contrast(first, second) {
  function luminance(hex) {
    return [...hex.substring(1).matchAll(/../g)].reduce((total, [channel], index) => {
      const value = Number.parseInt(channel, 16) / 255;
      const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      return total + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
  }

  const pair = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (pair[0] + 0.05) / (pair[1] + 0.05);
}

test("accent button foreground remains legible across default, hover and pressed fills", () => {
  const theme = loadEngine();
  const customColors = ["#000000", "#FFFFFF", "#767676", "#7B35FF", "#FF0000", "#0000FF", "#00FF00"];
  for (const accent of [...theme.options.accent.map(({ value }) => value), ...customColors]) {
    const values = theme.roleValues({ accent, link: "accent", selection: "accent", threads: "accent" });
    for (const name of ["accent", "accent-hover", "accent-active", "selected"]) {
      const ratio = contrast(values["--chad-on-accent"], values[`--chad-${name}`]);
      assert.ok(ratio >= 4.5, `${accent} ${name} contrast was ${ratio.toFixed(2)}`);
    }
    for (const name of ["accent-text", "link", "thread-6"]) {
      const ratio = contrast(values[`--chad-${name}`], values["--chad-raised"]);
      assert.ok(ratio >= 4.5, `${accent} ${name} contrast was ${ratio.toFixed(2)}`);
    }
  }
});

function composite(surface, backdrop, alpha) {
  const color = (hex) => hex.substring(1).match(/../g).map((channel) => Number.parseInt(channel, 16));
  const background = color(backdrop);
  return "#" + color(surface).map((channel, index) => (
    Math.round(channel * alpha + background[index] * (1 - alpha)).toString(16).padStart(2, "0")
  )).join("");
}

test("translucent panes keep readable roles over bright and dark native backdrops", () => {
  const theme = loadEngine();
  const inputs = [
    {},
    { accent: "#161212", link: "accent", threads: "accent", text: "cool" },
    { accent: "#FF3333", mention: "violet", threads: "neutral",
      surfaces: { canvas: "#000000", sidebar: "#FFFFFF", rail: "#333333", raised: "#886622", input: "#281E2A" },
      foregrounds: { text: "#cccccc", muted: "#666666" } },
  ];
  for (const config of inputs) {
    for (const opacity of [75, 90, 100]) {
      const values = theme.roleValues({ ...config, window: "glass", opacity });
      for (const name of ["canvas", "sidebar", "rail"]) {
        for (const native of ["#000000", "#FFFFFF"]) {
          const surface = composite(values[`--chad-${name}`], native, opacity / 100);
          for (const role of ["text", "muted", "link", "accent-text", "thread-3", "mention"]) {
            const ratio = contrast(values[`--chad-${role}`], surface);
            assert.ok(ratio >= 4.5, `${name} over ${native} at ${opacity}%: ${role} ${ratio.toFixed(2)}`);
          }
        }
      }
    }
  }
  const custom = theme.roleValues(inputs[2]);
  assert.equal(custom["--chad-canvas"], "#000000");
  assert.equal(custom["--chad-input"], "#281E2A");
  assert.equal(custom["--chad-text"], "#CCCCCC");
  assert.notEqual(custom["--chad-sidebar"], "#FFFFFF");
});

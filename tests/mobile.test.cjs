const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const { exportMobileTheme } = require("../scripts/export-mobile.cjs");
const { roleValues } = require("../studio/theme.js");
const desktop = require("../themes/manifest.json");
const { config } = require("../themes/chadracula-violet-solid-flat-teal.json");

const mobileDirectory = join(__dirname, "../mobile");
const variants = [
  { accent: "nord_blue", label: "Nord Blue", file: "nord-blue.json", banner: "#123046" },
  { accent: "pink", label: "Pink", file: "pink.json", banner: "#3A223E" },
  { accent: "violet", label: "Violet", file: "violet.json", banner: "#292646" },
];

for (const { accent, label, file, banner } of variants) {
  test(`${label} mobile release uses the Studio palette and readable action pairs`, () => {
    const variant = desktop.themes.find((theme) => theme.accent === accent && theme.layout === "flat" && theme.window === "solid");
    const { config } = require(join(__dirname, "../themes", variant.configuration.file));
    const roles = roleValues(config);
    const generated = exportMobileTheme(config, label);
    const colors = generated.semanticColors;

    assert.deepEqual(colors.BACKGROUND_BRAND, [banner, banner]);
    assert.equal(generated.spec, 2);
    assert.equal(generated.name, `Chadracula ${label}`);
    assert.deepEqual(generated.rawColors, {});
    for (const [name, slots] of Object.entries(colors)) {
      assert.match(slots[0], /^#[0-9A-F]{6}([0-9A-F]{2})?$/, name);
      assert.deepEqual(slots, [slots[0], slots[0]], name);
    }
    for (const name of ["KEYBOARD", "BACKGROUND_PRIMARY", "REDESIGN_BUTTON_DESTRUCTIVE_BACKGROUND", "REDESIGN_BUTTON_DESTRUCTIVE_TEXT"]) {
      assert.equal(Object.hasOwn(colors, name), false, name);
    }

    for (const slot of [0, 1]) {
      assert.equal(colors.CHAT_BACKGROUND[slot], roles["--chad-canvas"]);
      assert.equal(colors.STANDALONE_CHANNEL_CONTENT_BACKGROUND[slot], colors.CHAT_BACKGROUND[slot]);
      assert.equal(colors.MOBILE_KEYBOARD_GAP_BACKGROUND[slot], colors.CHAT_BACKGROUND[slot]);
      assert.equal(colors.PANEL_BG[slot], roles["--chad-sidebar"]);
      assert.equal(colors.MOBILE_CHANNEL_ITEM_BACKGROUND_SELECTED[slot], roles["--chad-selected-surface"]);
      assert.ok(contrast(colors.REDESIGN_CHANNEL_NAME_TEXT[slot], colors.MOBILE_CHANNEL_ITEM_BACKGROUND_SELECTED[slot]) >= 4.5);

      assert.equal(colors.BG_BRAND[slot], variant.accentColor);
      for (const [state, role] of [["DEFAULT", "accent"], ["HOVER", "accent-hover"], ["ACTIVE", "accent-active"]]) {
        const background = colors[`CONTROL_PRIMARY_BACKGROUND_${state}`][slot];
        const ink = colors[`CONTROL_PRIMARY_TEXT_${state}`][slot];
        assert.equal(background, roles[`--chad-${role}`]);
        assert.equal(ink, roles["--chad-on-accent"]);
        assert.ok(contrast(ink, background) >= 4.5, `primary ${state}, slot ${slot}`);
        assert.ok(contrast(colors[`CONTROL_PRIMARY_ICON_${state}`][slot], background) >= 3, `primary icon ${state}, slot ${slot}`);
      }
      const tint = roles["--chad-raised"] + "CC";
      assert.equal(colors.MOBILE_FLOATINGBAR_BACKGROUND_NAMEPLATE[slot], tint);
      assert.equal(colors.CONTROL_SECONDARY_BACKGROUND_DEFAULT[slot], tint);
      assert.ok(contrast(colors.CONTROL_SECONDARY_TEXT_DEFAULT[slot], composite(tint, colors.PANEL_BG[slot])) >= 4.5);
      assert.ok(contrast("#FFFFFF", colors.BACKGROUND_BRAND[slot]) >= 4.5);
    }
    assert.deepEqual(generated, JSON.parse(readFileSync(join(mobileDirectory, file))));
  });
}

test("mobile manifest lists one verified file per desktop accent", () => {
  const manifest = require("../mobile/manifest.json");
  assert.equal(manifest.format, "chadracula-mobile-release");
  assert.equal(manifest.version, 1);
  assert.deepEqual(manifest.themes.map(({ accent }) => accent), [...new Set(desktop.themes.map(({ accent }) => accent))]);
  assert.deepEqual(manifest.themes.map(({ accent, file }) => ({ accent, file })), variants.map(({ accent, file }) => ({ accent, file })));
  for (const { name, file, accentColor, sha256 } of manifest.themes) {
    const bytes = readFileSync(join(mobileDirectory, file));
    const generated = JSON.parse(bytes);
    assert.equal(generated.name, name);
    assert.equal(generated.semanticColors.CONTROL_PRIMARY_BACKGROUND_DEFAULT[0], accentColor);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), sha256);
  }
  assert.equal(manifest.themes.find(({ accent }) => accent === "violet").sha256,
    "8524b4c516cefb6c98c92d6c286a0186f69378ad2008d46d91ce838c0cbd76f3");
});

test("Violet supplies fixed spec 2 colors in both loader appearance slots", () => {
  const generated = exportMobileTheme(config, "Violet");
  assert.deepEqual(generated, require("../mobile/violet.json"));
  assert.equal(generated.spec, 2);
  assert.equal(generated.name, "Chadracula Violet");
  assert.deepEqual(generated.rawColors, {});
  for (const [key, slots] of Object.entries(generated.semanticColors)) {
    assert.match(slots[0], /^#[0-9A-F]{6}([0-9A-F]{2})?$/, key);
    assert.deepEqual(slots, [slots[0], slots[0]], key);
  }
  const expected = {
    BG_BASE_PRIMARY: "#141423", BG_BASE_TERTIARY: "#19192C", BG_BACKDROP: "#141423B3",
    BG_SURFACE_RAISED: "#23233D", MOBILE_ACTIONSHEET_BACKGROUND: "#23233D",
    TEXT_NORMAL: "#F8F8F2", TEXT_MUTED: "#92A2D4", TEXT_LINK: "#FF6BCB",
    MOBILE_CHANNEL_ITEM_BACKGROUND_SELECTED: "#2C294A",
    MENTION_FOREGROUND: "#FF6E6E", BACKGROUND_MENTIONED: "#2C1D2B",
    REDESIGN_BUTTON_PRIMARY_BACKGROUND: "#9A86FD",
    REDESIGN_BUTTON_PRIMARY_PRESSED_BACKGROUND: "#8E7CE9",
    REDESIGN_BUTTON_PRIMARY_TEXT: "#141423", CONTROL_PRIMARY_ICON_ACTIVE: "#141423",
    CONTROL_SECONDARY_TEXT_ACTIVE: "#F8F8F2", CONTROL_SECONDARY_ICON_DEFAULT: "#F8F8F2",
  };
  for (const [key, color] of Object.entries(expected)) {
    assert.equal(generated.semanticColors[key][0], color, key);
  }
});

test("mobile colors follow edits to the Studio configuration", () => {
  const { semanticColors } = exportMobileTheme({ ...config, link: "accent" }, "Violet");
  assert.deepEqual(semanticColors.TEXT_LINK, ["#9A86FD", "#9A86FD"]);
});

test("Violet supplies the mobile chat and settings tokens missing from the legacy aliases", () => {
  const { semanticColors } = exportMobileTheme(config, "Violet");
  const expected = {
    MOBILE_KEYBOARD_GAP_BACKGROUND: "#141423",
    MOBILE_HEADER_BORDER: "#2D2D4E",
    STANDALONE_CHANNEL_HEADER_BORDER: "#2D2D4E",
    TABLEROW_ICON_COLOR_DEFAULT: "#E9E9F4",
    MOBILE_CHATINPUT_BACKGROUND_DEFAULT: "#23233D",
    MOBILE_CHATINPUT_BACKGROUND_ACTIVE: "#2C2C4C",
    MOBILE_CHATINPUT_BORDER_DEFAULT: "#7878B2",
    MOBILE_CHATINPUT_BORDER_ACTIVE: "#9A86FD",
    CHAT_INPUT_ACTION_BUTTON_BACKGROUND: "#23233D",
    CHAT_INPUT_ACTION_BUTTON_ICON_DEFAULT_TINT: "#92A2D4",
    CHAT_INPUT_ICON_DEFAULT_TINT: "#92A2D4",
    CHAT_INPUT_ACTION_ICON_ACTIVE_TINT: "#9A86FD",
    REDESIGN_BUTTON_TERTIARY_PRESSED_TEXT: "#F8F8F2",
  };
  for (const [key, color] of Object.entries(expected)) {
    assert.deepEqual(semanticColors[key], [color, color], key);
  }
});

test("Violet matches the guild channel pane and keeps active and idle labels legible", () => {
  const { semanticColors } = exportMobileTheme(config, "Violet");
  const panel = semanticColors.PANEL_BG;
  const activeName = semanticColors.REDESIGN_CHANNEL_NAME_TEXT;
  const idleName = semanticColors.REDESIGN_CHANNEL_NAME_MUTED_TEXT;
  const selected = semanticColors.MOBILE_CHANNEL_ITEM_BACKGROUND_SELECTED;

  assert.deepEqual(panel, ["#141423", "#141423"]);
  assert.deepEqual(panel, semanticColors.BACKGROUND_BASE_LOW);
  assert.deepEqual(activeName, semanticColors.TEXT_NORMAL);
  assert.deepEqual(idleName, semanticColors.TEXT_MUTED);
  for (const [appearance, background] of panel.entries()) {
    assert.ok(contrast(activeName[appearance], selected[appearance]) >= 4.5, "selected channel name");
    assert.ok(contrast(activeName[appearance], background) >= 4.5, "unread channel name");
    assert.ok(contrast(idleName[appearance], background) >= 4.5, "idle channel name");
  }
});

test("Violet tints the floating profile and navigation controls over dark panes", () => {
  const { semanticColors } = exportMobileTheme(config, "Violet");
  const tint = ["#23233DCC", "#23233DCC"];
  for (const key of ["MOBILE_FLOATINGBAR_BACKGROUND", "MOBILE_FLOATINGBAR_BACKGROUND_NAMEPLATE", "CONTROL_SECONDARY_BACKGROUND_DEFAULT"]) {
    assert.deepEqual(semanticColors[key], tint, key);
  }
  assert.deepEqual(semanticColors.MOBILE_FLOATINGBAR_BACKGROUND_SCRIM, semanticColors.BACKGROUND_BASE_LOWER);
  for (const key of ["CONTROL_SECONDARY_TEXT_DEFAULT", "REDESIGN_BUTTON_TERTIARY_TEXT", "CONTROL_ICON_ONLY_ICON_DEFAULT"]) {
    assert.deepEqual(semanticColors[key], ["#9A86FD", "#9A86FD"], key);
    assert.ok(contrast(semanticColors[key][0], semanticColors.BG_SURFACE_RAISED[0]) >= 4.5, key);
  }
});

test("Violet's smoked unread banner keeps white text and the dismiss icon readable", () => {
  const { semanticColors } = exportMobileTheme(config, "Violet");
  const banner = semanticColors.BACKGROUND_BRAND;
  assert.deepEqual(banner, ["#292646", "#292646"]);
  for (const background of banner) {
    assert.ok(contrast("#FFFFFF", background) >= 4.5);
  }
  for (const key of ["BG_BRAND", "CONTROL_PRIMARY_BACKGROUND_DEFAULT", "REDESIGN_BUTTON_PRIMARY_BACKGROUND", "CHAT_INPUT_SEND_BUTTON_ACTIVE_BACKGROUND"]) {
    assert.deepEqual(semanticColors[key], ["#9A86FD", "#9A86FD"], key);
  }
});

test("Violet carries the chat canvas through the channel header and composer edge", () => {
  const { semanticColors } = exportMobileTheme(config, "Violet");
  const canvas = semanticColors.CHAT_BACKGROUND;
  assert.deepEqual(canvas, ["#141423", "#141423"]);
  assert.deepEqual(semanticColors.STANDALONE_CHANNEL_CONTENT_BACKGROUND, canvas);
  assert.deepEqual(semanticColors.MOBILE_KEYBOARD_GAP_BACKGROUND, canvas);

  for (const [appearance, background] of canvas.entries()) {
    for (const key of ["MOBILE_TEXT_HEADING_PRIMARY", "TEXT_SUBTLE"]) {
      assert.ok(contrast(semanticColors[key][appearance], background) >= 4.5, key);
    }
    for (const key of ["MOBILE_HEADER_ICON_DEFAULT", "NAVIGATOR_HEADER_TINT", "ICON_STRONG", "ICON_SUBTLE", "INTERACTIVE_TEXT_DEFAULT"]) {
      assert.ok(contrast(semanticColors[key][appearance], background) >= 3, key);
    }
  }
});

test("Violet leaves the iOS keyboard paint unset and retains the app's input colors", () => {
  const { semanticColors } = exportMobileTheme(config, "Violet");
  for (const key of ["KEYBOARD", "BACKGROUND_PRIMARY"]) {
    assert.equal(Object.hasOwn(semanticColors, key), false, key);
  }
  for (const key of ["BG_BASE_PRIMARY", "CHAT_BACKGROUND", "MOBILE_KEYBOARD_GAP_BACKGROUND", "INPUT_BACKGROUND_DEFAULT"]) {
    assert.deepEqual(semanticColors[key], ["#141423", "#141423"], key);
  }
  assert.deepEqual(semanticColors.MOBILE_CHATINPUT_BACKGROUND_DEFAULT, ["#23233D", "#23233D"]);
});

function composite(foreground, background) {
  const alpha = Number.parseInt(foreground.slice(7), 16) / 255;
  const channels = [1, 3, 5].map((offset) => {
    const base = Number.parseInt(background.slice(offset, offset + 2), 16);
    const top = Number.parseInt(foreground.slice(offset, offset + 2), 16);
    return Math.round(base + (top - base) * alpha).toString(16).padStart(2, "0");
  });
  return "#" + channels.join("");
}

function contrast(first, second) {
  function luminance(hex) {
    const values = hex.slice(1).match(/../g).map((channel) => Number.parseInt(channel, 16) / 255);
    const [red, green, blue] = values.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  }
  const a = luminance(first) + 0.05;
  const b = luminance(second) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

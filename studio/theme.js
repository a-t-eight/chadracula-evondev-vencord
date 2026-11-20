(function () {
  "use strict";

  const base30 = Object.freeze({
    white: "#F8F8F2",
    darker_black: "#19192C",
    black: "#141423",
    black2: "#1C1C31",
    one_bg: "#23233D",
    one_bg2: "#2B2B4C",
    one_bg3: "#373760",
    grey: "#414171",
    grey_fg: "#4B4B83",
    grey_fg2: "#555594",
    light_grey: "#6060A4",
    red: "#FF5555",
    baby_pink: "#FF6E6E",
    pink: "#FF6BCB",
    line: "#2D2D4E",
    green: "#50FA7B",
    vibrant_green: "#20E3B2",
    nord_blue: "#05C3FF",
    blue: "#2CCCFF",
    yellow: "#F1FA8C",
    sun: "#F2FA95",
    purple: "#BD93F9",
    dark_purple: "#A166F6",
    teal: "#92A2D4",
    orange: "#FFB86C",
    cyan: "#2CCCFF",
    statusline_bg: "#19192C",
    lightbg: "#2B2B4C",
    pmenu_bg: "#9A86FD",
    folder_bg: "#9A86FD",
    violet: "#9A86FD",
    darkgreen: "#1B312E",
    brownred: "#5D2932",
  });

  const base16 = Object.freeze({
    base00: base30.black,
    base01: base30.one_bg,
    base02: base30.one_bg2,
    base03: base30.one_bg3,
    base04: base30.grey,
    base05: "#E9E9F4",
    base06: "#F1F2F8",
    base07: "#F7F7FB",
    base08: "#C197FD",
    base09: base30.orange,
    base0A: "#62D6E8",
    base0B: "#E5C697",
    base0C: "#8BE9FD",
    base0D: base30.vibrant_green,
    base0E: base30.pink,
    base0F: "#7E7EB5",
  });

  const palette = Object.freeze({ base30, base16 });
  const canonicalColors = Object.freeze({ ...base30, ...base16 });
  const themeName = "chadracula";
  const defaultMuted = "teal";
  const defaultAppearanceMode = "dark-only";
  const defaults = Object.freeze({
    accent: "dark_purple",
    text: "warm",
    layout: "framed",
    window: "solid",
    opacity: 90,
    threads: "rainbow",
    link: "sky",
    selection: "tinted",
    mention: "orange",
  });

  function choices(entries) {
    return Object.freeze(Object.entries(entries).map(([value, label]) => Object.freeze({ value, label })));
  }

  const appearances = choices({ light: "Light", ash: "Ash", dark: "Dark", onyx: "Onyx" });
  const options = Object.freeze({
    appearanceMode: choices({
      [defaultAppearanceMode]: "Dark appearances only",
      all: "All appearances (fixed accent)",
      "by-appearance": "Accent by appearance",
    }),
    accent: choices({
      ...Object.fromEntries(Object.keys(canonicalColors).map((name) => [name, name])),
      dark_purple: "Dark purple", violet: "Violet", purple: "Lilac",
      cyan: "Cyan", teal: "Steel blue", vibrant_green: "Mint", pink: "Pink", orange: "Orange",
    }),
    text: choices({ warm: "Warm white", cool: "Cool white" }),
    layout: choices({ framed: "Framed", flat: "Flat" }),
    window: choices({ solid: "Solid", glass: "Glass-ready" }),
    opacity: Object.freeze({ min: 75, max: 100, step: 1 }),
    threads: choices({ rainbow: "Rainbow", accent: "Accent", neutral: "Neutral" }),
    link: choices({ sky: "Sky", cyan: "Cyan", accent: "Accent" }),
    selection: choices({ tinted: "Tinted", neutral: "Neutral", accent: "Accent" }),
    mention: choices({ orange: "Orange", violet: "Violet", cyan: "Cyan" }),
  });

  const palettePrefix = "palette:";

  function paletteGroups(prefix) {
    return Object.freeze(Object.entries({ Base30: base30, Base16: base16 }).map(([label, colors]) => Object.freeze({
      label,
      options: Object.freeze(Object.entries(colors).map(([key, color]) => Object.freeze({
        value: prefix + key, label: key, color,
      }))),
    })));
  }

  const accentPalette = paletteGroups("");
  const rolePalette = paletteGroups(palettePrefix);
  const useDefault = choices({ "": "Default" });

  function colorRole(key, { group, cssRole = key, recommended = options[key] } = {}) {
    return Object.freeze({ key, group, cssRole, recommended, palette: key === "accent" ? accentPalette : rolePalette });
  }

  const colorRoles = Object.freeze({
    accent: colorRole("accent", { recommended: choices({}) }),
    text: colorRole("text"),
    threads: colorRole("threads", { cssRole: "thread-1" }),
    link: colorRole("link"),
    selection: colorRole("selection", { cssRole: "selected" }),
    mention: colorRole("mention"),
    "surface-canvas": colorRole("canvas", { group: "surfaces", recommended: useDefault }),
    "surface-sidebar": colorRole("sidebar", { group: "surfaces", recommended: useDefault }),
    "surface-raised": colorRole("raised", { group: "surfaces", recommended: useDefault }),
    "surface-rail": colorRole("rail", { group: "surfaces", recommended: useDefault }),
    "surface-input": colorRole("input", { group: "surfaces", recommended: useDefault }),
    "foreground-text": colorRole("text", { group: "foregrounds", recommended: choices({ "": "Use text preference" }) }),
    "foreground-muted": colorRole("muted", { group: "foregrounds", recommended: useDefault }),
  });

  function normalizeHex(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : undefined;
  }

  function paletteColor(value, accent = false) {
    if (typeof value !== "string" || (!accent && !value.startsWith(palettePrefix))) return undefined;
    const key = accent ? value : value.slice(palettePrefix.length);
    return Object.hasOwn(canonicalColors, key) ? canonicalColors[key] : undefined;
  }

  function resolveColor(value, accent = false) {
    return normalizeHex(value) ?? paletteColor(value, accent);
  }

  function normalizeColorChoice(role, value) {
    const settings = role.key === "accent" ? options.accent : role.recommended;
    if (settings.some((option) => option.value === value)) return value;
    return normalizeHex(value) ?? (role.key !== "accent" && paletteColor(value) ? value : undefined);
  }

  function colorOverrides(values, group) {
    const result = {};
    for (const role of Object.values(colorRoles)) {
      if (role.group !== group) continue;
      const choice = normalizeColorChoice(role, values?.[role.key]);
      if (choice) result[role.key] = choice;
    }
    return result;
  }

  function normalizeConfig(config) {
    const result = { ...defaults };
    if (!config || typeof config !== "object") return result;

    for (const [key, settings] of Object.entries(options)) {
      if (key === "appearanceMode" && config[key] === defaultAppearanceMode) continue;
      if (Object.hasOwn(colorRoles, key)) {
        result[key] = normalizeColorChoice(colorRoles[key], config[key]) ?? result[key];
      } else if (Array.isArray(settings) && settings.some(({ value }) => value === config[key])) {
        result[key] = config[key];
      }
    }

    const opacity = typeof config.opacity === "string" && /^\d+(?:\.\d+)?$/.test(config.opacity)
      ? Number(config.opacity)
      : config.opacity;
    if (Number.isFinite(opacity)) {
      result.opacity = Math.min(options.opacity.max, Math.max(options.opacity.min, Math.round(opacity)));
    }

    const surfaces = colorOverrides(config.surfaces, "surfaces");
    const foregrounds = colorOverrides(config.foregrounds, "foregrounds");
    if (Object.keys(surfaces).length) result.surfaces = surfaces;
    if (Object.keys(foregrounds).length) result.foregrounds = foregrounds;

    const appearanceAccents = {};
    for (const { value } of appearances) {
      const choice = normalizeColorChoice(colorRoles.accent, config.appearanceAccents?.[value]);
      if (choice) appearanceAccents[value] = choice;
      else if (result.appearanceMode === "by-appearance") appearanceAccents[value] = result.accent;
    }
    if (Object.keys(appearanceAccents).length) result.appearanceAccents = appearanceAccents;
    return result;
  }

  function exportMetadata(config) {
    const { accent, layout, window } = config;
    const colorLabel = (choice) => choice.replace(/^palette:/, "").replaceAll("_", " ").toLowerCase();
    const accentLabel = colorLabel(accent);
    const mutedLabel = colorLabel(config.foregrounds?.muted ?? defaultMuted);
    let accentName = accentLabel;
    let accentDescription = accentLabel;
    if (config.appearanceMode === "all") {
      accentName = `${accentLabel}-all-appearances`;
      accentDescription = `${accentLabel} across all Discord appearances`;
    } else if (config.appearanceMode === "by-appearance") {
      accentName = "appearance-accents";
      accentDescription = appearances.map(({ value, label }) => `${colorLabel(config.appearanceAccents[value])} on ${label}`).join(", ");
    }
    const name = [themeName, accentName, window, layout, mutedLabel].join("-").replaceAll(" ", "-").replaceAll("#", "");
    const description = `${accentDescription}, ${mutedLabel} muted text, ${layout}, ${window}, supports transparency - adapted chadracula-evondev for discord`;
    return { name, description };
  }

  function exportIdentity(input) {
    const { name } = exportMetadata(normalizeConfig(input));
    return { name, filename: `${name}.theme.css` };
  }

  function getColorChoice(input, id) {
    if (!Object.hasOwn(colorRoles, id)) return undefined;
    const config = normalizeConfig(input);
    const { key, group } = colorRoles[id];
    if (group) return config[group]?.[key] ?? "";
    return id === "text" ? config.foregrounds?.text ?? config.text : config[key];
  }

  function setColorChoice(input, id, value) {
    const config = normalizeConfig(input);
    if (!Object.hasOwn(colorRoles, id)) return config;
    const role = colorRoles[id];
    const choice = normalizeColorChoice(role, value);
    if (choice === undefined) return config;
    const { key, group } = role;
    if (group) {
      config[group] = { ...config[group], [key]: choice };
    } else {
      config[key] = choice;
      if (id === "text") delete config.foregrounds?.text;
    }
    return normalizeConfig(config);
  }

  function inputColor(config, id, roles) {
    if (!Object.hasOwn(colorRoles, id)) return undefined;
    const choice = getColorChoice(config, id);
    return resolveColor(choice, id === "accent")
      ?? (roles ?? roleValues(config))[`--chad-${colorRoles[id].cssRole}`];
  }

  function channels(hex) {
    return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  }

  function mix(from, to, amount) {
    const target = channels(to);
    const result = channels(from).map((channel, index) => (
      Math.round(channel + (target[index] - channel) * amount).toString(16).padStart(2, "0")
    ));
    return "#" + result.join("").toUpperCase();
  }

  function luminance(hex) {
    const linear = channels(hex).map((channel) => {
      const srgb = channel / 255;
      return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  }

  function contrast(first, second) {
    const a = luminance(first) + 0.05;
    const b = luminance(second) + 0.05;
    return a > b ? a / b : b / a;
  }

  function onColor(color) {
    const preferred = contrast(base30.black, color) >= contrast(base30.white, color) ? base30.black : base30.white;
    if (contrast(preferred, color) >= 4.5) return preferred;
    return contrast("#000000", color) > contrast("#FFFFFF", color) ? "#000000" : "#FFFFFF";
  }

  function adjustColor(color, target, meetsRequirement) {
    if (meetsRequirement(color)) return color;
    for (let step = 1; step <= 20; step += 1) {
      const candidate = mix(color, target, step / 20);
      if (meetsRequirement(candidate)) return candidate;
    }
    return target;
  }

  function roleValues(input, appearance = "dark") {
    const config = normalizeConfig(input);
    const c = base30;
    const b = base16;
    const opacity = config.window === "glass" ? config.opacity / 100 : 1;
    const surfaces = {
      canvas: b.base00,
      sidebar: c.darker_black,
      rail: c.darker_black,
      raised: c.one_bg,
      input: c.black2,
      ...config.surfaces,
    };
    for (const key of Object.keys(surfaces)) {
      const color = paletteColor(surfaces[key]) ?? surfaces[key];
      surfaces[key] = adjustColor(color, b.base00, (color) => (
        luminance(color) <= 0.055 && contrast(mix(color, "#FFFFFF", 1 - opacity), "#FFFFFF") >= 4.5
      ));
    }

    const backgrounds = Object.values(surfaces);
    // A white host backdrop provides a conservative check for small, light text.
    for (const surface of [surfaces.canvas, surfaces.sidebar, surfaces.rail]) {
      backgrounds.push(mix(surface, "#FFFFFF", 1 - opacity), mix(surface, "#000000", 1 - opacity));
    }

    const appearanceAccent = config.appearanceMode === "by-appearance" && Object.hasOwn(config.appearanceAccents, appearance)
      ? config.appearanceAccents[appearance]
      : config.accent;
    const accent = resolveColor(appearanceAccent, true);
    const accentInk = onColor(accent);
    const accentStateTarget = contrast(accentInk, mix(accent, accentInk, 0.09)) >= 4.5
      ? accentInk
      : luminance(accentInk) < 0.1 ? "#FFFFFF" : "#000000";
    const selectionFill = resolveColor(config.selection) ?? (config.selection === "accent" ? accent : undefined);
    const selection = selectionFill ?? (config.selection === "neutral" ? c.one_bg3 : mix(surfaces.sidebar, accent, 0.18));
    const selectedSurface = selectionFill ? mix(surfaces.sidebar, selectionFill, 0.27) : selection;
    const hover = mix(surfaces.sidebar, c.light_grey, 0.23);
    const active = mix(surfaces.sidebar, c.light_grey, 0.32);
    const mentionColor = resolveColor(config.mention) ?? c[config.mention];
    const mentionBg = mix(surfaces.canvas, mentionColor, 0.1);
    const mentionHover = mix(surfaces.canvas, mentionColor, 0.17);
    const mentionChip = mix(surfaces.canvas, mentionColor, 0.21);
    backgrounds.push(hover, active, selectedSurface, mentionHover, mentionChip);
    const readable = (color, surfaces = backgrounds) => adjustColor(color, "#FFFFFF", (candidate) => (
      surfaces.every((background) => contrast(candidate, background) >= 4.5)
    ));

    const accentText = readable(accent);
    const textChoice = config.foregrounds?.text ?? config.text;
    const text = readable(resolveColor(textChoice) ?? (textChoice === "warm" ? c.white : b.base05));
    const muted = readable(resolveColor(config.foregrounds?.muted) ?? c[defaultMuted]);
    const threadSurfaces = [surfaces.sidebar, mix(surfaces.sidebar, "#FFFFFF", 1 - opacity), hover, active];
    const threadChoice = resolveColor(config.threads);
    const singleThread = threadChoice ? readable(threadChoice, threadSurfaces)
      : config.threads === "neutral" ? muted : accentText;
    const threadColors = config.threads === "rainbow"
      ? [c.red, c.orange, c.yellow, c.green, c.blue, c.purple].map((color) => readable(color, threadSurfaces))
      : Array(6).fill(singleThread);
    const linkChoice = resolveColor(config.link) ?? (config.link === "cyan" ? c.cyan : b.base0C);

    const roles = {
      ...surfaces,
      text,
      muted,
      "subtle-text": readable(b.base05),
      border: c.line,
      "control-border": adjustColor(c.light_grey, "#FFFFFF", (color) => (
        backgrounds.every((background) => contrast(color, background) >= 3)
      )),
      hover,
      active,
      accent,
      "accent-text": accentText,
      "on-accent": accentInk,
      "accent-hover": mix(accent, accentStateTarget, 0.05),
      "accent-active": mix(accent, accentStateTarget, 0.09),
      link: config.link === "accent" ? accentText : readable(linkChoice),
      selected: selection,
      "selected-text": selectionFill ? onColor(selectionFill) : text,
      "selected-surface": selectedSurface,
      mention: readable(mentionColor),
      "mention-bg": mentionBg,
      "mention-hover": mentionHover,
      "mention-chip-bg": mentionChip,
      success: readable(c.green),
      danger: readable(c.baby_pink),
      warning: readable(c.yellow),
      info: readable(b.base0A),
      "danger-bg": c.brownred,
      "danger-hover": mix(c.brownred, c.baby_pink, 0.07),
      "danger-active": mix(c.brownred, c.baby_pink, 0.14),
      "success-bg": c.darkgreen,
      "pane-radius": config.layout === "framed" ? "10px" : "0px",
      "pane-frame": config.layout === "framed" ? "inset 0 0 0 1px var(--chad-border)" : "none",
      "pane-border": config.layout === "framed" ? "var(--chad-border)" : "transparent",
      "window-opacity": String(opacity),
      "syntax-comment": adjustColor(b.base0F, "#FFFFFF", (color) => contrast(color, surfaces.input) >= 4.5),
      "syntax-keyword": readable(c.pink, [surfaces.input]),
      "syntax-string": readable(b.base0B, [surfaces.input]),
      "syntax-function": readable(c.green, [surfaces.input]),
      "syntax-call": readable(c.vibrant_green, [surfaces.input]),
      "syntax-builtin": readable(c.cyan, [surfaces.input]),
      "syntax-type": readable(c.blue, [surfaces.input]),
      "syntax-number": readable(c.purple, [surfaces.input]),
      "syntax-constant": readable(c.violet, [surfaces.input]),
      "syntax-operator": readable(b.base08, [surfaces.input]),
      "thread-single": singleThread,
    };

    threadColors.forEach((color, index) => { roles[`thread-${index + 1}`] = color; });
    return Object.fromEntries(Object.entries(roles).map(([key, value]) => [`--chad-${key}`, value]));
  }

  // The semantic token names and current selectors below were checked against Discord web build 675174.
  // Older Visual Refresh aliases cover the September 2026 desktop snapshots in the workspace.
  const discordAppearances = {
    light: ".theme-light",
    ash: ".theme-dark",
    dark: ".theme-darker",
    onyx: ".theme-midnight, .theme-amoled",
  };
  const { light, ash, dark, onyx } = discordAppearances;
  const darkAppearances = [ash, dark, onyx].join(", ");
  const darkAppearanceSelector = `:is(${darkAppearances})`;
  const excludedSubtrees = [".custom-user-profile-theme", ".enable-forced-colors"];
  const excludeDescendants = `:not(${excludedSubtrees.flatMap((selector) => [selector, `${selector} *`]).join(", ")})`;
  const themeScope = `${darkAppearanceSelector}${excludeDescendants}`;
  const view = `${themeScope} #app-mount`;
  const discordRoles = {
    rail: "app-frame-background background-base-lowest background-tertiary bg-base-tertiary",
    canvas: "background-base-lower background-primary bg-base-primary",
    sidebar: "background-base-low background-secondary bg-base-secondary channel-background-default custom-channel-members-bg",
    input: "chat-background-default channeltextarea-background input-background input-background-default background-code card-secondary-bg",
    raised: "background-surface-high background-surface-higher background-surface-highest background-floating background-nested-floating background-accent background-secondary-alt bg-surface-overlay bg-surface-raised card-primary-bg modal-background modal-footer-background autocomplete-bg card-background-default",
    border: "app-frame-border border-faint border-muted border-subtle border-normal",
    "control-border": "border-strong input-border input-border-default input-border-hover checkbox-border-default checkbox-border-hover scrollbar-auto-thumb scrollbar-thin-thumb scrollbar-auto-scrollbar-color-thumb control-primary-border-default control-primary-border-hover control-primary-border-active button-filled-brand-border",
    text: "text-default text-normal text-primary text-strong text-code header-primary interactive-active interactive-hover interactive-text-active interactive-text-hover interactive-icon-active interactive-icon-hover input-text-default input-text-error-default icon-strong control-critical-primary-text-default control-critical-primary-text-hover control-critical-primary-text-active control-critical-primary-icon-default control-critical-primary-icon-hover control-critical-primary-icon-active",
    "subtle-text": "text-secondary text-subtle header-secondary icon-primary icon-default",
    muted: "text-muted text-tertiary text-low-contrast channels-default channel-icon channel-text-area-placeholder chat-text-muted input-placeholder-text-default interactive-text-default interactive-normal interactive-icon-default icon-secondary icon-tertiary icon-subtle icon-muted input-icon-default",
    link: "text-link text-link-low-saturation icon-link text-code-link",
    accent: "background-brand bg-brand control-primary-background-default button-filled-brand-background checkbox-background-selected-default",
    "accent-hover": "control-primary-background-hover button-filled-brand-background-hover checkbox-background-selected-hover",
    "accent-active": "control-primary-background-active button-filled-brand-background-active checkbox-background-active",
    "accent-text": "text-brand icon-brand control-brand-foreground control-brand-foreground-new selected-tab-item-color border-focus input-border-active",
    "on-accent": "control-primary-text-default control-primary-text-hover control-primary-text-active control-primary-icon-default control-primary-icon-hover control-primary-icon-active button-filled-brand-text checkbox-icon-active",
    hover: "background-modifier-hover background-mod-muted background-mod-subtle interactive-background-hover message-background-hover background-message-hover control-secondary-background-hover control-icon-only-background-hover button-outline-brand-background-hover",
    active: "background-modifier-active background-mod-normal interactive-background-active control-secondary-background-active control-icon-only-background-active",
    "selected-surface": "background-modifier-selected background-mod-strong interactive-background-selected interactive-accent-background-selected interactive-accent-background-hover interactive-accent-background-active message-highlight-background-default background-message-highlight",
    mention: "mention-foreground",
    "mention-bg": "message-mentioned-background-default background-mentioned",
    "mention-hover": "message-mentioned-background-hover background-mentioned-hover",
    "mention-chip-bg": "mention-background",
    success: "text-feedback-positive text-positive icon-feedback-positive status-positive status-speaking icon-voice-speaking icon-status-online",
    danger: "text-feedback-critical text-danger icon-feedback-critical status-danger icon-status-dnd",
    warning: "text-feedback-warning text-warning icon-feedback-warning status-warning icon-status-idle",
    info: "text-feedback-info icon-feedback-info",
    "danger-bg": "background-feedback-mod-critical background-code-deletion control-critical-primary-background-default button-danger-background",
    "danger-hover": "control-critical-primary-background-hover button-danger-background-hover",
    "danger-active": "control-critical-primary-background-active button-danger-background-active",
    "success-bg": "background-feedback-mod-positive background-code-addition",
    "syntax-comment": "text-code-comment",
    "syntax-keyword": "text-code-keyword text-code-tag text-code-escape",
    "syntax-string": "text-code-string text-code-regexp",
    "syntax-function": "text-code-title",
    "syntax-call": "text-code-attribute text-code-property",
    "syntax-builtin": "text-code-builtin text-code-bullet",
    "syntax-type": "text-code-type",
    "syntax-number": "text-code-number",
    "syntax-constant": "text-code-decorator",
    "syntax-operator": "text-code-operator",
  };

  const serverRail = ":is(.wrapper_5dqHTG, .wrapper_ef3116)";
  const appBar = ":is(.bar_3zSH5d, .bar_c38106)";
  const sidebarList = ":is(.sidebarList_pog62O, .sidebarList_c48ade)";
  const sidebarShell = ":is(.sidebar_pog62O, .sidebar_c48ade)";
  const sidebarBanner = ':is([class^="bannerImage_"], [class*=" bannerImage_"])';
  const channelListPaint = ":is(.guildSidebar_iar92T, .scroller_Bce46W, .container__2637a, .scroller__629e4, .scroller__99e7c)";
  const chat = ":is(.chat_z_gUBg, .chat_f75fb0)";
  const chatRow = ":is(.content_z_gUBg, .content_f75fb0)";
  const chatContent = ":is(.chatContent_z_gUBg, .chatContent_f75fb0)";
  const channelHeader = ":is(.themed_ybUK7Z, .themed__9293f)";
  const headerWrapper = ":is(.subtitleContainer_z_gUBg, .subtitleContainer_f75fb0)";
  const friends = ":is(.container_zrUwGA, .container__133bf)";
  const friendsBody = ":is(.tabBody_zrUwGA, .tabBody__133bf)";
  const friendsActivity = ":is(.nowPlayingColumn_zrUwGA, .nowPlayingColumn__133bf)";
  const mainPage = ":is(.page_pog62O, .page__5e434)";
  const mainHeader = `:is(${channelHeader}, .header_iar92T)`;
  const mainOverlay = ':is([role="dialog"], [role="alertdialog"], [role="menu"])';
  const mainRegion = `:is(${chat}, ${friends}, ${mainPage}, ${mainPage} > :not(${mainOverlay}))`;
  const mainHead = `:is(${mainHeader}, ${headerWrapper})`;
  const splitChat = `${chat}:has(> ${chatContent}, > ${chatRow} ${chatContent})`;
  const framedChat = `${splitChat}:has(> ${channelHeader}, > ${headerWrapper} > ${channelHeader})`;
  const framedMain = `${mainRegion}:has(> ${mainHeader}, > ${headerWrapper} > ${mainHeader})`;
  const framedSinglePane = `${framedMain}:not(${splitChat})`;
  const privateList = ":is(.privateChannels_u88IQl, .privateChannels__35e86)";
  const dmSearchRow = ":is(.searchBar_u88IQl, .searchBar__35e86)";
  const visibleDMSearch = `${sidebarShell}:not([data-collapsed="true"]) ${sidebarList} > ${privateList} > ${dmSearchRow}:not([hidden], [hidden] *, [aria-hidden="true"], [aria-hidden="true"] *)`;
  const memberPanel = ":is(.container_86es0b, .container_c8ffbb, .membersWrap_86es0b:not(.container_86es0b *), .membersWrap_c8ffbb:not(.container_c8ffbb *))";
  const joinedRoster = `${memberPanel}:not([hidden], [aria-hidden="true"])`;
  const memberListPaint = ":is(.members_86es0b, .member_86es0b, .members_c8ffbb, .member_c8ffbb)";
  const backdropLayer = ":is(.bg_Fd0FEH, .bg__960e4)";
  const mentionStripe = ":is(.mentioned_SY_P2T, .mentioned__5126c)";

  function threadRules() {
    // Discord groups nested thread rows beneath a channel. Only those list items get rainbow colors.
    const row = `${sidebarList} ul[class^="content_"] > li[class^="container_"] > ul[role="group"] > li`;
    const rainbow = Array.from({ length: 6 }, (_, index) => (
      `${view} ${row}:nth-of-type(6n + ${index + 1}) {\n  --channels-default: var(--chad-thread-${index + 1});\n}\n`
    )).join("");
    return `${rainbow}
${view} ${row}:only-of-type {
  --channels-default: var(--chad-thread-single);
}
`;
  }

  function discordCSS(framed) {
    return `
/* Main panes use one paint layer each. Layout controls affect decoration only. */
${view} ${backdropLayer} {
  background: var(--chad-rail);
}
${framed ? "" : `
${view} ${serverRail},
${view} ${appBar} {
  background-color: var(--chad-rail);
}
`}
${view} ${sidebarList} {
  background-color: var(--chad-sidebar);
  border-color: var(--chad-pane-border);${framed ? "" : `
  border-start-start-radius: var(--chad-pane-radius);
  box-shadow: var(--chad-pane-frame);`}
}

${view} ${privateList},
${view} ${sidebarList} ${channelListPaint} {
  background: transparent;
}

${view} ${chat} {
  background: var(--chad-canvas);
  border-color: var(--chad-pane-border);
  border-start-start-radius: var(--chad-pane-radius);
}

${view} ${chatContent} {
  background: transparent;
  box-shadow: var(--chad-pane-frame);
}

${view} ${channelHeader} {
  --__header-bar-background: var(--chad-sidebar);
  background: var(--__header-bar-background);
  border-bottom-color: var(--chad-pane-border);
}

${view} ${memberPanel} {
  background: var(--chad-sidebar);
  border-color: var(--chad-pane-border);
}

${view} ${memberPanel} ${memberListPaint} {
  background: transparent;
}

${view} :is(.container_zrUwGA, .container__133bf) {
  background: var(--chad-canvas);
}

${view} :is(.searchResultsWrap_QHVbp3, .searchResultsWrap_a9e706) {
  background: var(--chad-sidebar);
}

/* Discord's filled legacy controls sometimes read a generic white token.
   Scope ink corrections here, preserving identity and unrelated overlays. */
${view} :is(.tabBar_zrUwGA, .tabBar__133bf) :is(.addFriend_zrUwGA, .addFriend__133bf):not([aria-selected="true"]),
${view} :is(.tabBar_zrUwGA, .tabBar__133bf) :is(.addFriend_zrUwGA, .addFriend__133bf):not([aria-selected="true"]):hover {
  color: var(--chad-on-accent);
}

${view} :is(.lookFilled_9OQtot, .lookFilled__201d5):is(.colorRed_9OQtot, .colorRed__201d5) {
  color: var(--chad-base30-white);
}

${view} :is(.lookOutlined_9OQtot, .lookOutlined__201d5):is(.colorRed_9OQtot, .colorRed__201d5) {
  color: var(--chad-danger);
}

${view} :is(.lookFilled_9OQtot, .lookFilled__201d5):is(.colorLink_9OQtot, .colorLink__201d5) {
  background: var(--chad-selected-surface);
  color: var(--chad-link);
}

${view} .lookFilled_9OQtot:is(.colorBrandInverted_9OQtot, .colorWhite_9OQtot) {
  --control-primary-text-default: var(--chad-base30-black);
}

${view} :is(.lookLink_9OQtot, .lookLink__201d5):is(.colorBrand_9OQtot, .colorBrand__201d5) {
  --brand-500: var(--chad-accent-text);
}

/* Use the chosen selection fill for explicit navigation rows and leave
   generic interactive backgrounds safe for controls with independent ink. */
${view} ${privateList} :is(.selected_J1Adu_ .childContainer_J1Adu_, .selected_bf202d),
${view} ${sidebarList} :is(.modeSelected__2ea32 .link__2ea32, a[aria-current="page"][href^="/channels/"]) {
  --channels-default: var(--chad-selected-text);
  --interactive-text-active: var(--chad-selected-text);
  --interactive-icon-active: var(--chad-selected-text);
  --icon-strong: var(--chad-selected-text);
  --text-default: var(--chad-selected-text);
  --text-strong: var(--chad-selected-text);
  background-color: var(--chad-selected);
  color: var(--chad-selected-text);
}

/* Highlight messages without changing the actual sender color. */
${view} ${mentionStripe}::before {
  background-color: var(--chad-mention);
}

${view} :is(.markup_ku1OHH, .markup__75297) :is(pre code, code.inline) {
  background-color: var(--chad-input);
  color: var(--chad-text);
}

/* Highlight.js fallback used by older and some embedded code views. */
${view} .hljs-comment,
${view} .hljs-quote { color: var(--chad-syntax-comment); }
${view} .hljs-keyword,
${view} .hljs-selector-tag,
${view} .hljs-meta .hljs-keyword { color: var(--chad-syntax-keyword); }
${view} .hljs-string,
${view} .hljs-regexp { color: var(--chad-syntax-string); }
${view} .hljs-title.function_,
${view} .hljs-function > .hljs-title { color: var(--chad-syntax-function); }
${view} .hljs-property,
${view} .hljs-variable.function_ { color: var(--chad-syntax-call); }
${view} .hljs-built_in { color: var(--chad-syntax-builtin); }
${view} .hljs-type,
${view} .hljs-title.class_ { color: var(--chad-syntax-type); }
${view} .hljs-number { color: var(--chad-syntax-number); }
${view} .hljs-literal,
${view} .hljs-symbol { color: var(--chad-syntax-constant); }
${view} .hljs-addition { color: var(--chad-success); background-color: var(--chad-success-bg); }
${view} .hljs-deletion { color: var(--chad-danger); background-color: var(--chad-danger-bg); }

${threadRules().trimEnd()}
`;
  }

  const transparentGuildNavCSS = `/* Discord's guild navigation paints its full-height background from this fallback. */
${view} ${sidebarList} > nav:has(> #channels) {
  --background-base-lowest: transparent;
}
`;

  function nativeGlassCSS(framed) {
    const sidebarFill = framed ? "var(--chad-sidebar-paint)" : "var(--chad-glass-sidebar)";
    return `
/* Renderer transparency. Select a native backdrop in your desktop client.
   Apply tint to sibling panes and clear only ancestor paint layers. */
:is(html, body)${darkAppearanceSelector},
html${darkAppearanceSelector} > body,
${darkAppearanceSelector} #app-mount {
  background-color: transparent;
}
${framed ? "" : `
${view} {
  --chad-glass-sidebar: color-mix(in srgb, var(--chad-sidebar) calc(var(--chad-window-opacity) * 100%), transparent);
}
`}
${view} :is(.app_YRXZu0, .app_QbT-Jy, .app__160d8, .app_b1f720),
${view} ${backdropLayer},
${view} ${sidebarShell},
${view} ${sidebarShell}::after {
  background: transparent;
}
${framed ? "" : `
${view} ${serverRail},
${view} ${appBar} {
  background-color: color-mix(in srgb, var(--chad-rail) calc(var(--chad-window-opacity) * 100%), transparent);
}
`}
${transparentGuildNavCSS}
${framed ? "" : `/* The border image fills the entire rectangle, including outside the rounded
   corner. An inset outline draws the curved frame over that single tint. */
`}${view} ${sidebarList} {
${framed ? `  background-color: ${sidebarFill};` : `  background-color: transparent;
  border-image: linear-gradient(${sidebarFill}, ${sidebarFill}) 0 fill / 0;
  box-shadow: none;
  outline: 1px solid var(--chad-pane-border);
  outline-offset: -1px;`}
}

${view} ${channelHeader} {
  --__header-bar-background: ${sidebarFill};
}

${view} ${memberPanel} {
  background-color: ${sidebarFill};
}

${view} ${chat},
${view} ${chatContent},
${view} :is(.container_zrUwGA, .container__133bf) {
  background: color-mix(in srgb, var(--chad-canvas) calc(var(--chad-window-opacity) * 100%), transparent);
}

/* The message canvas and the member roster are siblings in a normal chat.
   Keep their common background clear so the two tints never stack. */
${view} ${splitChat} {
  background: transparent;
}
`;
  }

  // Theme uniformity optimisations. Each tile paints one colour through the
  // configured opacity. The line occupies the same one-pixel inset as the frame.
  const frameRadius = "var(--chad-pane-radius)";
  const frameLine = "var(--chad-pane-border)";
  const sidebarPaint = "var(--chad-sidebar-paint)";
  const railPaint = "var(--chad-rail-paint)";
  const canvasPaint = "var(--chad-canvas-paint)";
  const inlineStart = "var(--chad-inline-start)";
  const inlineEnd = "var(--chad-inline-end)";

  function frameCorner(inline, block, oppositeInline, oppositeBlock, fill = sidebarPaint, radius = frameRadius, line = frameLine, position = `${inline} ${block}`) {
    return `radial-gradient(circle at ${oppositeInline} ${oppositeBlock},
    ${fill} calc(${radius} - 1.25px),
    ${line} calc(${radius} - 0.75px) calc(${radius} - 0.25px),
    ${railPaint} calc(${radius} + 0.25px)) ${position} / ${radius} ${radius} no-repeat`;
  }

  const topStartCorner = frameCorner(inlineStart, "top", inlineEnd, "bottom");
  const topEndCorner = frameCorner(inlineEnd, "top", inlineStart, "bottom");
  const bottomStartCorner = (fill) => frameCorner(inlineStart, "bottom", inlineEnd, "top", fill);
  const bottomEndCorner = (fill) => frameCorner(inlineEnd, "bottom", inlineStart, "top", fill);
  const topEdge = `linear-gradient(to bottom, ${frameLine} 1px, ${sidebarPaint} 1px)`;
  const bottomEdge = (fill) => `linear-gradient(to top, ${frameLine} 1px, ${fill} 1px)`;
  const solidEdge = `linear-gradient(${frameLine}, ${frameLine})`;
  const middleSideEdges = (fill) => `linear-gradient(to right, ${frameLine} 1px, ${fill} 1px calc(100% - 1px), ${frameLine} calc(100% - 1px))`;
  const middleBand = `calc(100% - ${frameRadius} * 2)`;

  function lowerPanelPaint(fill, roundStart, roundEnd) {
    const start = roundStart ? frameRadius : "1px";
    const end = roundEnd ? frameRadius : "1px";
    return [
      roundStart ? bottomStartCorner(fill) : `${solidEdge} ${inlineStart} bottom / 1px ${frameRadius} no-repeat`,
      roundEnd ? bottomEndCorner(fill) : `${solidEdge} ${inlineEnd} bottom / 1px ${frameRadius} no-repeat`,
      `${bottomEdge(fill)} ${inlineStart} ${start} bottom 0 / calc(100% - ${start} - ${end}) ${frameRadius} no-repeat`,
      `${solidEdge} center top / 100% 1px no-repeat`,
      `${middleSideEdges(fill)} left 0 top 1px / 100% calc(100% - ${frameRadius} - 1px) no-repeat`,
    ].join(",\n  ");
  }

  const flatRailRadius = "10px";
  const flatTopSize = "var(--chad-flat-top-edge-size, 0px)";
  const flatHeaderInset = "var(--chad-flat-header-inset, 0px)";
  const railLine = "var(--chad-border)";
  const flatRailSide = `linear-gradient(to ${inlineEnd}, ${railLine} 1px, ${sidebarPaint} 1px)`;

  function flatTopPaint(inline, opposite, fill, line = fill, inset = "0px") {
    const radius = flatRailRadius;
    const corner = `${inline} 0 top calc(0px - ${inset})`;
    return [
      frameCorner(inline, "top", opposite, "bottom", fill, radius, line, corner),
      `linear-gradient(${fill}, ${fill}) ${opposite} top / calc(100% - ${radius}) calc(${radius} - ${inset}) no-repeat`,
      `linear-gradient(${fill}, ${fill}) center bottom / 100% calc(100% - ${radius} + ${inset}) no-repeat`,
    ].join(",\n  ");
  }

  const uniformityPaint = Object.freeze({
    sidebar: [
      topStartCorner, topEndCorner, bottomStartCorner(sidebarPaint), bottomEndCorner(sidebarPaint),
      `${topEdge} center top / ${middleBand} ${frameRadius} no-repeat`,
      `${middleSideEdges(sidebarPaint)} center center / 100% ${middleBand} no-repeat`,
      `${bottomEdge(sidebarPaint)} center bottom / ${middleBand} ${frameRadius} no-repeat`,
    ].join(",\n  "),
    header: [
      topStartCorner, topEndCorner,
      `${topEdge} center top / ${middleBand} ${frameRadius} no-repeat`,
      `${bottomEdge(sidebarPaint)} center bottom / calc(100% - 2px) calc(100% - ${frameRadius}) no-repeat`,
      `${solidEdge} ${inlineStart} bottom / 1px calc(100% - ${frameRadius}) no-repeat`,
      `${solidEdge} ${inlineEnd} bottom / 1px calc(100% - ${frameRadius}) no-repeat`,
    ].join(",\n  "),
    chat: lowerPanelPaint(canvasPaint, true, true),
    chatWithRoster: lowerPanelPaint(canvasPaint, true, false),
    roster: lowerPanelPaint(sidebarPaint, false, true),
    flatSidebar: [
      frameCorner(inlineStart, "top", inlineEnd, "bottom", sidebarPaint, flatRailRadius, railLine),
      frameCorner(inlineStart, "bottom", inlineEnd, "top", sidebarPaint, flatRailRadius, railLine),
      `${flatRailSide} ${inlineStart} center / ${flatRailRadius} calc(100% - ${flatRailRadius} * 2) no-repeat`,
      `linear-gradient(${sidebarPaint}, ${sidebarPaint}) ${inlineEnd} 0 top ${flatTopSize} / calc(100% - ${flatRailRadius}) calc(100% - ${flatTopSize}) no-repeat`,
      `linear-gradient(${railLine}, ${railLine}) ${inlineEnd} top / calc(100% - ${flatRailRadius}) ${flatTopSize} no-repeat`,
    ].join(",\n  "),
  });

  function uniformityCSS(glass) {
    const fill = (color) => glass
      ? `color-mix(in srgb, var(--chad-${color}) calc(var(--chad-window-opacity) * 100%), transparent)`
      : `var(--chad-${color})`;
    const railShell = `${sidebarShell}:has(${serverRail})`;
    return `
/* Theme uniformity optimisations. Share the title bar's rail fill at the pane
   corners and below the account controls. Each surface paints one tint. */
${view} {
  --chad-rail-paint: ${fill("rail")};
  --chad-sidebar-paint: ${fill("sidebar")};
  --chad-canvas-paint: ${fill("canvas")};
  --chad-inline-start: left;
  --chad-inline-end: right;
}

${view}:dir(rtl) {
  --chad-inline-start: right;
  --chad-inline-end: left;
}

${view} ${serverRail},
${view} ${appBar} {
  background-color: ${railPaint};
}

/* The guild scroller fades near the account card. Paint its fixed-width
   column on the shell so the tint continues through the fade and footer. */
${view} ${railShell} {
  background: linear-gradient(${railPaint}, ${railPaint}) ${inlineStart} top / var(--custom-guild-list-width) 100% no-repeat;
}

${view} ${railShell} ${serverRail},
${view} ${railShell}::after {
  background: transparent;
}
${glass ? "" : `\n${transparentGuildNavCSS}`}`;
  }

  const guildSidebar = `${sidebarList}:has(> nav:not([hidden]) > #channels)`;
  const friendsHeaderAlignmentCSS = `/* The DM sidebar still reserves its native 1px top border. Match its search divider. */
${view}:has(${visibleDMSearch}) ${friends} > ${channelHeader} {
  min-height: calc(var(--custom-channel-header-height) + 1px);
}
`;

  function flatUniformityCSS() {
    const borderedChat = `${chat}[data-has-border="true"]`;
    const guildWithBorderedChat = `${view}:has(${borderedChat} > ${chatContent}, ${borderedChat} > ${chatRow} ${chatContent})`;
    const guildChat = `${view}:has(${sidebarList} > nav:not([hidden]) > #channels) ${splitChat}`;
    const activeDMList = `${privateList}:not([hidden], [aria-hidden="true"])`;
    const homeSidebar = `${sidebarList}:has(> ${activeDMList}):not(${guildSidebar})`;
    const homeView = `${view}:has(${sidebarList} > ${activeDMList}):not(:has(${sidebarList} > nav:not([hidden]) > #channels))`;
    const homeMain = `${homeView} :is(${friends}, ${mainPage} > :not(${mainOverlay}, ${chat})):has(> ${mainHeader}, > ${headerWrapper} > ${mainHeader})`;
    const questHome = ".container_ZTJWQo";
    return `
/* Theme uniformity. Join the rounded channel edge to the top rule. The
   top rule and both header dividers share the same stroke color. */
${view} ${guildSidebar} {
  background: ${uniformityPaint.flatSidebar};
  background-origin: border-box;
  border-image: none;
}

${guildWithBorderedChat} ${guildSidebar} {
  --chad-flat-top-edge-size: 1px;
}

${guildChat}[data-has-border="true"] {
  --chad-flat-header-inset: 1px;
  border-top-color: transparent;
  border-image: linear-gradient(to ${inlineEnd}, ${railLine} calc(100% - ${flatRailRadius}), ${railPaint} calc(100% - ${flatRailRadius})) 1 0 0 0 / 1px 0 0 0;
  border-start-end-radius: 0;
}

${view} ${guildSidebar} ${sidebarBanner} {
  border-start-start-radius: ${flatRailRadius};
  overflow: hidden;
}

${guildChat} > ${channelHeader},
${guildChat} > ${headerWrapper} > ${channelHeader} {
  background: ${flatTopPaint(inlineEnd, inlineStart, sidebarPaint, railLine, flatHeaderInset)};
  background-origin: border-box;
  border-bottom-color: ${railLine};
}

/* Home shows one rail-facing arc on the DM list and one outer arc on the page. */
${view} ${homeSidebar} {
  background: ${flatTopPaint(inlineStart, inlineEnd, sidebarPaint)};
  background-origin: border-box;
  border-image: none;
}

${view} ${homeSidebar} > ${privateList} > ${dmSearchRow} {
  border-bottom-color: transparent;
}

${homeMain},
${homeView} ${mainPage} > ${questHome} {
  border-top-width: 0;
  border-start-end-radius: 0;
}

${homeMain} {
  background: transparent;
}

${homeMain} > ${mainHeader},
${homeMain} > ${headerWrapper} > ${mainHeader} {
  background: ${flatTopPaint(inlineEnd, inlineStart, sidebarPaint)};
  background-origin: border-box;
}

${friendsHeaderAlignmentCSS}
${homeMain} > ${mainHead} + :not(${mainOverlay}) {
  background-color: ${canvasPaint};
}

${homeView} ${friends} > ${friendsBody} > ${friendsActivity} {
  background: transparent;
}

${homeView} ${mainPage} > ${questHome} {
  background: ${flatTopPaint(inlineEnd, inlineStart, canvasPaint)};
  background-origin: border-box;
}
`;
  }

  const framedUniformityCSS = `
/* Keep server banner paint inside the curve, with controls outside it. */
${view} ${sidebarList} ${sidebarBanner} {
  border-start-start-radius: ${frameRadius};
  border-start-end-radius: ${frameRadius};
  overflow: hidden;
}

/* The background tiles round the visible frame and leave room for the rail
   tint outside its contour. The boxes still follow Discord's layout. */
${view} ${sidebarList} {
  background: ${uniformityPaint.sidebar};
  background-origin: border-box;
  border-color: transparent;
  border-radius: 0;
}

${view} ${framedMain} {
  border-start-start-radius: 0;
  border-start-end-radius: 0;
}

/* The header tile already draws the top stroke. Drop the native duplicate. */
${view} ${framedMain}[data-has-border="true"],
${view} ${framedSinglePane} {
  border-top-width: 0;
}

${view} ${framedMain} > ${mainHeader},
${view} ${framedMain} > ${headerWrapper} > ${mainHeader} {
  background: ${uniformityPaint.header};
  background-origin: border-box;
  border-color: transparent;
}

${friendsHeaderAlignmentCSS}
/* Paint the header and page body independently so Glass applies one tint. */
${view} ${framedSinglePane} {
  background: transparent;
}

${view} ${framedSinglePane} > ${mainHead} + :not(${mainOverlay}) {
  background-color: ${canvasPaint};
}

/* Continue the Friends header's inline-start stroke beside the DM list. */
${view}:has(${visibleDMSearch}) ${friends} > ${channelHeader} + ${friendsBody} {
  background: linear-gradient(to ${inlineEnd}, ${frameLine} 1px, ${canvasPaint} 1px) border-box;
}

${view} ${friends} > ${friendsBody} > ${friendsActivity} {
  background: transparent;
}

/* Only the perimeter rounds. The chat-to-roster divider stays square. */
${view} ${framedChat} ${chatContent} {
  background: ${uniformityPaint.chat};
  background-origin: border-box;
  box-shadow: none;
}

${view} ${framedChat} ${chatContent}:has(~ ${joinedRoster}) {
  background: ${uniformityPaint.chatWithRoster};
  background-origin: border-box;
}

${view} ${framedChat} ${chatContent} ~ ${joinedRoster} {
  background: ${uniformityPaint.roster};
  background-origin: border-box;
  border-color: transparent;
}
`;

  const paletteProperties = [
    ...Object.entries(base30).map(([key, value]) => [`--chad-base30-${key}`, value]),
    ...Object.entries(base16).map(([key, value]) => [`--chad-base16-${key}`, value]),
  ];
  const discordTokens = Object.entries(discordRoles).flatMap(([role, variables]) => (
    variables.split(" ").map((property) => [`--${property}`, `var(--chad-${role})`])
  ));

  function declarations(properties) {
    return properties.map(([key, value]) => `  ${key}: ${value};`).join("\n");
  }

  function declarationRule(selector, properties) {
    return `${selector} {\n${declarations(properties)}\n}`;
  }

  const lightAppearanceCSS = `:scope${light}${excludeDescendants},
:scope${light} ${light}${excludeDescendants} {
  color-scheme: dark;
  --control-secondary-text-default: var(--chad-text);
  --control-secondary-text-hover: var(--chad-text);
  --control-secondary-text-active: var(--chad-text);
  --control-secondary-icon-default: var(--chad-text);
  --control-secondary-icon-hover: var(--chad-text);
  --control-secondary-icon-active: var(--chad-text);
}`;

  function allAppearanceCSS(config, values, renderer) {
    const byAppearance = config.appearanceMode === "by-appearance";
    const rolesByAppearance = byAppearance
      ? appearances.map(({ value }) => roleValues(config, value))
      : [values];
    const invariant = new Set(Object.keys(values).filter((key) => (
      rolesByAppearance.every((roles) => roles[key] === values[key])
    )));
    const common = Object.entries(values).filter(([key]) => invariant.has(key));
    // Discord can retain the Ash class together with a more specific dark appearance.
    const selectors = [
      `:scope${light}`,
      `:scope${ash}:not(${light}, ${dark}, ${onyx})`,
      `:scope${dark}:not(${light}, ${onyx})`,
      `:scope:is(${onyx}):not(${light})`,
    ];
    const overrides = byAppearance && invariant.size < Object.keys(values).length
      ? rolesByAppearance.map((roles, index) => (
        declarationRule(selectors[index], Object.entries(roles).filter(([key]) => !invariant.has(key)))
      )).join("\n\n") + "\n\n"
      : "";

    const excluded = excludedSubtrees.join(", ");
    const scopedRenderer = renderer.replaceAll(darkAppearanceSelector, `:is(:scope, ${darkAppearances})`);
    // Under the Light appearance, Discord redeclares semantic colors on nested Light settings and dialog providers.
    const semanticScope = `:is(:scope, ${darkAppearances}, ${light}:where(:scope${light} *))${excludeDescendants}`;
    return `
@media not (forced-colors: active) {
@scope (:root:is(${darkAppearances}, ${light}):not(${excluded})) to (:is(${excluded})) {
${declarationRule(":scope", paletteProperties)}

/* Resolved preferences. Edit through the studio to recalculate paired colors. */
${declarationRule(":scope", common)}

${overrides}${lightAppearanceCSS}

${declarationRule(semanticScope, discordTokens)}
${scopedRenderer}}
}
`;
  }

  function exportCSS(input) {
    const config = normalizeConfig(input);
    const { name, description } = exportMetadata(config);
    const framed = config.layout === "framed";
    const glass = config.window === "glass";
    const values = roleValues(config);
    const renderer = discordCSS(framed) + (glass ? nativeGlassCSS(framed) : "")
      + uniformityCSS(glass) + (framed ? framedUniformityCSS : flatUniformityCSS());
    const styles = config.appearanceMode ? allAppearanceCSS(config, values, renderer) : `:root {
${declarations(paletteProperties)}

  /* Resolved preferences. Edit through the studio to recalculate paired colors. */
${declarations(Object.entries(values))}
}

@media not (forced-colors: active) {
${declarationRule(themeScope, discordTokens)}
${renderer}}
`;

    return `/**
 * @name ${name}
 * @description ${description}
 * @author a-t-eight
 * @version 1.0.1
 */

/* Palette provenance
   evondev created the original Evondev Dracula theme for VS Code.
   The original theme credits Dracula Official.
   https://github.com/evondev/evondev-dracula

   BrunoKrugel introduced the chadracula-evondev adaptation to NvChad Base46.
   https://github.com/NvChad/base46/pull/242

   The standalone Discord port maps the Base30 and Base16 palettes from
   NvChad/base46 commit 267954c8663607823f03a3259bb8deb15688212f to Discord
   roles. The export retains the palette names and aliases for reference.
   https://github.com/NvChad/base46/blob/267954c8663607823f03a3259bb8deb15688212f/lua/base46/themes/chadracula-evondev.lua

   NvChad Base46 includes the upstream license notice below at this commit.
   https://github.com/NvChad/base46/blob/267954c8663607823f03a3259bb8deb15688212f/LICENSE

   nvim-base16.lua is a library for modifying themes with Lua
   Copyright © 2019 Ashkan Kiani

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the "Software"),
   to deal in the Software without restriction, including without limitation
   the rights to use, copy, modify, merge, publish, distribute, sublicense,
   and/or sell copies of the Software, and to permit persons to whom the
   Software is furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
   OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
   IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
   DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
   TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
   OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */
${styles}`;
  }

  const theme = Object.freeze({
    defaults, options, palette, colorRoles, appearances, defaultAppearanceMode, uniformityPaint, filename: exportIdentity().filename,
    normalizeConfig, getColorChoice, setColorChoice, inputColor, roleValues, exportIdentity, exportCSS, lightAppearanceCSS, mix,
  });
  if (typeof module === "object" && module.exports) module.exports = theme;
  else globalThis.ChadraculaTheme = theme;
}());

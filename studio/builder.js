(() => {
  "use strict";

  const theme = globalThis.ChadraculaTheme;
  const presets = globalThis.ChadraculaPresets;
  const attachColorPicker = globalThis.attachColorPicker;
  const byId = (id) => document.getElementById(id);
  if (!theme?.colorRoles || !presets || !attachColorPicker) {
    byId("status").textContent = "The studio could not load its theme files. Keep the files in the studio folder together.";
    return;
  }

  const storageKey = "chadracula-discord-studio-v1";
  const configFormat = "chadracula-studio";
  const HEX = /^#[0-9a-f]{6}$/i;
  const presetsById = Object.fromEntries(presets.map((preset) => [preset.id, preset]));
  const options = Object.fromEntries(Object.entries(theme.options)
    .filter(([key, values]) => !Object.hasOwn(theme.colorRoles, key) && Array.isArray(values)));
  const summaryRoles = [
    ["Accent", "accent"], ["Text", "text"], ["Muted", "muted"],
    ["Sidebar", "sidebar"], ["Canvas", "canvas"], ["Mention", "mention"],
    ["Thread", "thread-1"], ["Success", "success"],
  ];
  const previewGrid = byId("preview-grid");
  const dialog = byId("palette");
  const form = byId("appearance");

  function loadDraft() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      return {};
    }
  }

  const draft = loadDraft();
  let config = theme.normalizeConfig(draft.config);
  let saved = draft.saved ? theme.normalizeConfig(draft.saved) : null;
  let comparing = false;
  let inspecting = false;
  let statusTimer;
  const scene = {
    area: "server", server: "general", dm: "rin", channelTray: false,
    members: null, panel: "", searchQuery: "", reactions: new Set(), messages: new Map(),
  };

  function report(message, persistent = false) {
    const status = byId("status");
    status.textContent = message;
    clearTimeout(statusTimer);
    if (!persistent) statusTimer = setTimeout(() => { status.textContent = ""; }, 4400);
  }

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ config, saved }));
    } catch {
      byId("storage-note").textContent = "Browser storage is unavailable. Save a config to keep your changes.";
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function colorValue(roles, key) {
    return roles["--chad-" + key];
  }

  function setConfig(next, { resetEditors = false } = {}) {
    config = theme.normalizeConfig(next);
    refreshTheme();
    if (resetEditors) for (const editor of Object.values(colorEditors)) editor.reset();
    persist();
  }

  for (const [key, values] of Object.entries(options)) {
    const select = byId(key);
    for (const { value, label } of values) select.add(new Option(label, value));
  }
  function roleEditorFields(id, label) {
    return `<div class="form-row">
      <label for="${id}">${label}</label>
      <div class="accent-preset-control">
        <select id="${id}" name="${id}" data-color-preset></select>
        <span class="accent-swatch" data-accent-swatch aria-hidden="true"></span>
      </div>
    </div>
    <details class="role-custom" data-color-custom hidden>
      <summary aria-label="Edit custom color for ${label}">Edit custom color</summary>
      <div class="form-row">
        <label for="${id}-format">Format</label>
        <select id="${id}-format" data-accent-format>
          <option value="hex">Hex</option><option value="rgb">RGB</option><option value="hsv">HSV</option>
        </select>
      </div>
      <div class="accent-fields" data-accent-fields></div>
    </details>`;
  }

  function roleEditors(colors) {
    return colors.map(([id, label]) => `<div class="color-role-editor" id="${id}-editor">${roleEditorFields(id, label)}</div>`).join("");
  }

  byId("text-editor").innerHTML = roleEditorFields("text", "Text tone");
  byId("interaction-colors").innerHTML = roleEditors([
    ["selection", "Selection"], ["threads", "Thread labels"], ["link", "Links"], ["mention", "Mentions"],
  ]);
  byId("role-colors").innerHTML = roleEditors([
    ["surface-canvas", "Chat canvas"], ["surface-sidebar", "Sidebars"], ["surface-raised", "Raised panels"],
    ["surface-rail", "Server rail"], ["surface-input", "Inputs"], ["foreground-text", "Main text"],
    ["foreground-muted", "Muted text"],
  ]);
  const colorEditors = Object.fromEntries(Object.entries(theme.colorRoles).map(([id, role]) => [
    id,
    attachColorPicker(byId(id + "-editor"), role, (choice) => setConfig(theme.setColorChoice(config, id, choice))),
  ]));

  byId("presets").innerHTML = presets.map(({ id, label, config: choice }) => {
    const roles = theme.roleValues(choice);
    const swatches = ["accent", "sidebar", "thread-1", "link"];
    return `<button type="button" class="preset" data-preset="${id}" aria-pressed="false">
      <span>${label}</span><span class="preset-swatches" aria-hidden="true">${swatches.map((role) => (
        `<i style="--swatch:${colorValue(roles, role)}"></i>`
      )).join("")}</span>
    </button>`;
  }).join("");

  const people = {
    rin: { name: "Rin", mark: "R", color: "#C197FD", status: "online" },
    kade: { name: "Kade", mark: "K", color: "#8BE9FD", status: "online" },
    mira: { name: "Mira", mark: "M", color: "#FF93D6", status: "online" },
    sol: { name: "Sol", mark: "S", color: "#E5C697", status: "online" },
    iris: { name: "Iris", mark: "I", color: "#91E5BD", status: "away" },
    vale: { name: "Vale", mark: "V", color: "#A4A4C4", status: "offline" },
    you: { name: "Ari", mark: "A", color: "#92A2D4", status: "online" },
  };
  const channels = [
    { id: "general", name: "general", topic: "Chill chat, ideas, and miscellany" },
    { id: "design", name: "design", topic: "Palette experiments and work in progress" },
    { id: "music", name: "music", topic: "Listening room and recommendations" },
    { id: "theme-ideas", name: "theme-ideas", topic: "Thread from #design", color: 1, activity: 3 },
    { id: "ui-tweaks", name: "ui-tweaks", topic: "Thread from #design", color: 2, activity: 5 },
    { id: "color-roles", name: "color-roles", topic: "Thread from #design", color: 3 },
    { id: "contrast", name: "contrast-checks", topic: "Thread from #design", color: 4 },
    { id: "release", name: "release-notes", topic: "Thread from #general", color: 5 },
    { id: "feedback", name: "feedback", topic: "Thread from #general", color: 6 },
    { id: "lounge", name: "Lounge", topic: "Voice channel text chat", voice: true },
  ];
  const direct = ["rin", "mira", "kade"];
  const channelsById = Object.fromEntries(channels.map((channel) => [channel.id, channel]));
  const fixtures = {
    general: [
      ["rin", "10:24 AM", '<p>I tried the latest theme on a few long threads. The softer channel list makes the conversation much easier to follow.</p>', "heart"],
      ["kade", "10:37 AM", '<p>The bright labels help when there are several threads open. I left notes in <a href="#theme-ideas" data-nav="theme-ideas" data-role="link">#theme-ideas</a>.</p>'],
      ["mira", "2:11 PM", '<p><span class="mention" data-role="mention">@Kade</span> the new build is ready. Start with <code data-role="surface-raised">/reload-theme</code>, then try changing the accent.</p><button class="message-card" type="button" data-action="notes" data-role="surface-raised"><span class="card-icon" aria-hidden="true">&lt;/&gt;</span><span><strong>Theme update</strong><small>Read the sample change notes</small></span></button>', "sparkle"],
      ["sol", "2:18 PM", '<p>Try the pinned message and the search panel, too. They use the same palette on a raised surface.</p>'],
    ],
    design: [
      ["mira", "12:07 PM", '<p>Here is the proposed accent for today’s pass. I’m curious how it reads next to the selection fill.</p><pre data-role="surface-raised"><code><span class="syntax-keyword">const</span> accent = <span class="syntax-string">"#a166f6"</span>;<br><span class="syntax-keyword">const</span> windowOpacity = <span class="syntax-value">0.90</span>;</code></pre>'],
      ["iris", "12:19 PM", '<p><span class="mention" data-role="mention">@Mira</span> compare it on the channel hover and on the Send button. The two colors serve different jobs.</p>', "sparkle"],
    ],
    music: [
      ["kade", "8:20 PM", '<p>New listening room tonight. I put the running order in <a href="#lounge" data-nav="lounge" data-role="link">#Lounge</a>.</p>'],
      ["rin", "8:24 PM", '<p>I’ll join after the last test. Thanks for putting it together!</p>', "heart"],
    ],
    "theme-ideas": [
      ["kade", "11:20 AM", '<p>I prefer the color on the thread title. Its parent channel stays easy to find when everything is expanded.</p>'],
      ["mira", "11:38 AM", '<p>Try the accent and neutral variants in the channel list before we settle on rainbow.</p>', "heart"],
    ],
    lounge: [
      ["kade", "8:15 PM", '<p>The voice room is open. Share the track name here so people can find it later.</p>'],
    ],
    rin: [
      ["rin", "4:45 PM", '<p>That latest version reads well in a server. How does it look in a quiet direct chat?</p>'],
      ["you", "4:47 PM", '<p>Much calmer. The reply accent is the only bit I’d keep especially bright.</p>', "heart"],
    ],
    mira: [
      ["mira", "5:07 PM", '<p>The design notes are ready. I think the flat and framed layouts are worth comparing at the same window size.</p>'],
    ],
    kade: [
      ["kade", "5:14 PM", '<p>Could you try the cyan mention on the cool palette? I’m checking its label against the message background.</p>'],
    ],
  };

  function avatar(id, small = false) {
    const person = people[id];
    return `<span class="avatar ${person.status}${small ? " small" : ""}" style="--fixture-user:${person.color}" aria-hidden="true">${person.mark}</span>`;
  }

  function currentId() {
    return scene[scene.area];
  }

  function channelButtons(list) {
    return list.map(({ id, name, color, activity, voice }) => {
      const selected = scene.server === id;
      const dispatchRole = color ? "threads" : "selection";
      return `<button class="channel-button" type="button" data-nav="${id}" data-role="${dispatchRole}" aria-label="${color ? "thread" : voice ? "voice" : "channel"} ${name}"${selected ? ' aria-current="page"' : ""}>
        <span class="channel-icon" aria-hidden="true">${color ? "↳" : voice ? "♪" : "#"}</span>
        <span${color ? ` class="thread-name" style="--thread-color:var(--chad-thread-${color})"` : ""}>${name}</span>
        ${activity ? `<span class="activity-count" aria-label="${activity} unread">${activity}</span>` : ""}
      </button>`;
    }).join("");
  }

  function sidebar() {
    const isDM = scene.area === "dm";
    const channelRows = isDM
      ? direct.map((id) => (
        `<button type="button" class="channel-button" data-nav="${id}" data-role="selection"${scene.dm === id ? ' aria-current="page"' : ""}>${avatar(id, true)}<span>${people[id].name}</span></button>`
      )).join("")
      : `<p class="channel-label">Text channels</p>${channelButtons(channels.filter((channel) => !channel.color && !channel.voice))}
         <p class="channel-label">Threads</p>${channelButtons(channels.filter((channel) => channel.color))}
         <p class="channel-label">Voice</p>${channelButtons(channels.filter((channel) => channel.voice))}`;
    return `<aside class="channel-sidebar pane-gap${scene.channelTray ? " is-open" : ""}" data-role="surface-sidebar" aria-label="${isDM ? "Direct message list" : "Channels sidebar"}">
      <header class="server-heading"><h3>${isDM ? "Direct messages" : "After Hours"}</h3></header>
      <nav class="channel-list" aria-label="${isDM ? "Direct message conversations" : "Server channels"}">${channelRows}</nav>
      <div class="account" data-role="surface-raised">${avatar("you", true)}<div><strong>Ari</strong><small>Online</small></div></div>
    </aside>`;
  }

  function memberList() {
    const groups = [["Admin", ["sol"]], ["Moderators", ["iris", "kade"]], ["Online", ["rin", "mira"]], ["Offline", ["vale"]]];
    return `<aside class="members-surface pane-gap${scene.members === true ? " force-open" : ""}" data-role="surface-sidebar" aria-label="Members">
      ${groups.map(([label, ids]) => (
        `<h3 class="members-heading">${label} · ${ids.length}</h3>${ids.map((id) => {
          const person = people[id];
          return `<div class="member ${person.status}" style="--fixture-user:${person.color}">${avatar(id, true)}${person.name}</div>`;
        }).join("")}`
      )).join("")}
    </aside>`;
  }

  function reactionButton(id, reaction, index) {
    if (!reaction) return "";
    const emoji = reaction === "heart" ? "♥" : "✦";
    const label = reaction === "heart" ? "heart" : "sparkle";
    const key = id + "-" + index;
    const enabled = scene.reactions.has(key);
    return `<button class="reaction" type="button" data-reaction="${key}" data-role="accent" aria-pressed="${enabled}" aria-label="Toggle ${label} reaction"><span aria-hidden="true">${emoji} ${(reaction === "heart" ? 3 : 2) + Number(enabled)}</span></button>`;
  }

  function messages() {
    const id = currentId();
    const initial = fixtures[id] || [
      ["rin", "3:02 PM", `<p>This thread is ready for notes about ${channelsById[id].name.replaceAll("-", " ")}.</p>`],
      ["mira", "3:09 PM", '<p>Let’s try the hover, selected, and unread states together.</p>', "sparkle"],
    ];
    const appended = (scene.messages.get(id) || []).map((message) => ["you", "Now", `<p>${escapeHTML(message)}</p>`]);
    return `<p class="date-rule">Today</p>${[...initial, ...appended].map(([user, time, content, reaction], index) => {
      const person = people[user];
      return `<article class="message">
        ${avatar(user)}<div style="--fixture-user:${person.color}"><div class="author"><strong>${person.name}</strong>
        <time data-role="foreground-muted">${time}</time></div>
        <div data-role="foreground-text">${content}</div>
        ${reactionButton(id, reaction, index)}
        </div>
      </article>`;
    }).join("")}`;
  }

  function toolButton(action, label, pressed = false) {
    return `<button class="fixture-button" type="button" data-action="${action}" aria-pressed="${pressed}">${label}</button>`;
  }

  function panel() {
    if (!scene.panel) return "";
    const panels = {
      pins: ["Pinned messages", '<p>Rin · Compare both versions in a long thread before picking a favorite.</p>'],
      notes: ["Theme update", '<p>Adjusted sidebars, thread colors and menu contrast.</p><p class="warning-text">Review at a smaller viewport before exporting.</p>'],
      search: ["Search messages", `<input type="search" aria-label="Search sample messages" data-search placeholder="Search this conversation" value="${escapeHTML(scene.searchQuery)}"><p class="search-result" aria-live="polite"></p>`],
    };
    const [heading, content] = panels[scene.panel];
    return `<div class="fixture-panel" data-role="surface-raised">
      <div class="fixture-panel-heading"><h3>${heading}</h3><button class="fixture-button" type="button" data-action="close-panel" aria-label="Close preview panel">×</button></div>
      ${content}
    </div>`;
  }

  function previewSlot(slot, label) {
    const isDM = scene.area === "dm";
    const active = isDM
      ? { name: people[scene.dm].name, topic: "Direct message" }
      : channelsById[scene.server];
    const mark = isDM ? "@" : active.voice ? "♪" : active.color ? "↳" : "#";
    const workspaceTitle = isDM ? "Direct messages" : "After Hours";
    return `<div class="preview-slot">
      <p class="compare-label"><span>${slot === "saved" ? "A" : "B"}</span> ${label}</p>
      <div class="preview-window" data-preview="${slot}" data-area="${scene.area}" aria-label="${label} preview">
        <div class="window-bar" data-role="surface-rail">
          <span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>${workspaceTitle}</span><span class="window-material" data-role="window" hidden>Simulated glass</span>
        </div>
        <nav class="server-rail" aria-label="Preview workspaces" data-role="surface-rail">
          <button class="rail-item server-logo" type="button" data-action="server" data-role="accent" aria-label="After Hours" title="After Hours" aria-pressed="${!isDM}"></button>
          <button class="rail-item" type="button" data-action="dm" data-role="accent" aria-label="Direct messages" title="Direct messages" aria-pressed="${isDM}">DM</button>
          <span class="rail-divider" aria-hidden="true"></span>
          <span class="rail-item rail-ornament" aria-hidden="true">▱</span>
          <span class="rail-item rail-ornament" aria-hidden="true">✣</span>
        </nav>
        ${sidebar()}
        <section class="chat-surface pane-gap" data-role="surface-canvas" aria-label="Conversation">
          <header class="chat-header">
            <button class="fixture-button show-channels" type="button" data-action="channels" aria-pressed="${scene.channelTray}">Channels</button>
            <span class="channel-icon" aria-hidden="true">${mark}</span>
            <h3>${active.name}</h3><span class="chat-topic" data-role="foreground-muted">${active.topic}</span>
            <div class="chat-tools">
              ${toolButton("pins", "Pins", scene.panel === "pins")}
              ${toolButton("search", "Search", scene.panel === "search")}
              ${isDM ? "" : toolButton("members", "Members", scene.members === true)}
            </div>
          </header>
          <div class="chat-body">
            <div class="messages">${messages()}</div>
            <form class="composer" data-role="surface-input">
              <input name="message" type="text" maxlength="600" aria-label="Compose a sample message" placeholder="Message ${mark}${active.name}" autocomplete="off">
              <button class="send-button" data-role="accent" type="submit">Send</button>
            </form>
          </div>
          ${isDM || scene.members === false ? "" : memberList()}
        </section>
        ${panel()}
      </div>
    </div>`;
  }

  function renderPreview() {
    const selection = document.activeElement;
    const focusedPreview = selection?.closest(".preview-window");
    const action = selection?.dataset.action;
    const selectionNav = selection?.dataset.nav;
    const reaction = selection?.dataset.reaction;
    const messagesScroll = new Map(Array.from(previewGrid.querySelectorAll(".preview-window"), (window) => [
      window.dataset.preview, window.querySelector(".messages").scrollTop,
    ]));
    previewGrid.classList.toggle("is-comparing", comparing);
    previewGrid.innerHTML = (comparing ? previewSlot("saved", "Saved comparison") : "") + previewSlot("working", "Working theme");
    for (const window of previewGrid.querySelectorAll(".preview-window")) {
      window.querySelector(".messages").scrollTop = messagesScroll.get(window.dataset.preview) || 0;
      if (focusedPreview?.dataset.preview !== window.dataset.preview) continue;
      const matching = Array.from(window.querySelectorAll("[data-action], [data-nav], [data-reaction]")).find((element) => (
        (action && element.dataset.action === action) || (selectionNav && element.dataset.nav === selectionNav) ||
        (reaction && element.dataset.reaction === reaction)
      ));
      if (matching?.getClientRects().length) matching.focus({ preventScroll: true });
      else if (selectionNav) window.querySelector(".show-channels").focus({ preventScroll: true });
    }
    refreshPreviewStyles();
    if (scene.panel === "search") refreshSearch();
  }

  function refreshPreviewStyles() {
    for (const window of previewGrid.querySelectorAll(".preview-window")) {
      const current = window.dataset.preview === "saved" ? saved : config;
      const roles = theme.roleValues(current);
      for (const [key, value] of Object.entries(roles)) window.style.setProperty(key, value);
      window.style.setProperty("--preview-framed-sidebar", theme.uniformityPaint.sidebar);
      window.style.setProperty("--preview-framed-header", theme.uniformityPaint.header);
      window.style.setProperty("--preview-framed-chat", theme.uniformityPaint.chat);
      window.style.setProperty("--preview-framed-chat-with-roster", theme.uniformityPaint.chatWithRoster);
      window.style.setProperty("--preview-framed-roster", theme.uniformityPaint.roster);
      window.style.setProperty("--preview-flat-sidebar", theme.uniformityPaint.flatSidebar);
      window.dataset.layout = current.layout;
      window.dataset.window = current.window;
      window.querySelector(".window-material").hidden = current.window !== "glass";
      window.classList.toggle("is-inspecting", inspecting);
      for (const target of window.querySelectorAll("[data-role]")) {
        target.classList.toggle("is-targetable", inspecting);
        if (!target.matches("button, a, input")) {
          if (inspecting) target.tabIndex = 0;
          else target.removeAttribute("tabindex");
        }
      }
    }
  }

  function refreshTheme() {
    const roles = theme.roleValues(config);
    for (const key of Object.keys(options)) byId(key).value = config[key];
    for (const [id, editor] of Object.entries(colorEditors)) {
      editor.sync(theme.getColorChoice(config, id), theme.inputColor(config, id, roles), colorValue(roles, theme.colorRoles[id].cssRole));
    }
    byId("opacity").value = config.opacity;
    byId("opacity").disabled = config.window !== "glass";
    byId("opacity-value").textContent = config.opacity + "%";
    byId("opacity-row").hidden = config.window !== "glass";

    const signature = JSON.stringify(config);
    for (const button of byId("presets").querySelectorAll("[data-preset]")) {
      const candidate = JSON.stringify(theme.normalizeConfig(presetsById[button.dataset.preset].config));
      button.setAttribute("aria-pressed", String(signature === candidate));
    }
    byId("current-colors").innerHTML = summaryRoles.map(([label, role]) => (
      `<div class="role-chip"><i style="--swatch:${colorValue(roles, role)}" aria-hidden="true"></i><dt>${label}</dt><dd>${colorValue(roles, role)}</dd></div>`
    )).join("");
    refreshPreviewStyles();
  }

  function toggleInspect() {
    inspecting = !inspecting;
    byId("inspect").textContent = inspecting ? "Stop inspecting" : "Inspect";
    byId("inspect").setAttribute("aria-pressed", String(inspecting));
    byId("inspect-note").hidden = !inspecting;
    refreshPreviewStyles();
  }

  function jumpToRole(element) {
    const role = element?.closest("[data-role]");
    if (!role) return;
    const id = role.dataset.role;
    if (id.startsWith("surface-") || id.startsWith("foreground-")) byId("advanced").open = true;
    byId(id).focus({ preventScroll: true });
    byId(id).scrollIntoView({ block: "nearest" });
  }

  function syncCompareButton() {
    byId("compare").disabled = !saved;
    byId("compare").textContent = comparing ? "Close comparison" : "Compare";
    byId("compare").setAttribute("aria-pressed", String(comparing));
  }

  function showPalette() {
    const resolved = Object.entries(theme.roleValues(config))
      .filter(([, value]) => HEX.test(value))
      .map(([role, value]) => [role.replace("--chad-", ""), value]);
    const groups = [
      ["Resolved preview and export roles", resolved],
      ["Canonical Base30", Object.entries(theme.palette.base30)],
      ["Canonical Base16", Object.entries(theme.palette.base16)],
    ];
    byId("palette-colors").innerHTML = groups.map(([heading, colors]) => (
      `<section class="palette-group"><h3>${heading}</h3><div class="palette-grid">${colors.map(([label, value]) => (
        `<button type="button" class="palette-color" data-color="${value}" aria-label="Copy ${label} ${value}">
          <i style="--swatch:${value}" aria-hidden="true"></i><span>${label}</span><code>${value}</code>
        </button>`
      )).join("")}</div></section>`
    )).join("");
    byId("palette-copy-message").textContent = "Select a swatch to copy its value.";
    dialog.showModal();
  }

  function download(name, data, type) {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function updateField(field) {
    if (Object.hasOwn(options, field.name) || field.name === "opacity") setConfig({ ...config, [field.name]: field.value });
  }

  form.addEventListener("input", (event) => updateField(event.target));
  form.addEventListener("submit", (event) => event.preventDefault());
  byId("presets").addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    const preset = presetsById[button.dataset.preset];
    setConfig(preset.config, { resetEditors: true });
    report(preset.label + " applied.");
  });
  byId("reset-colors").addEventListener("click", () => {
    const { surfaces, foregrounds, ...rest } = config;
    setConfig(rest);
    report("Surface and foreground overrides cleared.");
  });
  byId("inspect").addEventListener("click", toggleInspect);
  byId("show-palette").addEventListener("click", showPalette);
  byId("palette-colors").addEventListener("click", async (event) => {
    const value = event.target.closest("[data-color]")?.dataset.color;
    if (!value) return;
    let message;
    try {
      await navigator.clipboard.writeText(value);
      message = "Copied " + value + ".";
    } catch {
      message = "Clipboard unavailable. Color value is " + value + ".";
    }
    byId("palette-copy-message").textContent = message;
  });
  byId("save-baseline").addEventListener("click", () => {
    saved = theme.normalizeConfig(config);
    persist();
    syncCompareButton();
    if (comparing) refreshPreviewStyles();
    report("Working theme saved as A.");
  });
  byId("compare").addEventListener("click", () => {
    comparing = !comparing;
    syncCompareButton();
    renderPreview();
  });
  byId("download-css").addEventListener("click", () => {
    download(theme.exportIdentity(config).filename, theme.exportCSS(config), "text/css");
  });
  byId("save-config").addEventListener("click", () => {
    const serialized = JSON.stringify({ format: configFormat, version: 1, config }, null, 2);
    download("Chadracula-Studio.json", serialized + "\n", "application/json");
  });
  byId("import-config").addEventListener("click", () => byId("config-file").click());
  byId("config-file").addEventListener("change", async (event) => {
    const input = event.target;
    const file = input.files[0];
    input.value = "";
    if (!file) return;
    try {
      if (file.size > 64000) throw new Error("Configuration exceeds 64 KB.");
      const data = JSON.parse(await file.text());
      if (data?.format !== configFormat || data.version !== 1 || !data.config || Array.isArray(data.config) || typeof data.config !== "object") {
        throw new Error("Expected a version 1 Chadracula Studio JSON config.");
      }
      setConfig(data.config, { resetEditors: true });
      report("Configuration imported.");
    } catch (error) {
      report("Import failed. " + error.message, true);
    }
  });

  function changeScene(action, clickedWindow) {
    switch (action) {
      case "server":
      case "dm":
        scene.area = action;
        scene.channelTray = false;
        scene.panel = "";
        break;
      case "channels":
        scene.channelTray = !scene.channelTray;
        break;
      case "members": {
        const members = clickedWindow.querySelector(".members-surface");
        const visible = members && getComputedStyle(members).display !== "none";
        scene.members = !visible;
        break;
      }
      case "close-panel":
        scene.panel = "";
        break;
      default:
        scene.panel = scene.panel === action ? "" : action;
    }
    if (scene.panel !== "search") scene.searchQuery = "";
  }

  previewGrid.addEventListener("click", (event) => {
    if (inspecting) {
      event.preventDefault();
      jumpToRole(event.target);
      return;
    }
    const trigger = event.target.closest("[data-nav], [data-action], [data-reaction]");
    if (!trigger) return;
    event.preventDefault();
    const window = trigger.closest(".preview-window");
    const { nav, action, reaction } = trigger.dataset;
    if (nav) {
      scene[scene.area] = nav;
      scene.channelTray = false;
      scene.panel = "";
      scene.searchQuery = "";
      for (const pane of previewGrid.querySelectorAll(".messages")) pane.scrollTop = 0;
    }
    if (reaction) {
      if (scene.reactions.has(reaction)) scene.reactions.delete(reaction);
      else scene.reactions.add(reaction);
    }
    if (action) changeScene(action, window);
    renderPreview();
    if (action === "search" && scene.panel) {
      previewGrid.querySelector(`[data-preview="${window.dataset.preview}"] [data-search]`).focus();
    }
  });

  previewGrid.addEventListener("keydown", (event) => {
    if (inspecting && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      jumpToRole(event.target);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || dialog.open) return;
    if (inspecting) {
      toggleInspect();
      byId("inspect").focus();
      return;
    }
    const slot = event.target.closest?.(".preview-window")?.dataset.preview;
    if (!slot) return;
    if (scene.panel) {
      const action = scene.panel;
      changeScene("close-panel");
      renderPreview();
      previewGrid.querySelector(`[data-preview="${slot}"] [data-action="${action}"]`)?.focus();
    } else if (scene.channelTray) {
      scene.channelTray = false;
      renderPreview();
      previewGrid.querySelector(`[data-preview="${slot}"] .show-channels`).focus();
    }
  });

  function refreshSearch() {
    const query = scene.searchQuery.trim().toLowerCase();
    for (const window of previewGrid.querySelectorAll(".preview-window")) {
      const input = window.querySelector("[data-search]");
      if (input.value !== scene.searchQuery) input.value = scene.searchQuery;
      const messages = Array.from(window.querySelectorAll(".message p"));
      const count = query ? messages.filter((line) => line.textContent.toLowerCase().includes(query)).length : 0;
      window.querySelector(".search-result").textContent = query ? count + (count === 1 ? " matching line" : " matching lines") : "";
    }
  }

  previewGrid.addEventListener("input", (event) => {
    if (!event.target.matches("[data-search]")) return;
    scene.searchQuery = event.target.value;
    refreshSearch();
  });

  previewGrid.addEventListener("submit", (event) => {
    event.preventDefault();
    if (inspecting) return;
    const input = event.target.elements.message;
    const message = input.value.trim();
    if (!message) return;
    const id = currentId();
    const sent = scene.messages.get(id) || [];
    scene.messages.set(id, [...sent, message]);
    const slot = event.target.closest(".preview-window").dataset.preview;
    renderPreview();
    for (const pane of previewGrid.querySelectorAll(".messages")) pane.scrollTop = pane.scrollHeight;
    previewGrid.querySelector(`[data-preview="${slot}"] .composer input`).focus();
  });

  renderPreview();
  refreshTheme();
  persist();
  syncCompareButton();
})();

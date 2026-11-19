const assert = require("node:assert/strict");
const test = require("node:test");
const { exportCSS } = require("../studio/theme.js");

const playwright = process.env.CHADRACULA_PLAYWRIGHT || "playwright";
const executablePath = process.env.CHADRACULA_CHROMIUM;

async function samplePixels(page, points) {
  const png = await page.screenshot();
  return page.evaluate(async ({ data, points }) => {
    const shot = new Image();
    shot.src = `data:image/png;base64,${data}`;
    await shot.decode();
    const canvas = document.createElement("canvas");
    canvas.width = shot.width;
    canvas.height = shot.height;
    const context = canvas.getContext("2d");
    context.drawImage(shot, 0, 0);
    const pixelsPerPoint = shot.width / window.innerWidth;
    return Object.fromEntries(Object.entries(points).map(([key, point]) => {
      const [x, y] = point.map((coordinate) => Math.floor(coordinate * pixelsPerPoint));
      return [key, Array.from(context.getImageData(x, y, 1, 1).data.slice(0, 3))];
    }));
  }, { data: png.toString("base64"), points });
}

function equalColor(actual, expected, message) {
  // Chromium's gradient rasterizer can differ by one quantization step from a solid fill.
  assert.ok(actual.every((channel, index) => Math.abs(channel - expected[index]) <= 1),
    `${message}: [${actual}] versus [${expected}]`);
}

// Synthetic guild and DM structures exercise the renderer paint layers.
const fixture = `<!doctype html><html class="theme-dark"><head><style>
  .guildSidebar_iar92T, .container_H5ozaj, .privateChannels_u88IQl, .scroller_Bce46W {
    background: var(--background-gradient-high, var(--background-base-lowest));
  }
  .chat_z_gUBg { background:var(--background-gradient-chat,var(--background-base-lowest)); }
  .chatContent_z_gUBg { background:var(--background-gradient-chat,var(--background-base-lower)); }
  .container_86es0b, .members_86es0b, .member_86es0b {
    background:var(--background-gradient-chat,var(--custom-channel-members-bg));
  }
  .clickable_J1Adu_:hover .childContainer_J1Adu_ { background-color:var(--interactive-background-hover); }
</style></head><body><div id="app-mount">
  <div class="sidebar_pog62O" id="sidebar-shell">
    <div class="sidebarList_pog62O" id="sidebar">
      <div class="guildSidebar_iar92T" id="guild-list">Channels</div>
      <nav class="container_H5ozaj" id="guild-nav">
        <div id="channels" class="scroller_ysO7Gy">
          <ul class="content_tqapBM"><li class="containerDefault_Wx6SnQ">
            <div class="iconVisibility_Wx6SnQ wrapper_TNyK-N modeSelected_TNyK-N"><div>
              <a class="link_TNyK-N" href="/channels/1/2" aria-current="page" id="selected-channel">General</a>
            </div></div>
          </li></ul>
        </div>
      </nav>
      <div class="privateChannels_u88IQl" id="private-list">
        <div class="scroller_Bce46W" id="private-scroller">Messages</div>
      </div>
    </div>
  </div>
  <section class="chat_z_gUBg" id="chat">
    <header class="container_ybUK7Z themed_ybUK7Z" id="channel-header">Header</header>
    <div class="content_z_gUBg" id="content">
      <main class="chatContent_z_gUBg" id="chat-content">Chat</main>
      <aside class="container_86es0b" id="members">
        <div class="membersWrap_86es0b" id="members-wrap">
          <div class="members_86es0b" id="members-list">
            <div class="member_86es0b clickable_J1Adu_" id="member">
              <div class="childContainer_J1Adu_" id="member-hover">Member</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</div></body></html>`;

test("appearance exports apply colors and plugin card surfaces only inside their active Discord scopes", async () => {
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html><head><style>
      :root, .theme-light, .custom-user-profile-theme, .enable-forced-colors {
        --control-primary-background-default: #5865F2;
        --card-background-default: #E5E7EA;
        --modal-background: #FFFFFF;
        --text-default: #2E2E34;
      }
      .theme-light { color-scheme: light; }
      .vc-card-base, .vc-addon-card { background: var(--card-background-default); }
      .modal { background: var(--modal-background); color: var(--text-default); }
      button { background: var(--control-primary-background-default); }
      #app-mount, .chatContent_f75fb0 { min-height: 100px; }
    </style></head><body><div id="app-mount">
      <section class="chat_f75fb0"><header class="themed__9293f">General</header>
        <main class="chatContent_f75fb0"><button id="send">Send</button></main>
      </section>
      <div class="vc-card-base" id="outer-card">Plugin</div>
      <div class="theme-light modal" id="dialog">
        <div class="vc-card-base vc-addon-card" id="dialog-card">Plugin in settings</div>
        <div class="theme-dark custom-user-profile-theme"><div class="vc-addon-card" id="profile-card">Profile</div></div>
        <div class="theme-dark enable-forced-colors"><div class="vc-addon-card" id="forced-card">Accessibility</div></div>
      </div>
    </div></body></html>`);
    const stockAccent = "rgb(88, 101, 242)";
    const stockCard = "rgb(229, 231, 234)";
    const themedCard = "rgb(35, 35, 61)";
    const violet = "rgb(154, 134, 253)";
    const nativeLight = [stockCard, "rgb(255, 255, 255)", "rgb(46, 46, 52)", "light"];
    const themedLight = [themedCard, themedCard, "rgb(248, 248, 242)", "dark"];
    const modeAccents = [
      ["theme-light", "rgb(5, 195, 255)"],
      ["theme-dark", "rgb(255, 107, 203)"],
      ["theme-dark theme-darker", violet],
      ["theme-dark theme-midnight", "rgb(80, 250, 123)"],
      ["theme-amoled", "rgb(80, 250, 123)"],
      ["theme-light theme-dark", "rgb(5, 195, 255)"],
    ];
    for (const appearanceMode of ["dark-only", "all", "by-appearance"]) {
      const style = await page.addStyleTag({ content: exportCSS({
        appearanceMode, accent: "violet", window: "glass", opacity: 80,
        appearanceAccents: { light: "nord_blue", ash: "pink", dark: "violet", onyx: "#50FA7B" },
      }) });
      for (const [classes, configuredAccent] of modeAccents) {
        await page.evaluate((classes) => { document.documentElement.className = classes; }, classes);
        const localLight = classes.includes("theme-light");
        // Light's legacy path uses a native Light root without any accompanying dark provider.
        if (localLight && classes.includes("theme-dark") && appearanceMode === "dark-only") continue;
        const active = appearanceMode !== "dark-only" || !localLight;
        const expectedAccent = active ? appearanceMode === "by-appearance" ? configuredAccent : violet : stockAccent;
        const colors = await page.evaluate(() => {
          const read = (id) => getComputedStyle(document.getElementById(id));
          return {
            accent: read("send").backgroundColor,
            outerCard: read("outer-card").backgroundColor,
            dialog: [read("dialog-card").backgroundColor, read("dialog").backgroundColor, read("dialog").color, read("dialog").colorScheme],
            exclusions: [read("profile-card").backgroundColor, read("forced-card").backgroundColor],
            paint: getComputedStyle(document.querySelector(".chatContent_f75fb0")).backgroundImage,
          };
        });
        const state = `${appearanceMode} / ${classes}`;
        assert.equal(colors.accent, expectedAccent, state);
        assert.equal(colors.outerCard, active ? themedCard : stockCard, state);
        assert.deepEqual(colors.dialog, active && localLight ? themedLight : nativeLight, state);
        assert.deepEqual(colors.exclusions, [stockCard, stockCard], state);
        if (active) assert.match(colors.paint, /^radial-gradient\(.*0\.8\)/, state);
        else assert.equal(colors.paint, "none", state);
      }
      await page.evaluate(() => { document.documentElement.className = "theme-light enable-forced-colors"; });
      for (const forcedColors of ["none", "active"]) {
        if (forcedColors === "active") {
          await page.evaluate(() => { document.documentElement.className = "theme-light"; });
          await page.emulateMedia({ forcedColors });
        }
        assert.equal(await page.locator("#outer-card").evaluate((card) =>
          getComputedStyle(card).getPropertyValue("--card-background-default").trim()), "#E5E7EA", `${appearanceMode} ${forcedColors}`);
      }
      await page.emulateMedia({ forcedColors: "none" });
      await style.evaluate((node) => node.remove());
    }
  } finally {
    await browser.close();
  }
});

test("Flat and Framed Glass clear the host backdrop in each enabled appearance", async () => {
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html><head><style>
      html { background-color: #332244; }
      body { background-color: #443355; }
      #app-mount { background-color: #554466; }
    </style></head><body><div id="app-mount">Native backdrop</div></body></html>`);
    for (const layout of ["flat", "framed"]) {
      for (const appearanceMode of ["dark-only", "all", "by-appearance"]) {
        const style = await page.addStyleTag({ content: exportCSS({ appearanceMode, layout, window: "glass" }) });
        for (const appearance of ["theme-light", "theme-darker"]) {
          const backgrounds = await page.evaluate((appearance) => {
            document.documentElement.className = appearance;
            return [document.documentElement, document.body, document.getElementById("app-mount")]
              .map((element) => getComputedStyle(element).backgroundColor);
          }, appearance);
          const expected = appearanceMode === "dark-only" && appearance === "theme-light"
            ? ["rgb(51, 34, 68)", "rgb(68, 51, 85)", "rgb(85, 68, 102)"]
            : Array(3).fill("rgba(0, 0, 0, 0)");
          assert.deepEqual(backgrounds, expected, `${layout} / ${appearanceMode} / ${appearance}`);
        }
        await style.evaluate((element) => element.remove());
      }
    }
  } finally {
    await browser.close();
  }
});

test("Discord's nested channel and member backgrounds expose exactly one pane tint", async () => {
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(fixture);
    await page.addStyleTag({ content: exportCSS({ window: "glass", opacity: 75, selection: "accent", accent: "orange" }) });
    const paint = await page.evaluate(() => {
      const transparent = "rgba(0, 0, 0, 0)";
      const flatLayers = ["guild-list", "guild-nav", "private-list", "private-scroller",
        "chat", "content", "members-wrap", "members-list", "member"];
      const paneLayers = ["chat-content", "members"];
      const background = (id) => getComputedStyle(document.getElementById(id));
      return {
        blockingLayers: flatLayers.filter((id) => background(id).backgroundColor !== transparent
          || background(id).backgroundImage !== "none"),
        paneBackgrounds: paneLayers.map((id) => [id, background(id).backgroundImage]),
        sidebarBackground: background("sidebar").backgroundColor,
        selectedChannel: background("selected-channel").backgroundColor,
      };
    });
    assert.deepEqual(paint.blockingLayers, []);
    assert.equal(paint.sidebarBackground, "rgba(0, 0, 0, 0)");
    for (const [id, background] of paint.paneBackgrounds) {
      assert.match(background, /\/ 0\.75\)/, id);
    }
    assert.equal(paint.selectedChannel, "rgb(255, 184, 108)");
    await page.locator("#member-hover").hover();
    const hover = await page.locator("#member-hover").evaluate((node) => getComputedStyle(node).backgroundColor);
    assert.notEqual(hover, "rgba(0, 0, 0, 0)");
  } finally {
    await browser.close();
  }
});

test("glass corners use one rail tint outside the sidebar and header fills", async () => {
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 420, height: 220 } });
    for (const layout of ["framed", "flat"]) {
      await page.setContent(fixture);
      await page.addStyleTag({ content: `
        #sidebar { position: absolute; top: 20px; left: 20px; width: 100px; height: 160px;
          box-sizing: border-box; border-top: 1px solid var(--app-frame-border); overflow: hidden; }
        #guild-list, #private-scroller { color: transparent; }
        #guild-list { box-sizing: border-box; height: 36px; border-bottom: 1px solid var(--chad-border); }
        #chat { position: absolute; top: 20px; left: 120px; width: 280px; overflow: hidden; }
        #chat[data-has-border="true"] { border-top: 1px solid var(--app-frame-border); }
        #channel-header { box-sizing: border-box; height: 36px; color: transparent; border-bottom: 1px solid var(--border-subtle); }
        #content { display: flex; height: 124px; }
        #chat-content { flex: 1; }
        #members { width: 80px; }
      ` });
      await page.evaluate(() => { document.getElementById("chat").dataset.hasBorder = "true"; });
      await page.addStyleTag({ content: exportCSS({
        layout, window: "glass", opacity: 80,
        surfaces: { rail: "palette:darker_black", sidebar: "palette:black", canvas: "palette:one_bg" },
      }) });
      for (const mode of ["guild", "dm"]) {
        await page.evaluate((mode) => {
          document.getElementById("guild-list").hidden = mode === "dm";
          document.getElementById("guild-nav").hidden = mode === "dm";
          document.getElementById("private-list").hidden = mode === "guild";
          document.getElementById("members").hidden = mode === "dm";
          const header = document.getElementById("channel-header");
          if (mode === "dm") {
            header.className = "container__9293f themed__9293f";
            const wrapper = document.createElement("div");
            wrapper.className = "subtitleContainer_f75fb0";
            header.before(wrapper);
            wrapper.append(header);
          }
        }, mode);
        for (const backdrop of ["white", "black"]) {
          await page.evaluate((color) => { document.documentElement.style.backgroundColor = color; }, backdrop);
          const pixels = await samplePixels(page, {
            corner: [21, 21], rim: [60, 20], curve: [23, 23], sidebar: [100, 130],
            topRight: [118, 21], topRightCurve: [116, 23], bottomLeft: [21, 178], bottomLeftCurve: [23, 176],
            bottomRight: [118, 178], bottomRightCurve: [116, 176], headerCorner: [121, 21], headerCurve: [123, 23],
            headerEndCorner: [398, 21], headerEndCurve: [396, 23],
            headerTop: [260, 20], headerBelowTop: [260, 21], header: [260, 42],
            chat: [260, 130], members: [390, 130], chatBottomStart: [121, 178], chatBottomEnd: [398, 178],
            innerChat: [316, 178], innerRoster: [321, 178],
            guildDivider: [60, 56], chatDivider: [260, 56], railBorder: [20, 130],
            railTop: [21, 20], tangent: [30, 20],
          });
          const sidebar = backdrop === "white" ? [67, 67, 79] : [16, 16, 28];
          const rail = backdrop === "white" ? [71, 71, 86] : [20, 20, 35];
          const chat = backdrop === "white" ? [79, 79, 100] : [28, 28, 49];
          const label = `${layout}, ${mode}, ${backdrop}`;
          const exterior = layout === "framed" ? rail : sidebar;
          const railFacingExterior = layout === "flat" && mode === "guild" ? rail : exterior;
          equalColor(pixels.corner, rail, `${label}: sidebar corner`);
          equalColor(pixels.topRight, exterior, `${label}: top-right junction outside the arc`);
          equalColor(pixels.bottomLeft, railFacingExterior, `${label}: bottom-left junction outside the arc`);
          equalColor(pixels.sidebar, sidebar, `${label}: sidebar body`);
          equalColor(pixels.headerCorner, exterior, `${label}: chat header corner outside the arc`);
          equalColor(pixels.headerEndCorner, mode === "guild" ? rail : exterior, `${label}: chat header end corner outside the arc`);
          equalColor(pixels.header, sidebar, `${label}: channel header`);
          equalColor(pixels.chat, chat, `${label}: chat body`);
          const members = mode === "guild" ? sidebar : chat;
          equalColor(pixels.members, members, `${label}: right of chat`);
          if (layout === "framed") {
            assert.deepEqual(pixels.rim, [45, 45, 78], `${label}: horizontal frame`);
            assert.deepEqual(pixels.headerTop, pixels.rim, `${label}: aligned header frame`);
          } else {
            const nativeEdge = backdrop === "white" ? [255, 255, 255] : [0, 0, 0];
            if (mode === "guild") {
              assert.deepEqual(pixels.guildDivider, [45, 45, 78], `${label}: existing guild header divider`);
              assert.deepEqual(pixels.headerTop, pixels.guildDivider, `${label}: matching chat top edge`);
              assert.deepEqual(pixels.rim, pixels.guildDivider, `${label}: matching channel sidebar top edge`);
              assert.deepEqual(pixels.chatDivider, pixels.guildDivider, `${label}: matching chat header divider`);
              assert.deepEqual(pixels.railBorder, pixels.guildDivider, `${label}: matching rail-facing border`);
              equalColor(pixels.railTop, rail, `${label}: rail paint at the top of the corner`);
              assert.deepEqual(pixels.tangent, pixels.guildDivider, `${label}: top stroke joins the arc`);
            } else {
              equalColor(pixels.headerTop, nativeEdge, `${label}: unchanged native DM top edge`);
              equalColor(pixels.rim, sidebar, `${label}: unchanged DM sidebar top`);
              equalColor(pixels.chatDivider, sidebar, `${label}: unchanged DM header divider`);
              equalColor(pixels.railBorder, sidebar, `${label}: unchanged DM rail edge`);
            }
          }
          equalColor(pixels.headerBelowTop, sidebar, `${label}: no second header frame row`);
          equalColor(pixels.bottomRight, exterior, `${label}: sidebar bottom-end cutout`);
          if (layout === "framed") {
            equalColor(pixels.chatBottomStart, rail, `${label}: chat bottom-start cutout`);
            equalColor(pixels.chatBottomEnd, rail, `${label}: chat bottom-end cutout`);
            if (mode === "guild") {
              equalColor(pixels.innerChat, chat, `${label}: chat fill at inner roster joint`);
              equalColor(pixels.innerRoster, sidebar, `${label}: roster fill at its inner joint`);
            }
          }
          for (const point of ["curve", "topRightCurve", "bottomLeftCurve", "bottomRightCurve", "headerCurve", "headerEndCurve"]) {
            if (layout === "framed") assert.notDeepEqual(pixels[point], sidebar, `${label}: ${point} visible`);
            else if (mode === "guild" && ["curve", "bottomLeftCurve", "headerEndCurve"].includes(point)) {
              assert.notDeepEqual(pixels[point], sidebar, `${label}: ${point} present on rail side`);
            } else assert.deepEqual(pixels[point], sidebar, `${label}: ${point} absent`);
          }
        }
      }
      assert.equal(await page.locator("#chat").evaluate((node) => getComputedStyle(node).borderTopWidth),
        layout === "framed" ? "0px" : "1px");
    }
  } finally {
    await browser.close();
  }
});

test("Framed Friends and adjacent main pages share the title rail color outside both arcs", async () => {
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 200 } });
    await page.setContent(`<!doctype html><html class="theme-dark"><head><style>
      #title { position: absolute; top: 0; left: 0; width: 320px; height: 20px; }
      #panel { position: absolute; top: 20px; left: 20px; width: 280px; height: 150px;
        border-top: 1px solid var(--app-frame-border); background: var(--background-base-lowest); }
      #header { height: 36px; box-sizing: border-box; border-bottom: 1px solid var(--border-subtle); }
      #body { height: 114px; background-color: var(--background-base-lower); }
      #active { float: right; width: 90px; height: 100%; background: var(--background-base-lower); }
      #popout { position: absolute; right: -12px; top: 60px; background: orange; }
    </style></head><body><div id="app-mount"><div id="title" class="bar_3zSH5d"></div>
      <main class="page_pog62O"><div id="panel" class="container_zrUwGA">
        <header id="header" class="themed_ybUK7Z"></header>
        <div id="body" class="tabBody_zrUwGA"><aside id="active" class="nowPlayingColumn_zrUwGA"></aside></div>
        <button id="popout">Popout</button>
      </div><div role="dialog" id="settings" style="background: orange"><header class="themed_ybUK7Z"></header></div></main>
    </div></body></html>`);
    for (const window of ["solid", "glass"]) {
      await page.evaluate((appearance) => { document.documentElement.className = appearance; },
        window === "glass" ? "theme-light" : "theme-dark");
      const style = await page.addStyleTag({ content: exportCSS({
        layout: "framed", window, opacity: 80,
        appearanceMode: window === "glass" ? "all" : "dark-only",
        surfaces: { rail: "#203040", sidebar: "#141423", canvas: "#23233D" },
      }) });
      for (const [panel, body, active] of [
        ["container_zrUwGA", "tabBody_zrUwGA", "nowPlayingColumn_zrUwGA"],
        ["container__133bf", "tabBody__133bf", "nowPlayingColumn__133bf"],
        ["chat_z_gUBg", "content_z_gUBg", ""],
        ["adjacent-route", "adjacent-content", ""],
      ]) {
        await page.evaluate(([panel, content, active]) => {
          document.getElementById("panel").className = panel;
          document.getElementById("body").className = content;
          document.getElementById("active").className = active;
          document.getElementById("active").hidden = !active;
        }, [panel, body, active]);
        for (const backdrop of ["black", "white"]) {
          await page.evaluate((backdrop) => { document.documentElement.style.backgroundColor = backdrop; }, backdrop);
          const colors = await samplePixels(page, {
            title: [150, 10], start: [21, 21], end: [298, 21], top: [150, 20], header: [150, 42],
            startStroke: [24, 22], endStroke: [295, 22],
            insideStart: [31, 30], insideEnd: [288, 30], list: [125, 103], right: [260, 103],
          });
          const context = `${panel} / ${window} / ${backdrop}`;
          equalColor(colors.start, colors.title, `${context}: outside start arc`);
          equalColor(colors.end, colors.title, `${context}: outside end arc`);
          equalColor(colors.top, [45, 45, 78], `${context}: top stroke`);
          equalColor(colors.startStroke, colors.top, `${context}: start arc stroke`);
          equalColor(colors.endStroke, colors.top, `${context}: end arc stroke`);
          equalColor(colors.insideStart, colors.header, `${context}: header inside start arc`);
          equalColor(colors.insideEnd, colors.header, `${context}: header inside end arc`);
          const canvas = window === "solid" ? [35, 35, 61] : backdrop === "black" ? [28, 28, 49] : [79, 79, 100];
          equalColor(colors.list, canvas, `${context}: body tint`);
          equalColor(colors.right, canvas, `${context}: one body tint across both columns`);
          assert.equal(await page.evaluate(() => document.elementFromPoint(305, 90)?.id), "popout", context);
          assert.equal(await page.locator("#settings").evaluate((node) => getComputedStyle(node).backgroundColor), "rgb(255, 165, 0)", context);
        }
      }
      await style.evaluate((node) => node.remove());
    }
  } finally {
    await browser.close();
  }
});

test("Flat Home rounds its rail-facing sidebar and outer main corner and removes only the extra rules", async () => {
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 360, height: 200 } });
    await page.setContent(`<!doctype html><html class="theme-dark"><head><style>
      #title { position: absolute; inset: 0 0 auto; height: 20px; }
      #sidebar { position: absolute; left: 20px; top: 20px; width: 120px; height: 155px;
        box-sizing: border-box; border-top: 1px solid var(--app-frame-border); }
      #search { box-sizing: border-box; height: 36px; padding: 8px; border-bottom: 1px solid var(--border-subtle); }
      #search button { border: 1px solid var(--input-border-default); }
      #home-divider { background: var(--border-subtle); height: 1px; margin-top: 22px; }
      #main { position: absolute; left: 140px; top: 20px; width: 200px; height: 155px;
        box-sizing: border-box; border-top: 1px solid var(--app-frame-border); }
      #tabs { height: 36px; box-sizing: border-box; }
      #content { height: 110px; }
      #quest-art { margin: 10px; width: 120px; height: 65px; background: orange; }
    </style></head><body><div id="app-mount"><div id="title" class="bar_3zSH5d"></div>
      <aside id="sidebar" class="sidebarList_pog62O"><nav class="privateChannels_u88IQl">
        <div id="search" class="searchBar_u88IQl"><button>Find a conversation</button></div>
        <div id="home-divider" class="sectionDivider_u88IQl"></div>
      </nav></aside>
      <main class="page_pog62O"><div id="main" class="container_ZTJWQo">
        <div id="tabs" class="tabs_ZTJWQo"></div><div id="content"><div id="quest-art"></div></div>
      </div></main>
    </div></body></html>`);
    for (const window of ["solid", "glass"]) {
      const style = await page.addStyleTag({ content: exportCSS({
        layout: "flat", window, opacity: 80,
        surfaces: { rail: "#203040", sidebar: "#141423", canvas: "#23233D" },
      }) });
      for (const route of ["quests", "friends"]) {
        await page.evaluate((route) => {
          const friends = route === "friends";
          document.getElementById("main").className = friends ? "container_zrUwGA" : "container_ZTJWQo";
          document.getElementById("tabs").className = friends ? "themed_ybUK7Z" : "tabs_ZTJWQo";
          document.getElementById("content").className = friends ? "tabBody_zrUwGA" : "contentSection_ZTJWQo";
          document.getElementById("quest-art").hidden = friends;
        }, route);
        for (const backdrop of ["black", "white"]) {
          await page.evaluate((backdrop) => { document.documentElement.style.backgroundColor = backdrop; }, backdrop);
          const colors = await samplePixels(page, {
            title: [190, 10], sidebarCorner: [21, 21], sidebarInside: [31, 30], sidebarFill: [130, 36],
            searchEdge: [130, 56], searchBelow: [130, 57], divider: [130, 79],
            mainCorner: [338, 21], mainInside: [328, 30], mainTop: [230, 20], mainHeader: [230, 37],
            questArt: [170, 80],
          });
          const context = `${route} / ${window} / ${backdrop}`;
          equalColor(colors.sidebarCorner, colors.title, `${context}: outside DM sidebar corner`);
          equalColor(colors.sidebarInside, colors.sidebarFill, `${context}: inside DM sidebar corner`);
          equalColor(colors.searchEdge, colors.searchBelow, `${context}: no DM search divider`);
          assert.deepEqual(colors.divider, [45, 45, 78], `${context}: DM group divider preserved`);
          equalColor(colors.mainCorner, colors.title, `${context}: outside Home main corner`);
          equalColor(colors.mainInside, colors.mainHeader, `${context}: inside Home main corner`);
          equalColor(colors.mainTop, colors.mainHeader, `${context}: no top rule above Home main`);
          if (route === "quests") assert.deepEqual(colors.questArt, [255, 165, 0], `${context}: Quest content preserved`);
        }
      }
      await style.evaluate((node) => node.remove());
    }
  } finally {
    await browser.close();
  }
});

test("sidebar corner framing clips a raised banner without clipping controls outside the sidebar", async () => {
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 420, height: 220 } });
    for (const window of ["solid", "glass"]) {
      for (const layout of ["framed", "flat"]) {
        await page.setContent(fixture);
        await page.evaluate(() => {
          document.documentElement.style.backgroundColor = "white";
          document.getElementById("sidebar").insertAdjacentHTML("afterbegin", `
            <div class="bannerImage_f37cb1" id="banner" style="position:absolute;inset:0 0 auto;height:30px">
              <div style="position:absolute;inset:0;background:orange"></div>
            </div>
            <button type="button" id="invite" style="position:absolute;top:4px;right:6px">Invite</button>
            <button type="button" id="popover" style="position:absolute;top:50px;left:95px">Menu</button>
          `);
          document.getElementById("sidebar-shell").insertAdjacentHTML("beforeend", `
            <button type="button" class="panels_c48ade" id="account" style="position:absolute;top:145px;left:26px">Account</button>
          `);
        });
        await page.addStyleTag({ content: `
          #sidebar { position:absolute; top:20px; left:20px; width:100px; height:160px; }
          #chat { position:absolute; top:20px; left:140px; width:260px; }
        ` });
        await page.addStyleTag({ content: exportCSS({ window, layout, opacity: 80, surfaces: { sidebar: "palette:black" } }) });
        const result = await page.evaluate(() => {
          const sidebar = getComputedStyle(document.getElementById("sidebar"));
          const chat = getComputedStyle(document.getElementById("chat"));
          const header = getComputedStyle(document.getElementById("channel-header"));
          const banner = getComputedStyle(document.getElementById("banner"));
          const hitTest = (x, y) => document.elementFromPoint(x, y)?.id;
          return {
            sidebarCorners: [sidebar.borderTopLeftRadius, sidebar.borderTopRightRadius,
              sidebar.borderBottomRightRadius, sidebar.borderBottomLeftRadius],
            chatCorners: [chat.borderTopLeftRadius, chat.borderTopRightRadius,
              chat.borderBottomRightRadius, chat.borderBottomLeftRadius],
            headerCorner: header.borderTopLeftRadius,
            bannerCorner: banner.borderTopRightRadius,
            bannerRailCorner: banner.borderTopLeftRadius,
            bannerOverflow: banner.overflow,
            sidebarOverflow: sidebar.overflow,
            controls: [[92, 34], [130, 80], [50, 155]].map(([x, y]) => hitTest(x, y)),
          };
        });
        const radius = layout === "framed" ? "10px" : "0px";
        assert.deepEqual(result.sidebarCorners, Array(4).fill("0px"), `${window}, ${layout}`);
        assert.deepEqual(result.chatCorners, Array(4).fill("0px"), `${window}, ${layout}`);
        assert.equal(result.headerCorner, "0px");
        assert.equal(result.bannerCorner, radius);
        assert.equal(result.bannerRailCorner, "10px");
        assert.equal(result.bannerOverflow, "hidden");
        assert.equal(result.sidebarOverflow, "visible");
        assert.deepEqual(result.controls, ["invite", "popover", "account"]);
        const pixels = await samplePixels(page, { banner: [60, 35], topRight: [118, 21] });
        assert.deepEqual(pixels.banner, [255, 165, 0], `${window}, ${layout}: banner paint`);
        const corner = layout === "flat" ? [255, 165, 0] : window === "glass" ? [71, 71, 86] : [25, 25, 44];
        assert.deepEqual(pixels.topRight, corner, `${window}, ${layout}: banner corner`);
      }
    }
  } finally {
    await browser.close();
  }
});

test("the rail paint continues through the account exterior in both layouts", async () => {
  const { chromium } = require(playwright);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 420, height: 220 }, deviceScaleFactor: 2 });
    for (const window of ["solid", "glass"]) {
      for (const layout of ["framed", "flat"]) {
        await page.setContent(fixture);
        await page.evaluate(() => {
          document.getElementById("app-mount").insertAdjacentHTML("afterbegin", '<div class="bar_3zSH5d" id="title-bar"></div>');
          document.getElementById("sidebar-shell").insertAdjacentHTML("afterbegin", '<nav class="wrapper_5dqHTG" id="rail"></nav>');
          document.getElementById("sidebar-shell").insertAdjacentHTML("beforeend",
            '<button type="button" class="panels_pog62O" id="account">Account</button>');
          document.getElementById("chat-content").insertAdjacentHTML("beforeend",
            '<button type="button" id="composer">Composer</button>');
          document.getElementById("app-mount").insertAdjacentHTML("beforeend",
            '<button type="button" id="input-popout">Menu</button>');
          document.getElementById("chat").dataset.hasBorder = "true";
        });
        await page.addStyleTag({ content: `
          #app-mount { --custom-guild-list-width: 40px; }
          #title-bar { position:absolute; inset:0 0 auto; height:20px; }
          #sidebar-shell { position:absolute; top:20px; left:0; width:160px; height:160px; overflow:hidden; }
          #sidebar-shell::after { content:""; position:absolute; inset:auto 1px 0 0; height:8px; background:grey; }
          #rail { position:absolute; inset:0 auto 48px 0; width:var(--custom-guild-list-width); mask:linear-gradient(black 85%,transparent); }
          #sidebar { position:absolute; top:0; left:var(--custom-guild-list-width); width:120px; height:160px;
            box-sizing:border-box; border-top:1px solid var(--app-frame-border);
            border-inline-start:1px solid var(--app-frame-border); overflow:hidden; }
          #guild-list, #private-scroller, #selected-channel { color:transparent !important; }
          #guild-list { box-sizing:border-box; height:36px; border-bottom:1px solid var(--chad-border); }
          #guild-nav { height:calc(100% - 36px); }
          #account { position:absolute; inset:auto 8px 8px; height:34px; z-index:10; background:orange; }
          #chat { position:absolute; top:20px; left:160px; width:260px; overflow:hidden; }
          #chat[data-has-border="true"] { border-top:1px solid var(--app-frame-border); }
          #channel-header { box-sizing:border-box; height:36px; border-bottom:1px solid var(--border-subtle); }
          #content { display:flex; height:124px; }
          #chat-content { flex:1; position:relative; }
          #members { width:80px; }
          #composer { position:absolute; bottom:8px; left:8px; }
          #input-popout { position:absolute; top:192px; left:350px; }
        ` });
        await page.addStyleTag({ content: exportCSS({
          window, layout, opacity: 80, surfaces: { rail: "#203040", sidebar: "#141423", canvas: "#23233D" },
        }) });
        for (const [backdrop, changed] of [["white", false], ["black", false], ["white", true]]) {
          await page.evaluate(({ backdrop, changed }) => {
            const root = document.documentElement.style;
            root.backgroundColor = backdrop;
            if (changed) {
              root.setProperty("--chad-rail", "#304020");
              root.setProperty("--chad-sidebar", "#112233");
              root.setProperty("--chad-canvas", "#232330");
              root.setProperty("--chad-border", "#51518C");
              root.setProperty("--chad-window-opacity", "0.75");
            }
          }, { backdrop, changed });
          const pixels = await samplePixels(page, {
            title: [100, 10], rail: [5, 85], fade: [5, 129], behindCard: [5, 155], footer: [5, 177],
            sidebar: [100, 100], sidebarCorner: [41, 21], topJoin: [158, 21], lowerCorner: [41, 178],
            lowerEnd: [158, 178], header: [275, 35], headerCorner: [161, 21],
            headerEndCorner: [418, 21], headerEndTop: [418, 20], headerEndInterior: [404, 30],
            chatLowerStart: [161, 178], chatLowerEnd: [418, 178],
            sidebarTop: [100, 20], chatTop: [275, 20], sidebarBelow: [100, 21], chatBelow: [275, 21],
            sidebarTopSecondPixel: [100, 20.5], chatTopSecondPixel: [275, 20.5],
            guildDivider: [100, 56], chatDivider: [275, 56], railBorder: [40, 132],
            railTop: [41, 20], railTopSecondPixel: [41, 20.5],
            arcTop: [49.5, 20], arcTopSecondPixel: [49.5, 20.5], arcBelow: [49.5, 21],
            guildDividerSecondPixel: [100, 56.5], chatDividerSecondPixel: [275, 56.5],
          });
          const rail = window === "solid" ? (changed ? [48, 64, 32] : [32, 48, 64])
            : changed ? [100, 112, 88] : backdrop === "white" ? [77, 89, 102] : [26, 38, 51];
          const sidebar = window === "solid" ? (changed ? [17, 34, 51] : [20, 20, 35])
            : changed ? [77, 89, 102] : backdrop === "white" ? [67, 67, 79] : [16, 16, 28];
          const context = `${window}, ${layout}, ${backdrop}, ${changed ? "runtime overrides" : "export"}`;
          for (const region of ["title", "rail", "fade", "behindCard", "footer"]) {
            equalColor(pixels[region], rail, `${context}: ${region}`);
          }
          for (const region of ["sidebar", "header"]) equalColor(pixels[region], sidebar, `${context}: ${region}`);
          const exterior = layout === "framed" ? rail : sidebar;
          for (const region of ["topJoin", "headerCorner"]) {
            equalColor(pixels[region], exterior, `${context}: ${region}`);
          }
          equalColor(pixels.sidebarCorner, rail, `${context}: rail-facing upper corner`);
          equalColor(pixels.lowerCorner, rail, `${context}: rail-facing lower corner`);
          equalColor(pixels.headerEndCorner, rail, `${context}: rail tint outside upper chat end`);
          equalColor(pixels.headerEndTop, rail, `${context}: top row outside upper chat end`);
          equalColor(pixels.headerEndInterior, sidebar, `${context}: fill inside upper chat end`);
          if (layout === "framed") {
            for (const region of ["lowerEnd", "chatLowerStart", "chatLowerEnd"]) {
              equalColor(pixels[region], rail, `${context}: ${region}`);
            }
          } else {
            const edge = changed ? [81, 81, 140] : [45, 45, 78];
            equalColor(pixels.chatTop, edge, `${context}: matching chat edge`);
            equalColor(pixels.sidebarTop, edge, `${context}: matching channel edge`);
            equalColor(pixels.chatTopSecondPixel, edge, `${context}: second device pixel of chat edge`);
            equalColor(pixels.sidebarTopSecondPixel, edge, `${context}: second device pixel of channel edge`);
            equalColor(pixels.railTop, rail, `${context}: top row above rail-facing corner`);
            equalColor(pixels.railTopSecondPixel, rail, `${context}: second pixel above rail-facing corner`);
            equalColor(pixels.arcTop, edge, `${context}: first device pixel at arc tangent`);
            equalColor(pixels.arcTopSecondPixel, edge, `${context}: second device pixel at arc tangent`);
            equalColor(pixels.arcBelow, sidebar, `${context}: clear line-to-arc transition below the stroke`);
            equalColor(pixels.sidebarBelow, sidebar, `${context}: sidebar below the edge`);
            equalColor(pixels.chatBelow, sidebar, `${context}: header below the edge`);
            assert.deepEqual(pixels.guildDivider, edge, `${context}: existing guild header divider`);
            assert.deepEqual(pixels.chatDivider, pixels.guildDivider, `${context}: matching chat header divider`);
            assert.deepEqual(pixels.guildDividerSecondPixel, edge, `${context}: second device pixel of guild divider`);
            assert.deepEqual(pixels.chatDividerSecondPixel, edge, `${context}: second device pixel of chat divider`);
            assert.deepEqual(pixels.railBorder, pixels.guildDivider, `${context}: matching rail-facing edge`);
          }
        }
        assert.deepEqual(await page.evaluate(() => (
          [[100, 156], [180, 160], [365, 200]].map(([x, y]) => document.elementFromPoint(x, y)?.id)
        )), ["account", "composer", "input-popout"]);
        if (layout === "flat") {
          await page.evaluate(() => { document.getElementById("chat").dataset.hasBorder = "false"; });
          const { sidebar, header } = await samplePixels(page, { sidebar: [100, 20], header: [275, 20] });
          const fill = window === "solid" ? [17, 34, 51] : [77, 89, 102];
          equalColor(sidebar, fill, `${window}: borderless sidebar`);
          equalColor(header, fill, `${window}: borderless header`);
        }
      }
    }
  } finally {
    await browser.close();
  }
});

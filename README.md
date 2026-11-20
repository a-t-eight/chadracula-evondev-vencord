# Chadracula-Evondev for Discord

Chadracula-Evondev brings the NvChad Base46 palette to Discord. Install a theme for **Vesktop**, **Discord desktop with Vencord**, or [mobile with Kettu or Rain](#install-on-mobile). Use the offline **Chadracula Studio** to customize desktop themes.

## Switch accents with Appearance

The Chadracula Appearance Switcher uses the Framed Glass layout and changes the accent when you select a theme under **User Settings → Appearance**. Light uses dark surfaces with a Nord Blue accent.

| Discord appearance | Accent |
| --- | --- |
| Light | Nord Blue `#05C3FF` |
| Ash | Pink `#FF6BCB` |
| Dark or Onyx | Violet `#9A86FD` |

1. In Vesktop or Discord desktop with Vencord, open **User Settings → Themes**. Disable any enabled Chadracula theme under **Local Themes**, including a local copy of the switcher.
2. Under **Online Themes**, remove previous Chadracula entries and paste this single raw CSS URL on its own line, without an `@light` or `@dark` prefix.

   ```text
   https://raw.githubusercontent.com/a-t-eight/chadracula-evondev-vencord/refs/heads/main/switchers/chadracula-appearance-switcher.theme.css
   ```

3. Click outside the **Online Themes** text box to apply the change. Open **Appearance** to choose your accent. [Vencord’s Online Themes controls](https://github.com/Vendicated/Vencord/blob/e75ac9ace41f6212cfaa2d5f3670830be392da4e/src/components/settings/tabs/themes/OnlineThemesTab.tsx#L13-L26)

## Choose a theme

For a fixed accent and layout, download one CSS file for your client. Use its matching JSON file to edit the theme in Studio.

| Accent | Flat Solid | Flat Glass | Framed Solid | Framed Glass |
| --- | --- | --- | --- | --- |
| Nord Blue | [CSS](themes/chadracula-nord-blue-solid-flat-teal.theme.css) · [JSON](themes/chadracula-nord-blue-solid-flat-teal.json) | [CSS](themes/chadracula-nord-blue-glass-flat-teal.theme.css) · [JSON](themes/chadracula-nord-blue-glass-flat-teal.json) | [CSS](themes/chadracula-nord-blue-solid-framed-teal.theme.css) · [JSON](themes/chadracula-nord-blue-solid-framed-teal.json) | [CSS](themes/chadracula-nord-blue-glass-framed-teal.theme.css) · [JSON](themes/chadracula-nord-blue-glass-framed-teal.json) |
| Pink | [CSS](themes/chadracula-pink-solid-flat-teal.theme.css) · [JSON](themes/chadracula-pink-solid-flat-teal.json) | [CSS](themes/chadracula-pink-glass-flat-teal.theme.css) · [JSON](themes/chadracula-pink-glass-flat-teal.json) | [CSS](themes/chadracula-pink-solid-framed-teal.theme.css) · [JSON](themes/chadracula-pink-solid-framed-teal.json) | [CSS](themes/chadracula-pink-glass-framed-teal.theme.css) · [JSON](themes/chadracula-pink-glass-framed-teal.json) |
| Violet | [CSS](themes/chadracula-violet-solid-flat-teal.theme.css) · [JSON](themes/chadracula-violet-solid-flat-teal.json) | [CSS](themes/chadracula-violet-glass-flat-teal.theme.css) · [JSON](themes/chadracula-violet-glass-flat-teal.json) | [CSS](themes/chadracula-violet-solid-framed-teal.theme.css) · [JSON](themes/chadracula-violet-solid-framed-teal.json) | [CSS](themes/chadracula-violet-glass-framed-teal.theme.css) · [JSON](themes/chadracula-violet-glass-framed-teal.json) |

**Flat** rounds the rail-facing Home sidebar and the outer upper corner of Home and guild chat panes while keeping the guild header dividers. **Framed** adds rounded outlines around the panes and matches the fill outside both upper main-panel corners to the title bar and server rail. **Solid** gives the themed panes opaque fills. **Glass** ships with 80% pane opacity and can show the native backdrop when the client and OS expose it. The twelve themes use the inherited Base46 `teal` muted text role. It resolves to `#92A2D4` in Solid and `#ADB9DF` in Glass for readability.

## Install on mobile

Each mobile theme keeps one accent and a dark canvas in Auto, Dark, and Light. Floating controls use an 80% tint over the app background. The spec 2 JSON uses the same resolved palette as the matching desktop Solid Flat Studio configuration.

| Theme | Accent | Install URL |
| --- | --- | --- |
| [Chadracula Nord Blue](mobile/nord-blue.json) | `#05C3FF` | [Raw JSON](https://raw.githubusercontent.com/a-t-eight/chadracula-evondev-vencord/refs/heads/main/mobile/nord-blue.json) |
| [Chadracula Pink](mobile/pink.json) | `#FF6BCB` | [Raw JSON](https://raw.githubusercontent.com/a-t-eight/chadracula-evondev-vencord/refs/heads/main/mobile/pink.json) |
| [Chadracula Violet](mobile/violet.json) | `#9A86FD` | [Raw JSON](https://raw.githubusercontent.com/a-t-eight/chadracula-evondev-vencord/refs/heads/main/mobile/violet.json) |

1. Copy the **Raw JSON** link for your accent. To install from a release tag, open the JSON file in that tag and copy its **Raw** URL.
2. Open **Kettu → Themes → Install a theme** or **Rain → Themes → Install a theme from URL**. Paste the URL, select the installed theme, and reload if prompted.
3. To revert, deselect the theme or select your previous theme, then reload if prompted.

Violet passed device checks in Auto, Dark, and Light on iOS 27.0.1 with Discord+ 345.0 PTB and Kettu 1.4.3. Nord Blue and Pink passed generated color and format checks. Physical-device testing for those two accents and native rendering in Rain remain unverified. The dark chat header can make black iOS status indicators difficult to see. [Mobile verification and known limits](TESTING.md#mobile-theme-verification)

RainTweak’s official iOS support excludes iOS 27. [RainTweak installation notes](https://github.com/ra1ncord/RainTweak/blob/c2fa89a6c23eacad923cf46fcb70d45957aa37e0/README.md#installation)

### NexxUtils NSFW labels

On Discord 345 PTB (112811), NexxUtils 1.0.1 **Colorful Channels** can draw black NSFW text on a dark channel list because the plugin requests retired Discord color roles. In **Kettu → Plugins → NexxUtils → Configure → Colorful Channels**, turn off **NSFW tag**, then switch to another guild and back. The built-in warning icon remains visible. A plugin update that uses current color roles can restore a legible tag.

## Install on macOS or Windows

Use these steps for a downloaded variant or Studio export.

1. Install [Vesktop](https://vesktop.dev/) or [Vencord for Discord desktop](https://vencord.dev/download/) using the corresponding project’s instructions.
2. In the desktop client, open **User Settings → Themes → Local Themes → Open Themes Folder**. Copy the `.theme.css` file there and enable it under **Local Themes**. Select **Load missing Themes** if the file is absent from the list. [Vencord’s local theme controls](https://github.com/Vendicated/Vencord/blob/e75ac9ace41f6212cfaa2d5f3670830be392da4e/src/components/settings/tabs/themes/LocalThemesTab.tsx#L145-L194)
3. Use one complete theme at a time. For variants from the table or Studio’s **Dark appearances only** mode, select Ash, Dark or Onyx in Discord. If existing theme or QuickCSS rules conflict, record your previous settings so you can restore them.

If you also use OpenAsar, manage the theme and native material in Vencord. The [loader check](TESTING.md#openasar-loader-check) verified stylesheet delivery in isolation. The native Discord tests used the stock bootstrap with Vencord.

### Glass and native window materials

The CSS controls the color and opacity of the panes in your local client. The desktop client and OS supply the macOS vibrancy or Windows material. The Studio preview simulates the tint over a sample backdrop.

| Platform | Vesktop | Discord desktop with Vencord |
| --- | --- | --- |
| macOS | **User Settings → Vencord → MacOS Window vibrancy style**. | Same Vencord setting. |
| Windows 11 22H2 or newer (build 22621+) | **User Settings → Vesktop → Transparency Options**. Choose **Mica**, **Tabbed**, **Acrylic** or **None**. | **User Settings → Vencord → Background Material**. Choose **Mica**, **Tabbed**, **Acrylic** or **None**. |

For a backdrop response that persists when the client loses focus on macOS, try **Selection** with either state of **Enable window transparency**, or **No vibrancy** with the switch on. In both tested clients, **Sidebar** and **HUD** responded while focused, stayed fixed while unfocused, and responded again after refocusing. Fully quit with **⌘Q** and relaunch after changing the settings. **Reduce transparency** in **Accessibility → Display** can replace translucency with a solid fill. [Measured macOS settings](TESTING.md#macos-glass-backdrop-response) · [Vencord macOS selector](https://github.com/Vendicated/Vencord/blob/e75ac9ace41f6212cfaa2d5f3670830be392da4e/src/components/settings/tabs/vencord/MacVibrancySettings.tsx) · [Apple display settings](https://support.apple.com/guide/mac-help/mchl11ddd4b3/mac)

On Windows, use the client’s notification-area **Quit** action and relaunch after changing the material. **Mica** and **Tabbed** use wallpaper tint. **Acrylic** uses blur. **Transparency effects** in Windows **Settings → Personalization → Colors** and compositor conditions can affect the result. **Mica** with **Enable window transparency** off was the setting used for the Windows interaction checks. **Acrylic** with either switch state responded to controlled changes behind the window in the tested Remote Desktop session. A local Windows desktop can render materials differently. [Vesktop material selector](https://github.com/Vencord/Vesktop/blob/af702693ed2c7bfaa72629795c46f80166e71789/src/renderer/components/settings/WindowsTransparencyControls.tsx) · [Vencord material selector](https://github.com/Vendicated/Vencord/blob/e75ac9ace41f6212cfaa2d5f3670830be392da4e/src/components/settings/tabs/vencord/WindowsMaterialSettings.tsx) · [Microsoft Mica](https://learn.microsoft.com/windows/apps/design/style/mica) · [Microsoft Acrylic](https://learn.microsoft.com/windows/apps/design/style/acrylic)

For opaque panes, use a **Solid** export. For the default native window appearance as well, select **No vibrancy** on macOS or **None** on Windows, turn off the separate **Enable window transparency** setting, and relaunch the client.

See the [testing report](TESTING.md) for the measured material behavior and client coverage.

### Remove or switch themes

Remove the switcher URL from **Online Themes** and click outside the text box to apply the change. For a fixed variant, disable it under **Local Themes**. Re-enable your previous theme or enable another Chadracula export. Restore the previous native material setting and fully quit and relaunch if you changed it. [Vencord theme recovery](https://vencord.dev/support/#my-themes-broke-and-now-i-cant-open-settings-or-disable-them)

## Customize offline

1. Keep the [`studio/`](studio/) directory together and open [`studio/index.html`](studio/index.html) directly in a modern browser. Studio runs from local files.
2. Use **Import config** with a JSON file from the table or one of the [Violet Glass templates](templates/README.md). You can also start with a built-in preset.
3. Set **Export appearance** to choose how the theme responds to Discord’s appearance setting.

   | Mode | Result |
   | --- | --- |
   | Dark appearances only | One accent in Ash, Dark and Onyx. Light keeps Discord’s default styling. Older configurations use this mode by default. |
   | All appearances (fixed accent) | One accent in Light, Ash, Dark and Onyx. |
   | Accent by appearance | Set each appearance’s accent and select **Preview appearance** to inspect it. The four choices start with your fixed accent and Studio remembers them when you change export mode. |

   Both all-appearance modes apply Chadracula’s dark surfaces in Light. Legacy AMOLED uses the Onyx accent.

4. Pick Base30 and Base16 colors by name or enter custom Hex, RGB or HSV values. Use **Inspect palette** to see the resolved values. Switch the preview between the sample server and direct messages, or use **Save as A** and **Compare** to compare with your draft.
5. **Download CSS** creates the installable `.theme.css` file. The filename matches the name displayed in the client, and the theme card describes the accent or appearance mapping. **Save config** creates editable version 1 JSON for re-import later. The Studio saves your draft in browser storage when available.

The preview uses synthetic content. Generation and preview run locally without a client account.

## Rebuild and verify

Use Node.js 22 or newer from the repository root. The generator and unit checks use Node’s standard library.

```sh
node scripts/build-themes.cjs
node scripts/build-themes.cjs --check
node --test "tests/*.test.cjs"
```

The [desktop manifest](themes/manifest.json) records the Studio downloads, hashes, and resolved accent and muted colors. The [mobile manifest](mobile/manifest.json) records each mobile theme’s accent, filename, and SHA-256. `--check` compares all checked-in generated assets with freshly generated bytes. These checks and the unit suite run in GitHub Actions. For a portable release check, run the same commands from an extracted release archive.

The optional browser suite uses Playwright with Chromium. Install the test tools and run the suite from the repository root.

```sh
npm install --no-save --package-lock=false playwright@1.63.0
npx playwright install chromium
node --test "tests/*.browser.cjs"
```

The suite exercises import, preview, exact CSS and JSON downloads, and reload for all twelve variants at desktop and narrow widths. It also checks the three export modes, keyboard navigation, custom color editors, nested Light settings, forced colors, and pane and plugin card paint against synthetic fixtures. To use an existing Playwright installation or Chromium binary, set `CHADRACULA_PLAYWRIGHT` or `CHADRACULA_CHROMIUM` to its path before running the tests. The browser tests exercise the renderer using local fixtures. The OS compositor and real desktop client need separate validation.

## License and credits

The original Discord port and Studio are by **a-t-eight** and licensed under [Apache-2.0](LICENSE). The palette comes from BrunoKrugel’s Chadracula-Evondev adaptation to NvChad Base46, based on Evondev Dracula and its Dracula Official heritage. See [NOTICE](NOTICE) and the [upstream Base46 license notice](notices/LICENSE-base46).

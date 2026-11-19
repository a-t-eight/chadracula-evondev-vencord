# Chadracula-Evondev for Discord

Chadracula-Evondev brings the NvChad Base46 palette to Discord desktop. Pick a ready-made theme for **Vesktop** or **Discord desktop with Vencord**, or customize one in the offline **Chadracula Studio**.

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

**Flat** uses continuous pane dividers and rounded corners beside the server rail. **Framed** adds rounded outlines around the panes. **Solid** gives the themed panes opaque fills. **Glass** ships with 80% pane opacity and can show the native backdrop when the client and OS expose it. The twelve themes use the inherited Base46 `teal` muted text role. It resolves to `#92A2D4` in Solid and `#ADB9DF` in Glass for readability.

## Install on macOS or Windows

Use these steps for a fixed variant from the table above.

1. Install [Vesktop](https://vesktop.dev/) or [Vencord for Discord desktop](https://vencord.dev/download/) using the corresponding project’s instructions.
2. In the desktop client, open **User Settings → Themes → Local Themes → Open Themes Folder**. Copy the `.theme.css` file there and enable it under **Local Themes**. Select **Load missing Themes** if the file is absent from the list. [Vencord’s local theme controls](https://github.com/Vendicated/Vencord/blob/e75ac9ace41f6212cfaa2d5f3670830be392da4e/src/components/settings/tabs/themes/LocalThemesTab.tsx#L145-L194)
3. Select Discord’s dark appearance and use one complete theme at a time. If existing theme or QuickCSS rules conflict, record your previous settings so you can restore them.

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
3. Pick Base30 and Base16 colors by name or enter custom Hex, RGB or HSV values. Use **Inspect palette** to see the resolved values. Switch the preview between the sample server and direct messages, or use **Save as A** and **Compare** to compare with your draft.
4. **Download CSS** creates the installable `.theme.css` file. Its filename and in-client theme name follow `chadracula-<accent>-<window>-<layout>-<muted>`. **Save config** creates editable version 1 JSON for re-import later. The Studio saves your draft in browser storage when available.

The preview uses synthetic content. Generation and preview run locally without a client account.

## Rebuild and verify

Use Node.js 22 or newer from the repository root. The generator and unit checks use Node’s standard library.

```sh
node scripts/build-themes.cjs
node scripts/build-themes.cjs --check
node --test "tests/*.test.cjs"
```

The [release manifest](themes/manifest.json) records each variant’s filename, SHA-256 hashes for both downloads, and resolved accent and muted colors. `--check` compares all checked-in assets with freshly generated bytes. For a portable release check, run the same commands from a fresh copy of this repository.

The optional browser suite uses Playwright with Chromium. Install the test tools and run the suite from the repository root.

```sh
npm install --no-save --package-lock=false playwright@1.63.0
npx playwright install chromium
node --test "tests/*.browser.cjs"
```

The suite exercises import, preview, exact CSS and JSON downloads, and reload for all twelve release variants at desktop and narrow widths. It also checks keyboard navigation, custom color editors, and pane paint against synthetic fixtures. To use an existing Playwright installation or Chromium binary, set `CHADRACULA_PLAYWRIGHT` or `CHADRACULA_CHROMIUM` to its path before running the tests. The browser tests exercise the renderer using local fixtures. The OS compositor and real desktop client need separate validation.

## License and credits

The original Discord port and Studio are by **a-t-eight** and licensed under [Apache-2.0](LICENSE). The palette comes from BrunoKrugel’s Chadracula-Evondev adaptation to NvChad Base46, based on Evondev Dracula and its Dracula Official heritage. See [NOTICE](NOTICE) and the [upstream Base46 license notice](notices/LICENSE-base46).

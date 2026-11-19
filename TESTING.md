# Testing Chadracula-Evondev

The desktop and native material results below cover the 12 variants tagged `v1.0.1`. Nord Blue, Pink and Violet were each tested in Flat and Framed, with Solid and 80% Glass. The tagged manifest SHA-256 is `78246156b05fe1f63258fb1924c4db8e9ab19b68ae30ea5ba027f276a14c87a8`.

## Desktop coverage

| Environment | Client | Native guild render cases |
| --- | --- | --- |
| macOS 27.2.1, local desktop | Discord Stable 0.0.423 with Vencord | **312/312** across 13 vibrancy choices and both transparency switch states |
| macOS 27.2.1, local desktop | Vesktop 1.6.9 | **312/312** across the same settings |
| Windows 11 25H2, Remote Desktop session | Discord Stable 1.0.9268 with Vencord | **96/96** across four materials and both transparency switch states |
| Windows 11 25H2, Remote Desktop session | Vesktop 1.6.9 | **96/96** across the same settings |

All **816 native render cases** passed after follow-up. Signed-in clients used the exact release CSS for accent, contrast, pane fill and geometry checks. The Discord matrices used the stock bootstrap with Vencord.

All **48 theme-and-client interaction sets** passed across the tested settings, including guilds, DMs, the message composer, settings, search, members, Pins and Threads. The **24 scripted Windows sets** also typed and cleared an unsent draft at Mica with transparency off. All **68 representative control checks** passed, one per client, material and switch combination. All four tested clients displayed the 12 expected Local Themes cards. A card was selected and the resulting live theme was verified in each client. Both macOS clients passed all 12 guild-to-DM render checks.

A separate Windows App pass directly inspected all **24 Windows theme-and-client combinations** and verified Threads opening and closing. Four Discord cases needed a delayed close capture. The original Windows client profiles were verified after testing, and the temporary test environment was removed.

Both macOS client profiles and their QuickCSS were restored and verified after testing.

## Native material observations

The Studio preview simulates the theme's surface colors and opacity. The client and OS control the actual backdrop.

### macOS Glass backdrop response

The focus-controlled follow-up covered 52 client, vibrancy and transparency settings, two exact release styles, and three focus states. All **312 series** passed validation. Each of the **936 measurement phases** verified foreground ownership and sampled the registered pane locations in the same window. The backing changed from black to white and back to black. Half the phases sampled an exposed part of the backing. The other half sampled the registered backing window underneath the tested panes. The earlier normal-window comparison is archived as historical evidence because it mixed focus contexts.

**Sidebar matched in both clients.** With either transparency setting, the header, channel sidebar and chat in Nord Blue Glass Framed each shifted by **9** RGB levels when focused, **0** when unfocused and **9** after refocusing.

Each table cell lists **focused / unfocused / refocused**. A value is the largest change in any RGB channel (0–255) between the black and white backing samples across the three panes. Zero means the sampled pane colors stayed fixed during that backing change. Off and On refer to **Enable window transparency**. Fullscreen UI is a vibrancy preset, tested here in normal windows.

| Vibrancy | Discord Off | Discord On | Vesktop Off | Vesktop On |
| --- | ---: | ---: | ---: | ---: |
| HUD | 29 / 0 / 29 | 29 / 0 / 29 | 29 / 0 / 29 | 29 / 0 / 29 |
| No vibrancy | 0 / 0 / 0 | 51 / 51 / 51 | 0 / 0 / 0 | 51 / 51 / 51 |
| Under Page | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Content | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Window | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Selection | 45 / 48 / 45 | 45 / 48 / 45 | 45 / 48 / 45 | 45 / 48 / 45 |
| Titlebar | 10 / 0 / 10 | 10 / 0 / 10 | 10 / 0 / 10 | 10 / 0 / 10 |
| Header | 10 / 0 / 10 | 10 / 0 / 10 | 10 / 0 / 10 | 10 / 0 / 10 |
| Sidebar | 9 / 0 / 9 | 9 / 0 / 9 | 9 / 0 / 9 | 9 / 0 / 9 |
| Tooltip | 9 / 0 / 9 | 9 / 0 / 9 | 9 / 0 / 9 | 9 / 0 / 9 |
| Menu | 14 / 0 / 14 | 14 / 0 / 14 | 14 / 0 / 14 | 14 / 0 / 14 |
| Popover | 19 / 0 / 19 | 19 / 0 / 19 | 18 / 0 / 18 | 18 / 0 / 18 |
| Fullscreen UI | 24 / 0 / 24 | 24 / 0 / 24 | 24 / 0 / 24 | 24 / 0 / 24 |

In each client, the Glass theme responded in **19/26 focused**, **3/26 unfocused** and **19/26 refocused** settings. The refocused response reproduced the initial focused response in every setting. Popover's largest shift was one RGB level higher in Discord than in Vesktop when focused and refocused. All other table values matched across clients.

All **156 Pink Solid Flat series** stayed invariant, covering 26 settings per focus state and client. A separate comparison at the same black backing across all 104 setting-and-style pairs found a focus-loss change of up to four RGB levels. All sampled pane colors returned to their initial values on refocusing.

Earlier, separate Discord native-fullscreen controls with **No vibrancy** and transparency off showed fixed pane colors in Violet Glass Framed and Violet Solid Framed.

**Windows Remote Desktop.** DWM reported types **2/0** for None, **2/2** for Mica, **4/4** for Tabbed and **3/3** for Acrylic, in transparency off/on order. The sampled Remote Desktop windows lacked keyboard focus. Appearance on a local, focused Windows desktop remains unmeasured. In 36 Glass cases, Acrylic with either switch state and None with transparency on produced different desktop colors in the server rail and behind the account panel, even though their renderer tint and opacity matched. With two controlled uniform backings, the representative Nord Blue Glass Framed samples responded to the swatch changes and both areas matched exactly in both clients.

The revised **Solid** CSS clears the channel sidebar's native background fallback. The retest reproduced the expected opaque sidebar, header and chat fills.

## OpenAsar loader check

An isolated smoke test paired OpenAsar `nightly-5a44615` with Vencord `e75ac9a`. Vencord returned all 12 stylesheets byte for byte with simulated Electron and Discord desktop core. Live rendering and native materials with OpenAsar remain untested.

## Offline Studio

**18 Node tests and 17 Chromium checks passed**, including exact CSS and JSON downloads after importing every variant at 1280 px and 320 px, reload persistence, the two reusable Glass templates, keyboard and custom color controls, and synthetic renderer paint. The three appearance modes were tested against synthetic Discord appearance changes, nested Light settings, custom profile themes and forced colors. Flat and Framed Glass cleared the three renderer backdrop layers in each enabled appearance.

The current [manifest](themes/manifest.json) has SHA-256 `74c95db0ede17d1483aa3d850a4a9710b8a48194102558d1696d6777fa19a7d0`. All 12 JSON files match the tag byte for byte. Each CSS maps `--card-background-default` to the existing raised surface. The Framed stylesheets round both upper corners of the main panel. The Flat stylesheets round the rail-facing Home sidebar corner and the outer upper corner of Home and guild chat panes. The title bar and rail color fills the space outside the curves.

The browser fixtures verify Vencord plugin cards in each active appearance. Pixel checks exercise Framed Friends, DM and guild chat, and representative adjacent page and forum structures. Flat fixtures exercise Quests, Friends and guild chat in Solid and Glass. They sample the rail color outside the curves and the pane colors inside. They also verify that the DM search divider and top Home rule are gone in Flat while the DM group separator and both guild header dividers remain visible. At 2× scale, the Framed Friends stripe crosses both panes on the same pixel rows. The Flat Friends fill edges align and remain free of a divider. The fixtures check that a popout remains interactive beyond the pane perimeter. See [Rebuild and verify](README.md#rebuild-and-verify) to rerun the checks.

The popup keyboard test uses Chromium’s headless shell. On macOS, the full Chrome for Testing 151 executable in headless mode reported a closed popup after pressing Space, including on a plain HTML select. The same control and the Studio test both reported an open popup in the headless shell.

## Native follow-up for the current Studio and renderer

All 24 export, appearance and client combinations passed on macOS. The checks used the downloaded Studio CSS in Discord Stable with Vencord and in Vesktop. Each appearance was selected in the client, and the resulting accent and Plugins card fill were sampled from the window.

| Studio export | Light | Ash | Dark | Onyx |
| --- | --- | --- | --- | --- |
| Existing configuration, Dark appearances only | Stock Discord Light | Violet | Violet | Violet |
| All appearances, fixed accent | Violet | Violet | Violet | Violet |
| Accent by appearance | Nord Blue | Pink | Violet | Custom green `#50FA7B` |

In both clients, the public switcher painted the Plugin Management and plugin cards with the palette’s raised surface in Light and Dark. The computed palette color is `#23233D`. In official Discord, a captured interior patch measured `#23233B` in both appearances.

Flat Solid and Glass were checked on Friends, Quests and a guild text channel in both clients. Both outer Home corners were rounded. Quests cleared the line below DM search and the one above the main pane. In guild chat the upper-right corner was rounded, and both horizontal header dividers continued across the sidebar-to-chat join. Framed Glass was checked on Friends and guild chat in both clients, and Framed Solid on the same routes in Vesktop.

On Friends, the previous Framed divider occupied rows 164–165 beneath DM search and 162–163 beneath the toolbar in both macOS clients at 2× scale. With the corrected Framed Glass and Solid exports, both sides occupied rows 164–165. Flat Glass and Solid showed no divider. A temporary outline measured the two Flat header boxes independently of their fill, and each client was checked again with the outline removed.

A separate Vesktop check isolated a local QuickCSS rule that forced a background on the sidebar shell and its `::after` element. With that rule applied, the outside of the left Flat Glass arc measured `#1B1A2E`. With QuickCSS disabled, both outside corners and the title bar measured `#2D2C3D` on the same backdrop. The full native material matrices above apply to the tagged release.

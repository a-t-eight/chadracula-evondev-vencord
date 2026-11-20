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

**18 Node tests and 18 Chromium checks passed**, including exact CSS and JSON downloads after importing every variant at 1280 px and 320 px, reload persistence, the two reusable Glass templates, keyboard and custom color controls, and synthetic renderer paint. The three appearance modes were tested against synthetic Discord appearance changes, nested Light settings, custom profile themes and forced colors. Flat and Framed Glass cleared the three renderer backdrop layers in each enabled appearance.

The current [manifest](themes/manifest.json) has SHA-256 `074a9ce6e76ba96c80352a996e877c4c529447cc76439f1707afe2b7711ba438`. All 12 JSON files match the tag byte for byte. Each CSS maps `--card-background-default` to the existing raised surface. The Framed stylesheets round both upper corners of the main panel. The Flat stylesheets round the rail-facing Home sidebar corner and the outer upper corner of Home and guild chat panes. The title bar and rail color fills the space outside the curves.

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

## Friends seam and Light button contrast

With the Framed Glass switcher in macOS Discord, the vertical seam beside the DM list measured four device pixels through the Friends toolbar and two through the body at 2× scale. After the fix, it measured four pixels at both heights and down the list. Chromium pixel checks covered Framed and Flat in both window finishes, including the collapsed sidebar and adjacent Home routes.

The following contrast ratios are estimates from native Discord Light window captures with the Nord Blue switcher active. The samples use pixels inside the same label and button before and after the fix.

| Control | v1.0.2 | Corrected |
| --- | ---: | ---: |
| Find or start a conversation | 1.05:1 | 14.35:1 |
| No, thanks | 1.15:1 | 11.65:1 |
| Vencord Quick Actions · Notification Log | 1.15:1 | 11.66:1 |
| Account · Edit | 1.06:1 | 14.43:1 |
| Add Friend (primary) | 8.84:1 | 8.84:1 |

Vesktop in Light reproduced the seam change from two to four device pixels below the toolbar. Sampled contrast rose from 1.01:1 to 11.00:1 on the DM search label, from 1.05:1 to 14.38:1 on Account Edit, and from 1.15:1 to 11.55:1 on the Notification Log quick action. With a separate all-appearances Flat Glass export in Light, all nine sampled columns across the join had the same median RGB (41, 41, 53).

Chromium checked the standalone switcher and all three Studio export modes, including hover and pressed text and icons, disabled controls, and nested Light settings. It also checked custom profile themes and forced-color providers.

## Mobile theme verification

The [mobile manifest](mobile/manifest.json) records one generated spec 2 file per desktop accent. The generation and unit checks verify the same semantic values in both appearance slots, contrast for all primary button states, selected channel text, translucent secondary controls, and the unread banner. Each variant leaves the native keyboard paint and legacy fallback unset.

| Accent | Primary label on default / hover / active fill | White unread banner text |
| --- | --- | ---: |
| Nord Blue | 8.89:1 / 8.09:1 / 7.50:1 | 13.66:1 |
| Pink | 7.12:1 / 6.53:1 / 6.07:1 | 14.21:1 |
| Violet | 6.24:1 / 5.73:1 / 5.38:1 | 14.38:1 |

These ratios are calculated from the exported colors. Physical checks covered Violet with Kettu. Nord Blue, Pink, and native Rain rendering remain untested on devices.

The three release JSON files passed 36 isolated parser checks using the pinned Kettu and Rain spec 2 implementations. The checks exercised Auto, Dark, and Light for the iOS and Android paths, including preservation of eight-digit colors and empty raw overrides. The harness used native boundary stubs. [Kettu parser](https://github.com/C0C0B01/Kettu/blob/e345bb14d357093ec3ba37b660030fd466a654c3/src/lib/addons/themes/colors/parser.ts#L61-L103) · [Rain parser](https://github.com/ra1ncord/rain/blob/4b091e1698aa983c5f4e694ae243c9a6fd8b52fb/src/plugins/_core/painter/themes/parser.ts#L63-L102)

### Violet on iPhone

The [Violet mobile JSON](mobile/violet.json) was checked on a physical iPhone running iOS 27.0.1, Discord+ 345.0 PTB (112811), and Kettu 1.4.3. The channel header, composer, Settings heading, and Settings row icons were checked in Auto, Dark, and Light.

Direct iPhone PNGs showed `#141423` on the chat header, message canvas, and outer edge beneath the composer in all three modes. The header shares its backing with the iOS status bar. The dark header retains contrast for the app controls while leaving the native black status ink at 1.15:1 on the shared backing.

| Foreground on the chat header | Contrast |
| --- | ---: |
| Warm-white title (`#F8F8F2`) | 17.07:1 |
| Online-count text (`#E9E9F4`) | 15.10:1 |
| Back arrow and chevron tint (`#92A2D4`) | 7.23:1 |

In Auto, Dark, and Light, the guild channel pane and server-name header used `#141423`, matching the desktop palette. The guild rail used `#19192C` and the selected row used `#2C294A`. Sampled selected and ordinary channel names used `#F8F8F2`, while muted labels used `#92A2D4`.

Native captures in all three modes showed `#9A86FD` ink for the Messages search, request count, and Add Friends buttons, and for Channel Info search, notification, and settings icons. The Messages buttons rendered `#202038` over their dark pane. In the Messages view, the floating profile card rendered `#1F1F37` in Auto and Dark and predominantly `#202037` in Light. Samples through the lower fade remained dark Violet (`#121220` in Auto and Dark and `#131321` in Light). The app composites the translucent card and controls over its existing surfaces.

In a live channel with unread messages, the Smoked Violet banner rendered `#292646` with a visible light label and dismiss icon. Pure white on that configured fill computes to 14.38:1. Discord shares the fill with other brand surfaces, including the message-request dot. The chat APP tag sampled in this test still rendered stock blue (`#5865F2`).

An earlier export hid keyboard key faces and letters in chat and Settings search. Omitting `KEYBOARD` and its native fallback `BACKGROUND_PRIMARY` restored the translucent Apple keyboard in Kettu Themes search in Auto, Dark, and Light. A cold start in Auto confirmed text entry, backspace, and switching between letter and number layouts in Settings search, and visible key faces and letters in the chat composer. Chat and input fills use separate tokens.

With Violet selected in Auto and Light, native captures showed a `#000000` status strip above Settings and Options. The sheets used `#23233D`. The charging battery remained visible, while the clock, signal and Wi-Fi did not. With Violet deselected in Auto, the same Settings view showed a white clock, signal and Wi-Fi on the same `#000000` backing. A theme JSON control for the sheet status-bar style remains unverified.

### NexxUtils compatibility

NexxUtils 1.0.1 **Colorful Channels** requests `REDESIGN_BUTTON_DESTRUCTIVE_BACKGROUND` and `REDESIGN_BUTTON_DESTRUCTIVE_TEXT` for the trailing NSFW tag. Discord build 112811 omits both roles. In Kettu, disabling only **NSFW tag** and switching away from and back to the guild removed the unreadable labels while keeping the warning icons visible. A locally tested plugin change using the registered primary control fill and text roles produced legible violet badges on the same rows. The release ships theme JSON files. [NexxUtils badge source](https://github.com/nexpid/RevengePlugins/blob/1c9194a378c9fbbefcc178c0325abdee71ca0650/src/stuff/components/TextBadge.tsx#L20-L45)

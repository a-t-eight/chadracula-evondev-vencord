# Violet Glass templates

Use the Flat and Framed templates from `v1.1.1` as the baseline for new color revisions. Studio applies the BetterFolders rail tint and the composer and channel-topic fade fixes to both Glass and Solid exports.

Open [Chadracula Studio](../studio/index.html), choose **Import config**, then open [Flat Glass](flat-glass/config.json) or [Framed Glass](framed-glass/config.json). Both templates use the Violet accent, warm primary text, 80% pane opacity, rainbow thread colors, pink links, tinted selection, and the Base46 `cyan` muted-text override.

Framed Glass rounds both upper corners of the main panel and uses one rail tint outside each corner. The title bar and server rail use the same tint. Flat Glass rounds the outer upper edges in Home and the outer upper chat corner in servers. Home has a continuous fill below the DM search row and above the main pane. Both guild header dividers remain visible.

To recolor a template, choose one **Accent preset** or set **Export appearance** to **Accent by appearance** and choose four accents. The templates start in **Dark appearances only** mode. Choose **Save config** to keep an editable copy, then **Download CSS** to install the result. Import the JSON into Studio and copy the generated CSS into the desktop client’s themes folder.

The twelve [release variants](../README.md#choose-a-theme) use these pane settings with their selected accent and finish, and inherit the default `teal` muted role. In the Studio’s **Surfaces and foregrounds** section, select **Default** for **Muted text** to reproduce that role in a template.

(() => {
  "use strict";

  const { base30, base16 } = globalThis.ChadraculaTheme.palette;

  // The inspirations inform hierarchy and treatment. Color values come from Chadracula.
  globalThis.ChadraculaPresets = [
    {
      id: "dark-purple", label: "Dark Purple",
      config: {}
    },
    {
      id: "dracula", label: "Dracula",
      config: {
        accent: "purple", text: "warm", layout: "flat",
        surfaces: { rail: base30.black, sidebar: base30.black2, canvas: base30.one_bg, raised: base30.one_bg2, input: base30.black2 }
      }
    },
    {
      id: "midnight", label: "Midnight",
      config: {
        accent: "teal", text: "cool", layout: "flat", selection: "neutral",
        threads: "neutral", link: "accent", mention: "violet",
        surfaces: { rail: base30.black, sidebar: base30.black, canvas: base30.darker_black, raised: base30.black2, input: base30.black2 }
      }
    },
    {
      id: "tokyo-night", label: "Tokyo Night",
      config: {
        accent: "violet", text: "cool", selection: "tinted", link: "cyan", mention: "violet",
        surfaces: { rail: base30.black, sidebar: base30.darker_black, canvas: base30.black2, raised: base30.one_bg, input: base30.one_bg2 }
      }
    },
    {
      id: "material", label: "Material",
      config: {
        accent: "pink", layout: "framed", selection: "accent", threads: "accent", link: "accent",
        surfaces: { rail: base30.darker_black, sidebar: base30.one_bg, canvas: base30.black2, raised: base30.one_bg2, input: base30.one_bg2 }
      }
    },
    {
      id: "mica", label: "Mica",
      config: {
        accent: "teal", text: "cool", layout: "framed", window: "glass", opacity: 82,
        threads: "neutral", selection: "neutral", mention: "cyan",
        surfaces: { rail: base30.black, sidebar: base30.darker_black, canvas: base30.black, raised: base30.one_bg, input: base30.black2 }
      }
    },
    {
      id: "cyan", label: "Cyan",
      config: {
        accent: "cyan", text: "cool", layout: "flat", link: "cyan", selection: "tinted", threads: "accent", mention: "cyan",
        foregrounds: { muted: base16.base0F },
        surfaces: { rail: base30.black, sidebar: base30.darker_black, canvas: base30.black, raised: base30.black2, input: base30.one_bg }
      }
    }
  ];
})();

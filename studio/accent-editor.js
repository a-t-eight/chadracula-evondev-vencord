function attachAccentEditor(root, onColor, { labelClass = "", inputClass = "" } = {}) {
  const format = root.querySelector("[data-accent-format]");
  const fields = root.querySelector("[data-accent-fields]");
  const swatch = root.querySelector("[data-accent-swatch]");
  const hexPattern = /^#?[0-9a-f]{6}$/i;
  const specs = {
    hex: [["Hex", "Hex value"]],
    rgb: [["R", "Red", 255], ["G", "Green", 255], ["B", "Blue", 255]],
    hsv: [["H°", "Hue (degrees)", 360], ["S%", "Saturation (%)", 100], ["V%", "Value (%)", 100]],
  };
  let hex;
  let hsv;

  function fromRGB(rgb) {
    return "#" + rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  function toRGB() {
    return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  }

  function toHSV(rgb) {
    const [red, green, blue] = rgb;
    const value = Math.max(...rgb);
    const delta = value - Math.min(...rgb);
    let hue = 0;
    if (delta) {
      if (value === red) hue = (green - blue) / delta;
      else if (value === green) hue = 2 + (blue - red) / delta;
      else hue = 4 + (red - green) / delta;
    }
    return [(hue * 60 + 360) % 360, value ? 100 * delta / value : 0, 100 * value / 255];
  }

  function fromHSV([hue, saturation, value]) {
    const sector = (hue % 360) / 60;
    const chroma = value * saturation / 10000;
    const intermediate = chroma * (1 - Math.abs(sector % 2 - 1));
    const offset = value / 100 - chroma;
    const rgb = [
      [chroma, intermediate, 0], [intermediate, chroma, 0], [0, chroma, intermediate],
      [0, intermediate, chroma], [intermediate, 0, chroma], [chroma, 0, intermediate],
    ][Math.floor(sector)];
    return fromRGB(rgb.map((channel) => (channel + offset) * 255));
  }

  function render() {
    if (!hex) return;
    const mode = format.value;
    let values = [hex];
    if (mode === "rgb") values = toRGB();
    if (mode === "hsv") {
      hsv ??= toHSV(toRGB());
      values = hsv.map((value) => Number(value.toFixed(2)));
    }
    const document = root.ownerDocument;
    fields.replaceChildren(...specs[mode].map(([label, name, max], index) => {
      const control = document.createElement("label");
      control.className = labelClass;
      const caption = document.createElement("span");
      caption.textContent = label;
      const input = document.createElement("input");
      input.className = inputClass;
      input.value = values[index];
      input.setAttribute("aria-label", name);
      if (max === undefined) {
        input.spellcheck = false;
        input.autocomplete = "off";
        input.setAttribute("autocapitalize", "off");
      } else {
        input.type = "number";
        input.min = 0;
        input.max = max;
        input.step = mode === "rgb" ? "1" : "any";
        input.inputMode = mode === "rgb" ? "numeric" : "decimal";
      }
      control.append(caption, input);
      return control;
    }));
  }

  fields.addEventListener("input", () => {
    const mode = format.value;
    const values = Array.from(fields.querySelectorAll("input"), (input) => {
      const value = input.value.trim();
      const valid = mode === "hex" ? hexPattern.test(value) : value !== "" && input.validity.valid;
      if (valid) input.removeAttribute("aria-invalid");
      else input.setAttribute("aria-invalid", "true");
      if (valid) return mode === "hex" ? value : input.valueAsNumber;
    });
    if (values.some((value) => value === undefined)) return;
    // Keep HSV edits even when their 8-bit RGB representation has no visible hue.
    hsv = mode === "hsv" ? values : undefined;
    if (mode === "hex") hex = "#" + values[0].replace(/^#/, "").toUpperCase();
    else hex = mode === "rgb" ? fromRGB(values) : fromHSV(hsv);
    swatch?.style.setProperty("--accent-swatch", hex);
    onColor(hex);
  });
  format.addEventListener("change", render);

  return {
    setColor(color, displayColor = color) {
      swatch?.style.setProperty("--accent-swatch", displayColor);
      if (hex === color) return;
      hex = color;
      hsv = undefined;
      render();
    },
    setFormat(mode) {
      if (Object.hasOwn(specs, mode)) {
        format.value = mode;
        render();
      }
    },
    reset() {
      hsv = undefined;
      render();
    },
  };
}

function attachColorPicker(root, role, onChoice, opts) {
  const preset = root.querySelector("[data-color-preset]");
  const custom = root.querySelector("details[data-color-custom]");
  const editor = attachAccentEditor(root, onChoice, opts);
  const supportsOpenState = CSS.supports("selector(:open)");
  const interceptedKeys = new Set();
  let color;

  function setRole({ recommended, palette }) {
    const document = root.ownerDocument;
    const groups = recommended.length ? [{ label: "Recommended", options: recommended }, ...palette] : palette;
    const choices = groups.map(({ label, options }) => {
      const group = document.createElement("optgroup");
      group.label = label;
      group.append(...options.map(({ label, value, color }) => new Option(color ? `${label} · ${color}` : label, value)));
      return group;
    });
    preset.replaceChildren(...choices, new Option("Custom color", "custom"));
    editor.reset();
  }

  preset.addEventListener("change", () => {
    if (preset.value === "custom" && custom) custom.open = true;
    onChoice(preset.value === "custom" ? color : preset.value);
    editor.reset();
  });

  preset.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return;
    if (supportsOpenState && preset.matches(":open")) return;

    // macOS uses plain arrows to open a collapsed select. Consume both halves
    // of that key press while leaving deliberate opens and native browsing alone.
    event.preventDefault();
    interceptedKeys.add(event.key);
    const step = event.key === "ArrowDown" ? 1 : -1;
    for (let index = preset.selectedIndex + step; index >= 0 && index < preset.length; index += step) {
      const option = preset.options[index];
      if (option.matches(":disabled")) continue;
      preset.selectedIndex = index;
      preset.dispatchEvent(new Event("input", { bubbles: true }));
      preset.dispatchEvent(new Event("change", { bubbles: true }));
      break;
    }
  }, { capture: true });
  preset.addEventListener("keyup", (event) => {
    if (interceptedKeys.delete(event.key)) event.preventDefault();
  }, { capture: true });
  preset.addEventListener("blur", () => interceptedKeys.clear());

  setRole(role);
  return {
    ...editor,
    setRole,
    sync(choice, inputColor, displayColor = inputColor) {
      color = inputColor;
      const isCustom = /^#[0-9a-f]{6}$/i.test(choice);
      preset.value = isCustom ? "custom" : choice;
      if (custom) {
        custom.hidden = !isCustom;
        if (!isCustom) custom.open = false;
      }
      editor.setColor(inputColor, displayColor);
    },
  };
}

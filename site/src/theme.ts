type Theme = "light" | "dark";

const key = "braille-qr.theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");
const themeColours: Record<Theme, string> = {
  light: "#087f9c",
  dark: "#071418",
};

function saved(): Theme | null {
  try {
    const val = localStorage.getItem(key);
    return val === "light" || val === "dark" ? val : null;
  } catch {
    return null;
  }
}

function active(): Theme {
  return saved() ?? (media.matches ? "dark" : "light");
}

function controls(theme: Theme): void {
  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((btn) => {
    const dark = theme === "dark";
    btn.dataset.themeState = theme;
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", `Use ${dark ? "light" : "dark"} theme`);
    const label = btn.querySelector<HTMLElement>("[data-theme-label]");
    if (label) {
      label.textContent = dark ? "🌙" : "☀️";
      label.title = dark ? "Dark theme" : "Light theme";
    }
  });
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = themeColours[theme];
  controls(theme);
  window.dispatchEvent(new CustomEvent<Theme>("braille-qr:theme", { detail: theme }));
}

function toggle(): void {
  const next: Theme = active() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(key, next);
  } catch {
    console.warn("Theme preference could not be saved");
  }
  apply(next);
}

apply(active());

document.addEventListener("DOMContentLoaded", () => {
  controls(active());
  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", toggle);
  });
});

media.addEventListener("change", () => {
  if (!saved()) apply(active());
});

export {};

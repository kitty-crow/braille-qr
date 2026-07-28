try {
  const theme = localStorage.getItem("braille-qr.theme");
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  }
} catch {
  // Storage may be unavailable in restricted browsing contexts.
}

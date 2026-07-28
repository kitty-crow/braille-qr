const path = window.location.pathname;
let next: string | null = null;

if (path.endsWith("/index.html")) {
  next = path.slice(0, -"index.html".length);
} else if (path.endsWith("/readme.html")) {
  next = path.slice(0, -".html".length);
} else if (path.endsWith("/readme/")) {
  next = path.slice(0, -1);
} else if (path.endsWith("/generate.html")) {
  next = path.slice(0, -".html".length);
} else if (path.endsWith("/generate/")) {
  next = path.slice(0, -1);
}

if (next) {
  window.history.replaceState(
    window.history.state,
    "",
    `${next}${window.location.search}${window.location.hash}`,
  );
}

export {};

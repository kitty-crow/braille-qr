import { definePages } from "./vendor/pages/src/index.ts";

export default definePages({
  source: "site/.pages-src",
  out: "site/dist",
  assets: "assets/pages",
  copy: [
    { from: "version.json", to: "version.json" }
  ],
  pages: [
    { from: "index.html", route: "/" },
    {
      from: "readme.html",
      route: "/readme/",
      legacy: ["readme.html"]
    },
    {
      from: "generate.html",
      route: "/generate/",
      legacy: ["generate.html"],
      inject: false
    },
    {
      from: "404.html",
      route: "/404.html",
      inject: false
    }
  ],
  css: {
    files: ["kofi.css"]
  },
  runtime: {
    base: "/braille-qr/",
    theme: {
      key: "braille-qr.theme",
      colours: {
        light: "#087f9c",
        dark: "#071418"
      },
      toggle: "[data-theme-toggle]",
      label: "[data-theme-label]",
      event: "braille-qr:theme"
    },
    kofi: {
      user: "kittycrow",
      header: ".header",
      footer: ".footer > span:last-child",
      footerText: "Buy me a coffee",
      separator: " · ",
      desktopText: "Buy me a coffee?",
      background: "#5bc0de",
      text: "#323842",
      wideAt: 721
    },
    version: {
      file: "version.json",
      selector: "[data-version]",
      prefix: "v",
      fallback: "v?"
    },
    readme: {
      owner: "kitty-crow",
      repo: "braille-qr",
      branch: "main",
      path: "README.md",
      content: "#readme-content",
      status: "#readme-status"
    }
  }
});

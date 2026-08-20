import { render2Frag } from "@kittycrypto/website/static-ui";

export function embedTabsFrag(): DocumentFragment {
  return render2Frag(
    <div
      className="embed-format-tabs"
      role="tablist"
      aria-label="Embed format"
      style={{ display: "flex", gap: ".4rem", margin: ".55rem 0 .45rem" }}
    >
      <button
        type="button"
        className="button button--primary"
        data-embed-mode="compact"
        role="tab"
        aria-selected="true"
        style={{ minHeight: "2rem", padding: ".4rem .7rem", fontSize: ".75rem", lineHeight: 1 }}
      >
        Compact
      </button>
      <button
        type="button"
        className="button button--secondary"
        data-embed-mode="static"
        role="tab"
        aria-selected="false"
        title="Self-contained literal Unicode QR with inline CSS only; no JavaScript or external fetching."
        style={{ minHeight: "2rem", padding: ".4rem .7rem", fontSize: ".75rem", lineHeight: 1 }}
      >
        No JavaScript
      </button>
    </div>,
  );
}

export function plainCodeFrag(source: string): DocumentFragment {
  return render2Frag(
    <pre><code className="language-html">{source}</code></pre>,
  );
}

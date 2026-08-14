import type { DemoConfig, Section, MediaRef, SectionWidth, SectionPad, NavConfig, FooterConfig, NavLink, NavSize, FooterSize, ElementKey, CanvasElement } from "./types";
import { getTemplate } from "./templates";
import { getFontPair } from "./fonts";
import { defaultNav, defaultFooter, defaultNavLinks, ELEMENT_LABELS, SECTION_ANCHORS } from "./types";
import { safeUrl, safeColor, safeCss, sanitizeRich } from "./validate";
import { buildVerbatimDocument, stripDangerousHtml } from "./verbatim";

function esc(s: string | undefined): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** esc() for URL contexts: strips unsafe schemes before HTML-escaping. */
function escUrl(u: string | undefined): string {
  return esc(safeUrl(u));
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt((hex || "#000000").replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(hex: string, target: string, pct: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(target);
  const r = Math.round(r1 + (r2 - r1) * pct);
  const g = Math.round(g1 + (g2 - g1) * pct);
  const b = Math.round(b1 + (b2 - b1) * pct);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Approximate hue of a hex color, used to tint the duotone image filter. */
function hueFor(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  if (delta === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  return Math.round(h * 60);
}

function isDark(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

function media(m: MediaRef | undefined, style: string, cls = "", attrs = ""): string {
  if (!m?.url) return "";
  if (m.kind === "video") {
    return `<video src="${escUrl(m.url)}" style="${style}" class="${cls}"${attrs} autoplay muted loop playsinline></video>`;
  }
  return `<img src="${escUrl(m.url)}" alt="${esc(m.alt)}" style="${style}" class="${cls}"${attrs} loading="lazy" />`;
}

const WIDTH_PX: Record<SectionWidth, string> = { narrow: "760px", normal: "1080px", wide: "1320px", full: "100%" };
const PAD_SCALE: Record<SectionPad, number> = { compact: 0.55, normal: 1, spacious: 1.5 };

export interface RenderOptions {
  /** "edit" adds selection handles, outlines and the editor bridge.
   *  "publish" (default) emits clean HTML with zero editor chrome. */
  mode?: "edit" | "publish";
  /** Page slug to render, for multi-page demos. Ignored (and unnecessary)
   *  for the overwhelming majority of demos, which have a single page. */
  page?: string;
}

export function renderDemo(cfg: DemoConfig, opts: RenderOptions = {}): string {
  // A page imported in "diseño original" mode carries its own document
  // instead of Sections, and none of the template/brand machinery below
  // applies to it — a re-render can only be as faithful as Section is
  // expressive, and the entire point of this mode is not being limited to
  // that. Checked before anything else touches `cfg`, so both callers
  // (the public route and the builder's preview iframe) get the exact same
  // markup without needing to know verbatim mode exists.
  const verbatimPage = cfg.verbatim?.[opts.page ?? ""];
  if (verbatimPage) {
    return buildVerbatimDocument(stripDangerousHtml(verbatimPage.html), verbatimPage.css);
  }

  const editMode = opts.mode === "edit";
  const t = getTemplate(cfg.template);
  const f = getFontPair(cfg.fontPair);
  const d = t.dna;
  const b = cfg.brand;

  // Multi-page resolution: fall back to the home page, then to the flat
  // `sections` list — so a config from before this feature existed (no
  // `pages` at all) renders exactly as it always did.
  const pages = cfg.pages && cfg.pages.length ? cfg.pages : null;
  const activePage = pages ? (pages.find((p) => p.slug === (opts.page ?? "")) ?? pages[0]) : null;
  const pageSections = activePage ? activePage.sections : (cfg.sections ?? []);
  const pageHref = (pageId: string): string => {
    const target = pages?.find((p) => p.id === pageId);
    return target ? (target.slug ? `./${target.slug}` : "./") : "#";
  };

  const accent = safeColor(b.accent, "#6366f1");
  const ink = safeColor(b.ink, "#111827");
  const paper = safeColor(b.paper, "#ffffff");
  const dark = isDark(paper);
  const muted = mix(ink, paper, 0.42);
  const hairline = mix(ink, paper, 0.86);
  const soft = mix(accent, paper, 0.9);
  const onAccent = isDark(accent) ? "#ffffff" : "#111111";

  // Background texture is the single biggest lever for making templates
  // read as visually distinct rather than the same layout recolored.
  const dotColor = mix(accent, paper, 0.75);
  const gridColor = mix(ink, paper, 0.92);
  const noiseColor = mix(ink, paper, 0.965);
  const bodyBackground: Record<typeof d.texture, string> = {
    none: `background:${paper};`,
    dots: `background-color:${paper};background-image:radial-gradient(${dotColor} 1.5px,transparent 1.5px);background-size:24px 24px;`,
    grid: `background-color:${paper};background-image:linear-gradient(${gridColor} 1px,transparent 1px),linear-gradient(90deg,${gridColor} 1px,transparent 1px);background-size:56px 56px;`,
    gradient: `background:radial-gradient(130% 100% at 15% -10%,${mix(accent, paper, 0.82)} 0%,${paper} 55%);`,
    noise: `background-color:${paper};background-image:repeating-linear-gradient(135deg,${noiseColor} 0px,${noiseColor} 1px,transparent 1px,transparent 3px);`,
  };
  const upper = f.headingCase === "upper";

  const btnRadius = b.buttonShape === "sharp" ? "0px" : b.buttonShape === "rounded" ? "10px" : "999px";
  const btnFill = b.buttonFill ?? "solid";

  // Per-section style resolution ─────────────────────────
  function widthOf(s: Section): string {
    return s.style?.width ? WIDTH_PX[s.style.width] : d.maxWidth;
  }
  const densityScale = b.density === "compact" ? 0.7 : b.density === "spacious" ? 1.35 : 1;
  function padOf(s: Section): string {
    const scale = PAD_SCALE[s.style?.pad ?? "normal"] * densityScale;
    return `calc(${d.sectionPadY} * ${scale})`;
  }
  const dividerLine = d.divider === "none" ? "none" : d.divider === "thick" ? `2px solid ${ink}` : `1px solid ${hairline}`;
  function bgOf(s: Section): string {
    if (s.style?.bg) return safeColor(s.style.bg, paper);
    // Let the body's background texture show through when the template has
    // one and the user hasn't pinned this section to an explicit color.
    return d.texture === "none" ? paper : "transparent";
  }
  function alignOf(s: Section): "left" | "center" {
    return s.style?.align ?? d.align;
  }

  const wrap = (inner: string, maxW: string, extra = "") =>
    `<div style="max-width:${maxW};margin:0 auto;padding:0 24px;${extra}">${inner}</div>`;

  // ── Per-element overrides ───────────────────────────────
  //
  // The text helpers below (eyebrow/h2/lede/btn/…) are shared by all 16
  // section renderers and get called from deep inside their template
  // literals. Rather than thread the section through ~50 call sites, each
  // renderer announces which section it is currently drawing and the helpers
  // read that to attach the right overrides and edit handle.
  //
  // Safe because rendering is synchronous and renderers never nest — but it
  // does mean every renderer MUST call beginSection(s) as its first
  // statement, and nav/footer must call beginSection(null).
  let cur: Section | null = null;
  const beginSection = (s: Section | null) => { cur = s; };

  /** Override declarations, appended after the base style so they win. */
  function elStyle(key: ElementKey): string {
    const e = cur?.elements?.[key];
    if (!e) return "";
    const out: string[] = [];
    if (e.fontFamily) out.push(`font-family:${e.fontFamily === "heading" ? f.heading : f.body};`);
    if (e.fontSize !== undefined) out.push(`font-size:${e.fontSize}px;`);
    if (e.fontWeight) out.push(`font-weight:${e.fontWeight};`);
    if (e.lineHeight !== undefined) out.push(`line-height:${e.lineHeight};`);
    if (e.letterSpacing !== undefined) out.push(`letter-spacing:${e.letterSpacing}em;`);
    if (e.color) out.push(`color:${safeColor(e.color)};`);
    if (e.align) out.push(`text-align:${e.align};`);
    if (e.textTransform) out.push(`text-transform:${e.textTransform};`);
    if (e.marginTop !== undefined) out.push(`margin-top:${e.marginTop}px;`);
    if (e.marginBottom !== undefined) out.push(`margin-bottom:${e.marginBottom}px;`);
    if (e.bg) out.push(`background:${safeColor(e.bg)};`);
    if (e.radius !== undefined) out.push(`border-radius:${e.radius}px;`);
    if (e.offsetX !== undefined || e.offsetY !== undefined) {
      out.push(`position:relative;transform:translate(${e.offsetX ?? 0}px,${e.offsetY ?? 0}px);`);
    }
    return out.join("");
  }

  /** Visibility classes; also carries the selection outline hook in edit mode. */
  function elClass(key: ElementKey, extra = ""): string {
    const e = cur?.elements?.[key];
    const cls = [extra];
    if (e?.hideDesktop) cls.push("hide-d");
    if (e?.hideTablet) cls.push("hide-t");
    if (e?.hideMobile) cls.push("hide-m");
    if (editMode) cls.push("el");
    const joined = cls.filter(Boolean).join(" ");
    return joined ? ` class="${joined}"` : "";
  }

  /**
   * Marks a node as inline-editable and names the exact config field it
   * writes back to. Separate from data-el on purpose: data-el is a style
   * bucket (items.title styles every item title at once) whereas data-text
   * must address one field, e.g. items.2.title.
   */
  function textAttr(field: string, rich = false): string {
    if (!editMode || !cur) return "";
    return ` data-text="${cur.id}:${field}"${rich ? ' data-rich="1"' : ""} contenteditable="true" spellcheck="false"`;
  }

  /** The handle the editor uses to map a click back to this element. */
  function elHandle(key: ElementKey): string {
    if (!editMode || !cur) return "";
    return ` data-el="${cur.id}:${key}" data-el-label="${esc(ELEMENT_LABELS[key])}"`;
  }

  const eyebrow = (text?: string, align: "left" | "center" = d.align) => {
    if (!text || d.eyebrow === "none") return "";
    if (d.eyebrow === "rule") {
      return `<p${elClass("eyebrow", "eyebrow")}${elHandle("eyebrow")} style="display:flex;align-items:center;gap:12px;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:${accent};font-weight:600;margin:0 0 18px;${align === "center" ? "justify-content:center;" : ""}${elStyle("eyebrow")}"><span style="width:32px;height:1px;background:${accent};display:inline-block;"></span>${esc(text)}</p>`;
    }
    return `<p${elClass("eyebrow", "eyebrow")}${elHandle("eyebrow")}${textAttr("eyebrow")} style="font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:${accent};font-weight:600;margin:0 0 14px;${elStyle("eyebrow")}">${esc(text)}</p>`;
  };

  // Heading decoration. "bar" sits above the heading as its own element;
  // the others attach to the heading box itself.
  const headingBar = d.headingAccent === "bar"
    ? `<span style="display:block;width:44px;height:4px;background:${accent};margin:0 0 16px;${d.align === "center" ? "margin-left:auto;margin-right:auto;" : ""}"></span>`
    : "";
  const headingDecor =
    d.headingAccent === "underline" ? `display:inline-block;border-bottom:3px solid ${accent};padding-bottom:10px;`
    : d.headingAccent === "highlight" ? `display:inline;background:${accent};color:${onAccent};padding:2px 12px;box-decoration-break:clone;-webkit-box-decoration-break:clone;`
    : "";

  const h2 = (text?: string) =>
    text
      ? `${headingBar}<h2${elClass("heading")}${elHandle("heading")} style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:${d.h2};line-height:1.08;letter-spacing:${f.headingTracking};color:${ink};margin:0 0 18px;${upper ? "text-transform:uppercase;" : ""}${headingDecor}${elStyle("heading")}"${textAttr("heading", true)}>${sanitizeRich(text)}</h2>`
      : "";

  const lede = (text?: string, align: "left" | "center" = d.align) =>
    text ? `<p${elClass("body")}${elHandle("body")} style="font-size:1.08rem;line-height:1.7;color:${muted};margin:0 0 8px;max-width:62ch;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}${elStyle("body")}"${textAttr("body", true)}>${sanitizeRich(text)}</p>` : "";

  const btn = (text?: string, url?: string, forceFill?: "solid" | "outline") => {
    if (!text) return "";
    const fill = forceFill ?? btnFill;
    const base = `display:inline-block;font-family:${f.body};font-weight:600;font-size:.98rem;padding:15px 34px;border-radius:${btnRadius};text-decoration:none;transition:transform .15s ease,opacity .15s ease;`;
    const style =
      fill === "solid"
        ? `${base}background:${accent};color:${onAccent};`
        : `${base}background:transparent;color:${ink};border:1.5px solid ${mix(ink, paper, 0.7)};`;
    return `<a href="${escUrl(url || "#contacto")}"${elClass("cta", "btn")}${elHandle("cta")} style="${style}${elStyle("cta")}"${textAttr("ctaText")}>${esc(text)}</a>`;
  };

  const cardShadow =
    d.shadow === "hard" ? `box-shadow:5px 5px 0 ${ink};`
    : d.shadow === "soft" ? "box-shadow:0 1px 3px rgba(0,0,0,.06),0 8px 24px -12px rgba(0,0,0,.12);"
    : "";

  const surfaceCard = (inner: string, pad = "32px") => {
    if (d.surface === "card")
      return `<div style="background:${dark ? mix(paper, "#ffffff", 0.06) : "#ffffff"};border-radius:${d.radius};padding:${pad};${cardShadow}">${inner}</div>`;
    if (d.surface === "bordered")
      return `<div style="border:2px solid ${ink};border-radius:${d.radius};padding:${pad};">${inner}</div>`;
    return `<div style="padding:${pad} 0;border-top:${dividerLine};">${inner}</div>`;
  };

  // sec() now resolves bg/width/padding from the section's own style overrides.
  function sec(s: Section, inner: string, id?: string): string {
    return `<section ${id ? `id="${id}"` : ""} style="padding:${padOf(s)} 0;background:${bgOf(s)};">${wrap(inner, widthOf(s))}</section>`;
  }

  // ── HERO ────────────────────────────────────────────────
  function hero(s: Section): string {
    beginSection(s);
    const title = s.heading || b.name || "Tu Negocio";
    const align = alignOf(s);
    const logo = b.logo?.url
      ? `<img src="${escUrl(b.logo.url)}" alt="${esc(b.name)}" style="height:56px;width:auto;object-fit:contain;margin-bottom:28px;display:block;${align === "center" || s.variant === "stack" ? "margin-left:auto;margin-right:auto;" : ""}" />`
      : "";
    const h1 = `<h1${elClass("heading")}${elHandle("heading")} style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:${d.h1};line-height:1.02;letter-spacing:${f.headingTracking};margin:0 0 22px;${upper ? "text-transform:uppercase;" : ""}${elStyle("heading")}"${textAttr("heading", true)}>${sanitizeRich(title)}</h1>`;

    if (s.variant === "cover") {
      const overlayInk = "#ffffff";
      const overlay = (s.style?.overlay ?? 55) / 100;
      return `<section id="inicio" style="position:relative;min-height:${d.sectionPadY === "clamp(80px, 12vw, 160px)" ? "88vh" : "78vh"};display:flex;align-items:center;background:${ink};overflow:hidden;">
        ${s.media?.url ? media(s.media, "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.52;" + elStyle("media"), "", elHandle("media")) : ""}
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,${overlay * 0.5}),rgba(0,0,0,${overlay}));"></div>
        ${wrap(`<div style="position:relative;color:${overlayInk};max-width:${align === "center" ? "760px" : "820px"};${align === "center" ? "margin:0 auto;text-align:center;" : ""}">
          ${logo}
          ${s.eyebrow ? `<p${elClass("eyebrow")}${elHandle("eyebrow")} style="font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;color:${accent};font-weight:600;margin:0 0 16px;${elStyle("eyebrow")}"${textAttr("eyebrow")}>${esc(s.eyebrow)}</p>` : ""}
          ${h1.replace("margin:0 0 22px;", `margin:0 0 22px;color:${overlayInk};`)}
          ${s.subheading ? `<p${elClass("subheading")}${elHandle("subheading")} style="font-size:clamp(1.05rem,2vw,1.3rem);line-height:1.6;opacity:.9;margin:0 0 34px;max-width:56ch;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}${elStyle("subheading")}"${textAttr("subheading", true)}>${sanitizeRich(s.subheading)}</p>` : ""}
          ${btn(s.ctaText, s.ctaUrl)}
        </div>`, widthOf(s))}
      </section>`;
    }

    if (s.variant === "stack") {
      return sec(s, `<div style="text-align:center;max-width:780px;margin:0 auto;">
        ${logo}
        ${eyebrow(s.eyebrow, "center")}
        ${h1.replace("margin:0 0 22px;", `margin:0 0 22px;color:${ink};`)}
        ${s.subheading ? `<p${elClass("subheading")}${elHandle("subheading")} style="font-size:clamp(1.05rem,2vw,1.28rem);line-height:1.65;color:${muted};margin:0 auto 36px;max-width:58ch;${elStyle("subheading")}"${textAttr("subheading", true)}>${sanitizeRich(s.subheading)}</p>` : ""}
        ${btn(s.ctaText, s.ctaUrl)}
      </div>`, "inicio");
    }

    if (s.variant === "offset") {
      return sec(s, `<div>
        ${logo}
        ${eyebrow(s.eyebrow, align)}
        ${h1.replace("margin:0 0 22px;", `margin:0 0 26px;color:${ink};max-width:16ch;`)}
        <div style="display:flex;flex-wrap:wrap;gap:32px;align-items:flex-end;justify-content:space-between;margin-bottom:44px;">
          ${s.subheading ? `<p${elClass("subheading")}${elHandle("subheading")} style="font-size:1.12rem;line-height:1.65;color:${muted};margin:0;max-width:46ch;flex:1 1 320px;${elStyle("subheading")}"${textAttr("subheading", true)}>${sanitizeRich(s.subheading)}</p>` : "<span></span>"}
          ${btn(s.ctaText, s.ctaUrl)}
        </div>
        ${s.media?.url ? media(s.media, `width:100%;height:clamp(260px,42vw,520px);object-fit:cover;border-radius:${d.imageRadius};display:block;${elStyle("media")}`, "", elHandle("media")) : ""}
      </div>`, "inicio");
    }

    // split (default)
    return sec(s, `<div class="split" style="display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(32px,5vw,72px);align-items:center;">
      <div>
        ${logo}
        ${eyebrow(s.eyebrow, align)}
        ${h1.replace("margin:0 0 22px;", `margin:0 0 22px;color:${ink};`)}
        ${s.subheading ? `<p${elClass("subheading")}${elHandle("subheading")} style="font-size:1.12rem;line-height:1.68;color:${muted};margin:0 0 34px;max-width:52ch;${elStyle("subheading")}"${textAttr("subheading", true)}>${sanitizeRich(s.subheading)}</p>` : ""}
        ${btn(s.ctaText, s.ctaUrl)}
      </div>
      ${s.media?.url ? `<div>${media(s.media, `width:100%;height:clamp(300px,40vw,520px);object-fit:cover;border-radius:${d.imageRadius};display:block;${elStyle("media")}`, "", elHandle("media"))}</div>` : `<div style="background:${soft};border-radius:${d.imageRadius};min-height:340px;"></div>`}
    </div>`, "inicio");
  }

  // ── FEATURES ────────────────────────────────────────────
  function features(s: Section): string {
    beginSection(s);
    const items = s.items ?? [];
    const align = alignOf(s);
    const head = `<div style="${align === "center" ? "text-align:center;max-width:660px;margin:0 auto 56px;" : "max-width:640px;margin:0 0 56px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>`;

    if (s.variant === "rows") {
      return sec(s, head + items.map((it, i) => `
        <div class="split" style="display:grid;grid-template-columns:${i % 2 ? ".95fr 1.05fr" : "1.05fr .95fr"};gap:clamp(28px,4vw,64px);align-items:center;padding:clamp(28px,4vw,52px) 0;${i ? `border-top:${dividerLine};` : ""}">
          <div style="${i % 2 ? "order:2;" : ""}">
            <h${elClass("items.title")}${elHandle("items.title")}3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:clamp(1.3rem,2.4vw,1.9rem);color:${ink};margin:0 0 12px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</h3>
            <p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};line-height:1.7;margin:0;font-size:1.02rem;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>
          </div>
          ${it.media?.url ? `<div style="${i % 2 ? "order:1;" : ""}">${media(it.media, `width:100%;height:clamp(200px,26vw,320px);object-fit:cover;border-radius:${d.imageRadius};display:block;`)}</div>` : `<div style="${i % 2 ? "order:1;" : ""}background:${soft};border-radius:${d.imageRadius};min-height:200px;"></div>`}
        </div>`).join(""), "servicios");
    }

    if (s.variant === "numbered") {
      return sec(s, head + `<div style="display:grid;gap:0;">` + items.map((it, i) => `
        <div style="display:grid;grid-template-columns:auto 1fr;gap:clamp(20px,3vw,44px);padding:clamp(24px,3.5vw,40px) 0;${i ? `border-top:${dividerLine};` : ""}">
          <span style="font-family:${f.heading};font-size:clamp(1.8rem,3.4vw,2.8rem);font-weight:${f.headingWeight};color:${accent};line-height:1;min-width:2.2ch;">${String(i + 1).padStart(2, "0")}</span>
          <div>
            <h${elClass("items.title")}${elHandle("items.title")}3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:clamp(1.2rem,2.2vw,1.6rem);color:${ink};margin:0 0 10px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</h3>
            <p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};line-height:1.7;margin:0;max-width:60ch;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>
          </div>
        </div>`).join("") + `</div>`, "servicios");
    }

    const cols = s.variant === "grid4" ? "minmax(220px,1fr)" : "minmax(260px,1fr)";
    return sec(s, head + `<div class="grid3" style="display:grid;grid-template-columns:repeat(auto-fit,${cols});gap:${d.surface === "card" ? "24px" : "0"};">` +
      items.map((it, i) => surfaceCard(`
        ${it.media?.url ? media(it.media, `width:100%;height:180px;object-fit:cover;border-radius:${d.imageRadius};display:block;margin-bottom:22px;`) : ""}
        <h${elClass("items.title")}${elHandle("items.title")}3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.22rem;color:${ink};margin:0 0 11px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</h3>
        <p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};line-height:1.7;margin:0;font-size:.98rem;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>`)).join("") + `</div>`, "servicios");
  }

  /**
   * What an enabled-but-empty section renders.
   *
   * Published output stays clean: an empty section is simply omitted, exactly
   * as before. In the builder it would otherwise vanish silently — you enable
   * "Galería", nothing appears on the canvas, and there is no way to tell the
   * section is on but has no content yet. So in edit mode it draws a dashed
   * placeholder naming what the section needs.
   */
  function emptyState(s: Section, label: string, hint: string): string {
    if (!editMode) return "";
    return sec(
      s,
      `<div style="border:2px dashed ${accent}55;border-radius:${d.imageRadius};padding:44px 24px;text-align:center;background:${accent}0a;">
        <p style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.05rem;color:${ink};margin:0 0 6px;">${esc(label)}</p>
        <p style="color:${muted};font-size:.88rem;margin:0;line-height:1.6;">${esc(hint)}</p>
      </div>`,
      SECTION_ANCHORS[s.type]?.[0]
    );
  }

  // ── GALLERY ─────────────────────────────────────────────
  function gallery(s: Section): string {
    beginSection(s);
    const items = (s.items ?? []).filter((i) => i.media?.url);
    if (!items.length) return emptyState(s, "Galería sin imágenes", "Agrega fotos desde el panel de la derecha para que esta sección aparezca en el sitio.");
    const align = alignOf(s);
    const head = `<div style="${align === "center" ? "text-align:center;max-width:620px;margin:0 auto 48px;" : "margin:0 0 48px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>`;

    if (s.variant === "carousel") {
      return `<section id="galeria" style="padding:${padOf(s)} 0;background:${bgOf(s)};">${wrap(head, widthOf(s))}<div style="display:flex;gap:16px;overflow-x:auto;padding:0 24px 12px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;">` +
        items.map((it, i) => `<div style="flex:0 0 clamp(240px,32vw,380px);scroll-snap-align:start;">${media(it.media, `width:100%;height:clamp(240px,30vw,360px);object-fit:cover;border-radius:${d.imageRadius};display:block;`)}${it.title ? `<p${elClass("items.title")}${elHandle("items.title")} style="margin:12px 0 0;font-weight:600;color:${ink};font-size:.95rem;${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</p>` : ""}</div>`).join("") + `</div></section>`;
    }

    if (s.variant === "grid2") {
      return sec(s, head + `<div class="grid2" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">` +
        items.map((it, i) => `<figure style="margin:0;">${media(it.media, `width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:${d.imageRadius};display:block;`)}${it.title ? `<figcaption${elClass("items.title")}${elHandle("items.title")} style="margin-top:12px;color:${muted};font-size:.92rem;${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</figcaption>` : ""}</figure>`).join("") + `</div>`, "galeria");
    }

    return sec(s, head + `<div class="masonry" style="columns:3;column-gap:16px;">` +
      items.map((it, i) => `<figure style="margin:0 0 16px;break-inside:avoid;">${media(it.media, `width:100%;border-radius:${d.imageRadius};display:block;`)}${it.title ? `<figcaption${elClass("items.title")}${elHandle("items.title")} style="margin-top:10px;color:${muted};font-size:.9rem;${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</figcaption>` : ""}</figure>`).join("") + `</div>`, "galeria");
  }

  // ── VIDEO ───────────────────────────────────────────────
  function video(s: Section): string {
    beginSection(s);
    if (!s.media?.url) return emptyState(s, "Video sin enlace", "Pega la URL de YouTube o Vimeo en el panel de la derecha.");
    const v = s.media.url;
    const isEmbed = /youtube|youtu\.be|vimeo/.test(v);
    const embedUrl = v.includes("youtu.be")
      ? `https://www.youtube.com/embed/${v.split("youtu.be/")[1]?.split(/[?&]/)[0]}`
      : v.includes("youtube.com/watch")
      ? `https://www.youtube.com/embed/${new URLSearchParams(v.split("?")[1]).get("v")}`
      : v.includes("vimeo.com")
      ? `https://player.vimeo.com/video/${v.split("vimeo.com/")[1]?.split(/[?&]/)[0]}`
      : v;
    const player = isEmbed
      ? `<iframe src="${escUrl(embedUrl)}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:${d.imageRadius};display:block;" allowfullscreen allow="autoplay; encrypted-media"></iframe>`
      : `<video src="${escUrl(v)}" controls playsinline style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:${d.imageRadius};display:block;background:#000;"></video>`;

    if (s.variant === "full") {
      return `<section id="video" style="padding:${padOf(s)} 0;background:${bgOf(s)};"><div style="max-width:1400px;margin:0 auto;padding:0 24px;">${player}</div></section>`;
    }
    const align = alignOf(s);
    return sec(s, `<div style="${align === "center" ? "text-align:center;max-width:640px;margin:0 auto 40px;" : "max-width:620px;margin:0 0 40px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>` + player, "video");
  }

  // ── ABOUT ───────────────────────────────────────────────
  function about(s: Section): string {
    beginSection(s);
    const align = alignOf(s);
    const aboutBg = s.style?.bg || (dark ? mix(paper, "#ffffff", 0.04) : soft);

    if (s.variant === "centered") {
      return `<section id="nosotros" style="padding:${padOf(s)} 0;background:${aboutBg};">${wrap(`<div style="text-align:center;max-width:720px;margin:0 auto;">
        ${eyebrow(s.eyebrow, "center")}${h2(s.heading)}
        <p${elClass("body")}${elHandle("body")} style="font-size:1.14rem;line-height:1.85;color:${muted};margin:0;${elStyle("body")}"${textAttr("body", true)}>${sanitizeRich(s.body)}</p>
      </div>`, widthOf(s))}</section>`;
    }

    if (s.variant === "stat") {
      const stats = (s.items ?? []).slice(0, 4);
      return `<section id="nosotros" style="padding:${padOf(s)} 0;background:${aboutBg};">${wrap(`<div style="${align === "center" ? "text-align:center;max-width:700px;margin:0 auto 52px;" : "max-width:640px;margin:0 0 52px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:clamp(20px,3vw,44px);">
        ${stats.map((st) => `<div style="${align === "center" ? "text-align:center;" : ""}">
          <p style="font-family:${f.heading};font-size:clamp(2.2rem,4.5vw,3.4rem);font-weight:${f.headingWeight};color:${accent};margin:0 0 8px;line-height:1;">${sanitizeRich(st.title)}</p>
          <p style="color:${muted};margin:0;font-size:.95rem;line-height:1.5;">${sanitizeRich(st.body)}</p>
        </div>`).join("")}
      </div>`, widthOf(s))}</section>`;
    }

    return sec(s, `<div class="split" style="display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,72px);align-items:center;">
      ${s.media?.url ? `<div>${media(s.media, `width:100%;height:clamp(280px,36vw,460px);object-fit:cover;border-radius:${d.imageRadius};display:block;${elStyle("media")}`, "", elHandle("media"))}</div>` : `<div style="background:${dark ? mix(paper, "#fff", 0.07) : mix(accent, paper, 0.82)};border-radius:${d.imageRadius};min-height:300px;"></div>`}
      <div>${eyebrow(s.eyebrow, align)}${h2(s.heading)}
        <p${elClass("body")}${elHandle("body")} style="font-size:1.08rem;line-height:1.8;color:${muted};margin:0;${elStyle("body")}"${textAttr("body", true)}>${sanitizeRich(s.body)}</p>
      </div>
    </div>`, "nosotros");
  }

  // ── TESTIMONIALS ────────────────────────────────────────
  function testimonials(s: Section): string {
    beginSection(s);
    const items = s.items ?? [];
    if (!items.length) return emptyState(s, "Testimonios sin contenido", "Agrega al menos una cita con el nombre de quien la dijo.");
    const testBg = s.style?.bg || (dark ? mix(paper, "#ffffff", 0.04) : soft);
    if (s.variant === "single") {
      const it = items[0];
      return `<section id="testimonios" style="padding:${padOf(s)} 0;background:${testBg};">${wrap(`<div style="text-align:center;max-width:800px;margin:0 auto;">
        <p style="font-family:${f.heading};font-size:clamp(1.4rem,3.2vw,2.3rem);line-height:1.4;color:${ink};margin:0 0 28px;font-weight:${f.headingWeight};letter-spacing:${f.headingTracking};">&ldquo;${sanitizeRich(it.body)}&rdquo;</p>
        <p style="color:${accent};font-weight:600;margin:0;font-size:.98rem;">${esc(it.author)}${it.role ? `<span style="color:${muted};font-weight:400;"> — ${esc(it.role)}</span>` : ""}</p>
      </div>`, widthOf(s))}</section>`;
    }
    const align = alignOf(s);
    return sec(s, `<div style="${align === "center" ? "text-align:center;max-width:620px;margin:0 auto 48px;" : "margin:0 0 48px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:${d.surface === "card" ? "24px" : "0"};">
      ${items.map((it) => surfaceCard(`
        <p style="color:${ink};line-height:1.75;margin:0 0 20px;font-size:1.02rem;">&ldquo;${sanitizeRich(it.body)}&rdquo;</p>
        <p style="color:${accent};font-weight:600;margin:0;font-size:.92rem;">${esc(it.author)}${it.role ? `<span style="color:${muted};font-weight:400;display:block;margin-top:2px;">${esc(it.role)}</span>` : ""}</p>`)).join("")}
    </div>`, "testimonios");
  }

  // ── STATS ───────────────────────────────────────────────
  function stats(s: Section): string {
    beginSection(s);
    const items = s.items ?? [];
    if (!items.length) return emptyState(s, "Cifras destacadas vacías", "Agrega los números que quieras resaltar, por ejemplo: +120 clientes.");
    const align = alignOf(s);
    const head = (s.eyebrow || s.heading) ? `<div style="${align === "center" ? "text-align:center;" : ""}margin:0 0 40px;">${eyebrow(s.eyebrow, align)}${h2(s.heading)}</div>` : "";
    if (s.variant === "cards") {
      return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;">` +
        items.map((it, i) => surfaceCard(`<p${elClass("items.title")}${elHandle("items.title")} style="font-family:${f.heading};font-size:clamp(2rem,4vw,2.8rem);font-weight:${f.headingWeight};color:${accent};margin:0 0 6px;line-height:1;${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</p><p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};margin:0;font-size:.92rem;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>`, "24px")).join("") + `</div>`, "cifras");
    }
    return sec(s, head + `<div style="display:flex;flex-wrap:wrap;justify-content:${align === "center" ? "center" : "flex-start"};gap:clamp(28px,6vw,64px);">` +
      items.map((it, i) => `<div style="${align === "center" ? "text-align:center;" : ""}min-width:120px;">
        <p${elClass("items.title")}${elHandle("items.title")} style="font-family:${f.heading};font-size:clamp(2.2rem,4.5vw,3.4rem);font-weight:${f.headingWeight};color:${accent};margin:0 0 6px;line-height:1;${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</p>
        <p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};margin:0;font-size:.92rem;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>
      </div>`).join("") + `</div>`, "cifras");
  }

  // ── TEAM ────────────────────────────────────────────────
  function team(s: Section): string {
    beginSection(s);
    const items = s.items ?? [];
    if (!items.length) return emptyState(s, "Equipo sin integrantes", "Agrega las personas del equipo con su nombre y cargo.");
    const align = alignOf(s);
    const head = `<div style="${align === "center" ? "text-align:center;max-width:620px;margin:0 auto 48px;" : "margin:0 0 48px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>`;
    if (s.variant === "rows") {
      return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:28px;">` +
        items.map((it, i) => `<div style="display:flex;gap:16px;align-items:center;">
          ${it.media?.url ? media(it.media, "width:64px;height:64px;object-fit:cover;border-radius:999px;flex-shrink:0;") : `<div style="width:64px;height:64px;border-radius:999px;background:${soft};flex-shrink:0;"></div>`}
          <div>
            <p${elClass("items.title")}${elHandle("items.title")} style="font-weight:700;color:${ink};margin:0 0 3px;font-family:${f.heading};letter-spacing:${f.headingTracking};${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</p>
            <p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};margin:0;font-size:.9rem;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>
          </div>
        </div>`).join("") + `</div>`, "equipo");
    }
    return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:24px;">` +
      items.map((it, i) => `<div style="text-align:center;">
        ${it.media?.url ? media(it.media, `width:100%;aspect-ratio:1;object-fit:cover;border-radius:${d.imageRadius};display:block;margin-bottom:14px;`) : `<div style="width:100%;aspect-ratio:1;border-radius:${d.imageRadius};background:${soft};margin-bottom:14px;"></div>`}
        <p${elClass("items.title")}${elHandle("items.title")} style="font-weight:700;color:${ink};margin:0 0 3px;font-family:${f.heading};letter-spacing:${f.headingTracking};${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</p>
        <p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};margin:0;font-size:.9rem;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>
      </div>`).join("") + `</div>`, "equipo");
  }

  // ── LOGOS ───────────────────────────────────────────────
  function logos(s: Section): string {
    beginSection(s);
    const items = (s.items ?? []).filter((i) => i.media?.url);
    if (!items.length) return emptyState(s, "Logos de clientes vacío", "Sube los logos de las marcas con las que trabajaste.");
    return sec(s, `${s.eyebrow ? `<p${elClass("eyebrow")}${elHandle("eyebrow")} style="text-align:center;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:${muted};font-weight:600;margin:0 0 32px;${elStyle("eyebrow")}"${textAttr("eyebrow")}>${esc(s.eyebrow)}</p>` : ""}
    <div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:clamp(24px,5vw,56px);">
      ${items.map((it) => media(it.media, "height:32px;width:auto;object-fit:contain;opacity:.75;filter:" + (dark ? "brightness(2) grayscale(1);" : "grayscale(1);")))
        .join("")}
    </div>`, "clientes");
  }

  // ── FAQ ─────────────────────────────────────────────────
  function faq(s: Section): string {
    beginSection(s);
    const items = s.items ?? [];
    if (!items.length) return emptyState(s, "Preguntas frecuentes vacías", "Agrega las preguntas que más te hacen y su respuesta.");
    const align = alignOf(s);
    const head = `<div style="${align === "center" ? "text-align:center;max-width:620px;margin:0 auto 44px;" : "max-width:620px;margin:0 0 44px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}</div>`;
    const row = (it: { title?: string; body?: string }, i: number) => `<details style="border-top:1px solid ${hairline};padding:18px 0;">
      <summary style="cursor:pointer;font-weight:600;color:${ink};font-size:1rem;list-style:none;display:flex;justify-content:space-between;gap:16px;">
        ${esc(it.title)}<span style="color:${accent};">+</span>
      </summary>
      <p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};line-height:1.7;margin:12px 0 0;font-size:.95rem;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>
    </details>`;
    if (s.variant === "twocol") {
      const half = Math.ceil(items.length / 2);
      return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:0 40px;">
        <div>${items.slice(0, half).map((it, i) => row(it, i)).join("")}</div>
        <div>${items.slice(half).map((it, i) => row(it, half + i)).join("")}</div>
      </div>`, "preguntas");
    }
    return sec(s, head + `<div style="max-width:720px;${align === "center" ? "margin:0 auto;" : ""}">${items.map((it, i) => row(it, i)).join("")}</div>`, "preguntas");
  }

  // ── BANNER ──────────────────────────────────────────────
  function banner(s: Section): string {
    beginSection(s);
    if (s.variant === "image" && s.media?.url) {
      const overlay = (s.style?.overlay ?? 55) / 100;
      return `<section style="position:relative;padding:${padOf(s)} 0;overflow:hidden;">
        ${media(s.media, "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")}
        <div style="position:absolute;inset:0;background:rgba(0,0,0,${overlay});"></div>
        ${wrap(`<div style="position:relative;text-align:center;color:#fff;">
          <h2 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:${d.h2};margin:0 0 12px;letter-spacing:${f.headingTracking};">${sanitizeRich(s.heading)}</h2>
          ${s.body ? `<p style="opacity:.9;margin:0 0 26px;font-size:1.05rem;">${sanitizeRich(s.body)}</p>` : ""}
          ${btn(s.ctaText, s.ctaUrl, "solid")}
        </div>`, widthOf(s))}
      </section>`;
    }
    return `<section style="padding:${padOf(s)} 0;background:${s.style?.bg || accent};">${wrap(`<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px;color:${onAccent};">
      <div>
        <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.3rem;margin:0 0 4px;letter-spacing:${f.headingTracking};">${sanitizeRich(s.heading)}</h3>
        ${s.body ? `<p style="margin:0;opacity:.9;font-size:.95rem;">${sanitizeRich(s.body)}</p>` : ""}
      </div>
      ${btn(s.ctaText, s.ctaUrl, isDark(s.style?.bg || accent) ? "outline" : "solid")}
    </div>`, widthOf(s))}</section>`;
  }

  // ── DIVIDER ─────────────────────────────────────────────
  function divider(s: Section): string {
    beginSection(s);
    if (s.variant === "space") return `<div style="height:${padOf(s)};background:${bgOf(s)};"></div>`;
    return `<div style="padding:${padOf(s)} 0;background:${bgOf(s)};">${wrap(`<hr style="border:none;border-top:1px solid ${hairline};margin:0;"/>`, widthOf(s))}</div>`;
  }

  // ── COLUMNS (free text) ─────────────────────────────────
  function columns(s: Section): string {
    beginSection(s);
    const items = s.items ?? [];
    const n = s.variant === "three" ? 3 : s.variant === "single" ? 1 : 2;
    const head = s.heading ? `<div style="margin:0 0 44px;${alignOf(s) === "center" ? "text-align:center;" : ""}">${h2(s.heading)}</div>` : "";
    return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(${n},1fr);gap:clamp(28px,4vw,56px);">` +
      items.slice(0, n).map((it, i) => `<div>
        ${it.title ? `<h${elClass("items.title")}${elHandle("items.title")}3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.2rem;color:${ink};margin:0 0 12px;letter-spacing:${f.headingTracking};${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</h3>` : ""}
        <p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};line-height:1.75;margin:0;font-size:1rem;white-space:pre-line;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>
      </div>`).join("") + `</div>`);
  }

  // ── MENU / PRICING ──────────────────────────────────────
  function menu(s: Section): string {
    beginSection(s);
    const items = s.items ?? [];
    if (!items.length) return emptyState(s, "Menú / Precios vacío", "Agrega los productos o planes con su precio.");
    const align = alignOf(s);
    const head = `<div style="${align === "center" ? "text-align:center;max-width:620px;margin:0 auto 52px;" : "margin:0 0 52px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>`;

    if (s.variant === "cards") {
      return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px;">` +
        items.map((it, i) => surfaceCard(`
          ${it.media?.url ? media(it.media, `width:100%;height:190px;object-fit:cover;border-radius:${d.imageRadius};display:block;margin-bottom:18px;`) : ""}
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:14px;margin-bottom:8px;">
            <h${elClass("items.title")}${elHandle("items.title")}3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.12rem;color:${ink};margin:0;${upper ? "text-transform:uppercase;" : ""}${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</h3>
            ${it.price ? `<span${elClass("items.price")}${elHandle("items.price")} style="color:${accent};font-weight:700;font-size:1.05rem;white-space:nowrap;${elStyle("items.price")}"${textAttr(`items.${i}.price`)}>${esc(it.price)}</span>` : ""}
          </div>
          <p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};line-height:1.65;margin:0;font-size:.94rem;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>`, "20px")).join("") + `</div>`, "menu");
    }

    if (s.variant === "tiers") {
      return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;align-items:stretch;">` +
        items.map((it, i) => `<div style="border:2px solid ${i === 1 ? accent : hairline};border-radius:${d.radius};padding:36px 28px;display:flex;flex-direction:column;${i === 1 ? `background:${soft};` : ""}">
          <h${elClass("items.title")}${elHandle("items.title")}3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.15rem;color:${ink};margin:0 0 10px;${upper ? "text-transform:uppercase;" : ""}${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</h3>
          ${it.price ? `<p${elClass("items.price")}${elHandle("items.price")} style="font-family:${f.heading};font-size:clamp(2rem,4vw,2.8rem);font-weight:${f.headingWeight};color:${accent};margin:0 0 18px;line-height:1;${elStyle("items.price")}"${textAttr(`items.${i}.price`)}>${esc(it.price)}</p>` : ""}
          <p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};line-height:1.7;margin:0 0 26px;font-size:.96rem;flex:1;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>
          ${btn(s.ctaText || "Elegir", s.ctaUrl)}
        </div>`).join("") + `</div>`, "menu");
    }

    return sec(s, head + `<div style="max-width:760px;${align === "center" ? "margin:0 auto;" : ""}">` +
      items.map((it, i) => `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px;padding:20px 0;${i ? `border-top:${dividerLine};` : ""}">
        <div style="text-align:left;">
          <h${elClass("items.title")}${elHandle("items.title")}3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.08rem;color:${ink};margin:0 0 5px;${upper ? "text-transform:uppercase;" : ""}${elStyle("items.title")}"${textAttr(`items.${i}.title`, true)}>${sanitizeRich(it.title)}</h3>
          ${it.body ? `<p${elClass("items.body")}${elHandle("items.body")} style="color:${muted};margin:0;font-size:.94rem;line-height:1.6;${elStyle("items.body")}"${textAttr(`items.${i}.body`, true)}>${sanitizeRich(it.body)}</p>` : ""}
        </div>
        ${it.price ? `<span${elClass("items.price")}${elHandle("items.price")} style="color:${accent};font-weight:700;font-size:1.08rem;white-space:nowrap;${elStyle("items.price")}"${textAttr(`items.${i}.price`)}>${esc(it.price)}</span>` : ""}
      </div>`).join("") + `</div>`, "menu");
  }

  // ── CTA ─────────────────────────────────────────────────
  function cta(s: Section): string {
    beginSection(s);
    if (s.variant === "boxed") {
      return sec(s, `<div style="border:2px solid ${accent};border-radius:${d.radius};padding:clamp(36px,6vw,72px);text-align:center;">
        ${h2(s.heading)}${s.body ? `<p style="font-size:1.08rem;color:${muted};line-height:1.7;margin:0 auto 32px;max-width:52ch;">${sanitizeRich(s.body)}</p>` : ""}
        ${btn(s.ctaText, s.ctaUrl)}
      </div>`);
    }
    const bg = s.style?.bg || accent;
    const onBg = isDark(bg) ? "#ffffff" : "#111111";
    return `<section style="padding:${padOf(s)} 0;background:${bg};">
      ${wrap(`<div style="text-align:center;color:${onBg};">
        <h2 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:${d.h2};line-height:1.1;margin:0 0 16px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${sanitizeRich(s.heading)}</h2>
        ${s.body ? `<p style="font-size:1.1rem;opacity:.88;line-height:1.7;margin:0 auto 34px;max-width:54ch;">${sanitizeRich(s.body)}</p>` : ""}
        <a href="${escUrl(s.ctaUrl || "#contacto")}"${elClass("cta", "btn")}${elHandle("cta")} style="display:inline-block;background:${onBg};color:${bg};font-weight:700;font-size:1rem;padding:16px 40px;border-radius:${btnRadius};text-decoration:none;${elStyle("cta")}"${textAttr("ctaText")}>${esc(s.ctaText)}</a>
      </div>`, widthOf(s))}
    </section>`;
  }

  // ── CONTACT ─────────────────────────────────────────────
  function contact(s: Section): string {
    beginSection(s);
    const align = alignOf(s);
    const rows: { icon: string; label: string; href?: string }[] = [];
    if (b.phone) rows.push({ icon: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 010 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z", label: b.phone, href: `tel:${b.phone.replace(/\s/g, "")}` });
    if (b.whatsapp) rows.push({ icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z", label: "WhatsApp", href: `https://wa.me/${b.whatsapp.replace(/\D/g, "")}` });
    if (b.email) rows.push({ icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6", label: b.email, href: `mailto:${b.email}` });
    if (b.instagram) rows.push({ icon: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z M17.5 6.5h.01 M2 7a5 5 0 015-5h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5z", label: b.instagram, href: `https://instagram.com/${b.instagram.replace("@", "")}` });
    if (b.address) rows.push({ icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z", label: b.address });

    const icon = (p: string) => `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">${p.split(" M").map((seg, i) => `<path d="${i ? "M" + seg : seg}"/>`).join("")}</svg>`;

    const list = rows.map((r) => {
      const inner = `${icon(r.icon)}<span>${esc(r.label)}</span>`;
      const st = `display:flex;align-items:center;gap:13px;padding:15px 0;color:${ink};text-decoration:none;font-size:1rem;border-bottom:1px solid ${hairline};`;
      return r.href ? `<a href="${escUrl(r.href)}" style="${st}">${inner}</a>` : `<div style="${st}">${inner}</div>`;
    }).join("");

    if (s.variant === "inline") {
      return sec(s, `<div style="text-align:center;">${eyebrow(s.eyebrow, "center")}${h2(s.heading)}${lede(s.body, "center")}
        <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:34px;">
          ${rows.map((r) => r.href ? `<a href="${escUrl(r.href)}" style="display:flex;align-items:center;gap:10px;background:${soft};border-radius:${btnRadius === "0px" ? "0" : "999px"};padding:14px 26px;color:${ink};text-decoration:none;font-weight:600;font-size:.96rem;">${icon(r.icon)}${esc(r.label)}</a>` : "").join("")}
        </div>
      </div>`, "contacto");
    }

    if (s.variant === "card") {
      return sec(s, `<div style="max-width:520px;margin:0 auto;text-align:center;">
        ${eyebrow(s.eyebrow, "center")}${h2(s.heading)}${lede(s.body, "center")}
        <div style="margin-top:32px;text-align:left;">${surfaceCard(list, "8px 28px")}</div>
      </div>`, "contacto");
    }

    return sec(s, `<div class="split" style="display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,72px);align-items:start;">
      <div>${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}${btn(s.ctaText, s.ctaUrl) ? `<div style="margin-top:28px;">${btn(s.ctaText, s.ctaUrl)}</div>` : ""}</div>
      <div>${list}</div>
    </div>`, "contacto");
  }

  const renderers: Record<string, (s: Section) => string> = {
    hero, features, gallery, video, about, testimonials, menu, faq, stats, team, logos, banner, divider, columns, cta, contact,
  };

  // data-demo-section-id lets the builder's canvas click-to-select feature
  // (postMessage from the iframe) map a click anywhere on the page back to
  // the exact section/nav/footer editor panel in the sidebar.
  // ── Canvas elements (free-form overlays) ──────────────────
  const canvasEls: CanvasElement[] = activePage?.canvasElements ?? [];

  function renderCanvasElement(el: CanvasElement): string {
    const s = el.style ?? {};
    const family = s.fontFamily === "heading" ? `var(--f-heading)` : `var(--f-body)`;
    const pe = editMode ? "pointer-events:auto;" : "";
    const base = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;z-index:${el.zIndex ?? 10};${pe}`;
    const typo = `font-family:${family};${s.fontSize ? `font-size:${s.fontSize}px;` : ""}${s.fontWeight ? `font-weight:${s.fontWeight};` : ""}${s.color ? `color:${safeColor(s.color)};` : ""}`;
    const box = `${s.bg ? `background:${safeColor(s.bg)};` : ""}${s.radius ? `border-radius:${s.radius}px;` : ""}`;
    const dataAttr = editMode ? ` data-canvas-el="${el.id}"` : "";
    const dragHandle = editMode ? `<div class="canvas-drag-handle" style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);width:36px;height:12px;background:#4f46e5;border-radius:6px;cursor:grab;opacity:0.85;box-shadow:0 2px 6px rgba(0,0,0,.3);"></div>` : "";

    switch (el.kind) {
      case "text":
        return `<div${dataAttr} style="${base}${typo}${box}overflow:auto;padding:4px;">${dragHandle}${sanitizeRich(el.text ?? "")}</div>`;
      case "image":
        return `<div${dataAttr} style="${base}${box}overflow:hidden;">${dragHandle}${el.media ? `<img src="${escUrl(el.media.url)}" alt="${esc(el.media.alt)}" style="width:100%;height:100%;object-fit:cover;${s.radius ? `border-radius:${s.radius}px;` : ""}" />` : ""}</div>`;
      case "button": {
        const btnRadius = b.buttonShape === "pill" ? "999px" : b.buttonShape === "sharp" ? "0" : "8px";
        const fill = b.buttonFill === "outline"
          ? `border:2px solid ${accent};color:${accent};background:transparent;`
          : `background:${accent};color:${onAccent};`;
        return `<div${dataAttr} style="${base}display:flex;align-items:center;justify-content:center;">${dragHandle}<a href="${escUrl(el.url)}" style="${fill}${typo}border-radius:${btnRadius};padding:12px 24px;text-decoration:none;display:inline-block;text-align:center;">${esc(el.text ?? "Botón")}</a></div>`;
      }
      case "logo":
        return `<div${dataAttr} style="${base}${box}overflow:hidden;display:flex;align-items:center;justify-content:center;">${dragHandle}${el.media ? `<img src="${escUrl(el.media.url)}" alt="${esc(el.media.alt)}" style="max-width:100%;max-height:100%;object-fit:contain;" />` : (b.logo ? `<img src="${escUrl(b.logo.url)}" alt="${esc(b.name)}" style="max-width:100%;max-height:100%;object-fit:contain;" />` : `<span style="${typo}font-weight:700;">${esc(b.name)}</span>`)}</div>`;
      default:
        return "";
    }
  }

  const canvasHtml = canvasEls.length
    ? `<div id="oliwan-canvas-layer" style="position:absolute;top:0;left:0;width:100%;height:0;overflow:visible;pointer-events:none;z-index:5;">${canvasEls.map(renderCanvasElement).join("")}</div>`
    : "";

  const body = pageSections
    .filter((s) => s.enabled)
    .map((s) => {
      const html = renderers[s.type]?.(s) ?? "";
      if (!html) return "";
      return editMode ? `<div data-demo-section-id="${s.id}">${html}</div>` : html;
    })
    .join("\n");

  const nav: NavConfig = cfg.nav ?? { ...defaultNav(), links: defaultNavLinks(pageSections) };
  const footer: FooterConfig = cfg.footer ?? { ...defaultFooter(), columns: [{ id: "default", title: "Enlaces", links: defaultNavLinks(pageSections) }] };

  const NAV_SIZE_PAD: Record<NavSize, string> = { compact: "8px 24px", normal: "14px 24px", large: "22px 24px" };
  const NAV_LOGO_H: Record<NavSize, string> = { compact: "32px", normal: "40px", large: "52px" };

  /** A link targeting another page resolves via pageHref; otherwise it's an ordinary URL/anchor. */
  function hrefOf(l: NavLink): string {
    return l.page ? esc(pageHref(l.page)) : escUrl(l.url);
  }

  function navLinkHtml(l: NavLink, mobile: boolean): string {
    const hasChildren = !!l.children?.length;
    if (mobile) {
      const child = hasChildren
        ? `<div style="display:flex;flex-direction:column;gap:10px;padding:8px 0 4px 16px;">${l.children!.map((c) => `<a href="${hrefOf(c)}" style="color:${ink};opacity:.72;text-decoration:none;font-size:.94rem;">${esc(c.label)}</a>`).join("")}</div>`
        : "";
      return `<div><a href="${hrefOf(l)}" style="color:${ink};text-decoration:none;font-size:1.05rem;font-weight:600;">${esc(l.label)}</a>${child}</div>`;
    }
    if (!hasChildren) {
      return `<a href="${hrefOf(l)}" style="color:${ink};text-decoration:none;font-size:.92rem;opacity:.75;">${esc(l.label)}</a>`;
    }
    return `<div class="nav-item" style="position:relative;">
      <a href="${hrefOf(l)}" style="color:${ink};text-decoration:none;font-size:.92rem;opacity:.75;display:flex;align-items:center;gap:4px;">${esc(l.label)}<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></a>
      <div class="nav-submenu" style="display:none;position:absolute;top:100%;left:0;margin-top:8px;background:${paper};border:1px solid ${hairline};border-radius:10px;padding:8px;min-width:180px;box-shadow:0 8px 24px -8px rgba(0,0,0,.2);">
        ${l.children!.map((c) => `<a href="${hrefOf(c)}" style="display:block;padding:8px 10px;border-radius:6px;color:${ink};text-decoration:none;font-size:.88rem;">${esc(c.label)}</a>`).join("")}
      </div>
    </div>`;
  }

  function renderNav(): string {
    beginSection(null);
    if (!nav.links.length && !nav.ctaText) return "";
    const logo = nav.showLogo
      ? (b.logo?.url
          ? `<img src="${escUrl(b.logo.url)}" alt="${esc(b.name)}" style="height:${NAV_LOGO_H[nav.size]};width:auto;object-fit:contain;"/>`
          : `<span style="font-family:${f.heading};font-weight:${f.headingWeight};color:${ink};font-size:1.05rem;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(b.name)}</span>`)
      : "";
    const navCta = nav.ctaText ? btn(nav.ctaText, nav.ctaUrl) : "";
    const desktopLinks = nav.links.map((l) => navLinkHtml(l, false)).join("");
    const mobileLinks = nav.links.map((l) => navLinkHtml(l, true)).join("");

    return `<nav${editMode ? ' data-demo-section-id="__nav__"' : ""} style="${nav.sticky ? "position:sticky;top:0;" : ""}z-index:50;background:${paper}e8;backdrop-filter:blur(12px);border-bottom:1px solid ${hairline};max-width:100%;">
      <input type="checkbox" id="oliwan-burger" class="burger-toggle" style="display:none;"/>
      <div style="padding:${NAV_SIZE_PAD[nav.size]};display:flex;align-items:center;${nav.layout === "center" ? "flex-direction:column;gap:14px;" : "justify-content:space-between;gap:24px;"}">
        <a href="#inicio" style="text-decoration:none;display:flex;align-items:center;">${logo || `<span></span>`}</a>
        <div class="nav-links" style="display:flex;gap:22px;align-items:center;">
          ${desktopLinks}
          ${navCta}
        </div>
        <label for="oliwan-burger" class="burger-btn" style="display:none;cursor:pointer;width:26px;height:20px;flex-direction:column;justify-content:space-between;">
          <span style="display:block;height:2px;background:${ink};border-radius:2px;"></span>
          <span style="display:block;height:2px;background:${ink};border-radius:2px;"></span>
          <span style="display:block;height:2px;background:${ink};border-radius:2px;"></span>
        </label>
      </div>
      <div class="nav-mobile-panel">
        <div style="display:flex;flex-direction:column;gap:18px;padding:8px 28px 32px;">
          ${mobileLinks}
          ${navCta}
        </div>
      </div>
    </nav>`;
  }

  const FOOTER_PAD: Record<FooterSize, string> = { compact: "32px 24px", normal: "52px 24px", spacious: "80px 24px" };

  function renderFooter(): string {
    beginSection(null);
    const footerBg = dark ? mix(paper, "#000", 0.4) : mix(ink, paper, 0.05);
    const footerInk = dark ? ink : paper;
    const footerMuted = dark ? mix(ink, footerBg, 0.5) : mix(paper, footerBg, 0.35);

    const socialRows: { label: string; url: string }[] = [];
    if (b.instagram) socialRows.push({ label: "Instagram", url: `https://instagram.com/${b.instagram.replace("@", "")}` });
    if (b.whatsapp) socialRows.push({ label: "WhatsApp", url: `https://wa.me/${b.whatsapp.replace(/\D/g, "")}` });

    const logoBlock = footer.showLogo
      ? (b.logo?.url
          ? `<img src="${escUrl(b.logo.url)}" alt="${esc(b.name)}" style="height:36px;width:auto;object-fit:contain;margin-bottom:12px;"/>`
          : `<p style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.15rem;color:${footerInk};margin:0 0 10px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(b.name)}</p>`)
      : "";

    const contactLines = footer.showContact
      ? [b.phone, b.email, b.address].filter(Boolean).map((v) => `<p style="margin:0 0 6px;font-size:.86rem;color:${footerMuted};">${esc(v)}</p>`).join("")
      : "";

    const socialLine = footer.showSocial && socialRows.length
      ? `<div style="display:flex;gap:16px;margin-top:12px;">${socialRows.map((s) => `<a href="${escUrl(s.url)}" style="color:${footerMuted};text-decoration:none;font-size:.84rem;">${esc(s.label)}</a>`).join("")}</div>`
      : "";

    const copyright = `<p style="margin:0;opacity:.6;font-size:.82rem;color:${footerInk};">© ${new Date().getFullYear()} ${esc(b.name)} · Todos los derechos reservados${footer.copyrightExtra ? ` · ${esc(footer.copyrightExtra)}` : ""}</p>`;

    if (footer.variant === "simple") {
      return `<footer${editMode ? ' data-demo-section-id="__footer__"' : ""} style="background:${footerBg};color:${footerInk};padding:${FOOTER_PAD[footer.size]};text-align:center;">
        ${logoBlock}
        ${footer.tagline ? `<p style="margin:0 0 14px;font-size:.92rem;color:${footerMuted};max-width:420px;margin-left:auto;margin-right:auto;">${esc(footer.tagline)}</p>` : ""}
        ${contactLines}
        <div style="display:flex;justify-content:center;">${socialLine}</div>
        <div style="margin-top:18px;">${copyright}</div>
      </footer>`;
    }

    return `<footer${editMode ? ' data-demo-section-id="__footer__"' : ""} style="background:${footerBg};color:${footerInk};padding:${FOOTER_PAD[footer.size]};">
      ${wrap(`<div style="display:grid;grid-template-columns:1.4fr repeat(${Math.max(footer.columns.length, 1)},1fr);gap:clamp(24px,4vw,56px);margin-bottom:36px;">
        <div>
          ${logoBlock}
          ${footer.tagline ? `<p style="margin:0 0 14px;font-size:.9rem;color:${footerMuted};max-width:280px;">${esc(footer.tagline)}</p>` : ""}
          ${contactLines}
          ${socialLine}
        </div>
        ${footer.columns.map((col) => `<div>
          <p style="font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:${footerMuted};font-weight:600;margin:0 0 14px;">${esc(col.title)}</p>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${col.links.map((l) => `<a href="${hrefOf(l)}" style="color:${footerInk};opacity:.75;text-decoration:none;font-size:.88rem;">${esc(l.label)}</a>`).join("")}
          </div>
        </div>`).join("")}
      </div>
      <div style="border-top:1px solid ${dark ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.15)"};padding-top:20px;">${copyright}</div>`, widthOf({ style: { width: "wide" } } as Section))}
    </footer>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(b.name || "Demo")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=${f.googleQuery}&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{margin:0;${bodyBackground[d.texture]}color:${ink};font-family:${f.body};font-weight:${f.bodyWeight};-webkit-font-smoothing:antialiased;background-attachment:fixed;}
img,video{max-width:100%;}
${b.imageStyle === "grayscale" ? "section img,section video{filter:grayscale(1);transition:filter .35s ease;}section img:hover,section video:hover{filter:grayscale(0);}" : ""}
${b.imageStyle === "duotone" ? `section img,section video{filter:grayscale(1) contrast(1.05) sepia(.45) hue-rotate(${hueFor(accent)}deg) saturate(2.2);}` : ""}
${b.imageStyle === "soft" ? "section img,section video{box-shadow:0 24px 48px -24px rgba(0,0,0,.4);}" : ""}
.btn:hover{transform:translateY(-1px);opacity:.92;}
.nav-links a:hover{opacity:1!important;}
.nav-item:hover .nav-submenu{display:block!important;}
.nav-submenu a:hover{background:${hairline};}
.nav-mobile-panel{display:none;}
details summary::-webkit-details-marker{display:none;}
/* Per-element visibility. Breakpoints match the layout ones below, so what
   the device switcher shows is what a real device gets. */
@media(min-width:861px){.hide-d{display:none!important;}}
@media(min-width:561px) and (max-width:860px){.hide-t{display:none!important;}}
@media(max-width:560px){.hide-m{display:none!important;}}
${editMode ? `
/* Editor chrome — only ever emitted in edit mode, never on a published page. */
[data-demo-section-id]{cursor:pointer;}
.el{outline:1px dashed transparent;outline-offset:3px;transition:outline-color .12s ease;}
.el:hover{outline-color:rgba(99,102,241,.6);cursor:pointer;}
.el[data-sel="1"]{outline:2px solid #6366f1;outline-offset:3px;}
[data-demo-section-id][data-sel="1"]{outline:2px solid rgba(99,102,241,.45);outline-offset:-2px;}
.el[data-sel="1"]::after{content:attr(data-el-label);position:absolute;transform:translateY(-100%);margin-top:-6px;background:#6366f1;color:#fff;font:600 10px/1.6 system-ui,sans-serif;padding:1px 6px;border-radius:4px;white-space:nowrap;pointer-events:none;z-index:99;}
.el[data-sel="1"]{position:relative;}
[data-text]{outline-offset:3px;}
[data-text]:focus{outline:2px solid #6366f1;outline-offset:3px;border-radius:2px;}
#oliwan-tb{position:absolute;z-index:2147483000;display:none;flex-direction:column;gap:2px;background:#18181b;border-radius:8px;padding:4px;box-shadow:0 8px 24px -6px rgba(0,0,0,.5);font-family:system-ui,sans-serif;}
#oliwan-tb .tb-row{display:flex;gap:2px;align-items:center;}
#oliwan-tb button{all:unset;cursor:pointer;color:#e4e4e7;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:5px;font-size:12px;line-height:1;}
#oliwan-tb button:hover{background:#3f3f46;}
#oliwan-tb button[data-active="1"]{background:#4f46e5;}
#oliwan-tb .sep{width:1px;background:#3f3f46;margin:3px 2px;}
#oliwan-tb .typo-row{display:none;gap:4px;align-items:center;padding:2px 0;border-top:1px solid #3f3f46;margin-top:2px;padding-top:4px;}
#oliwan-tb .typo-row select,#oliwan-tb .typo-row input[type="number"]{all:unset;color:#e4e4e7;background:#27272a;border:1px solid #3f3f46;border-radius:4px;padding:2px 4px;font-size:10px;text-align:center;}
#oliwan-tb .typo-row select{width:42px;cursor:pointer;}
#oliwan-tb .typo-row input[type="number"]{width:36px;}
#oliwan-tb .typo-row .typo-label{color:#a1a1aa;font-size:9px;white-space:nowrap;}
[data-canvas-el]{cursor:grab;outline:1px dashed rgba(99,102,241,.5);transition:outline .15s;}
[data-canvas-el]:hover{outline:2px solid #4f46e5;}
.canvas-drag-handle:hover{opacity:1!important;transform:translateX(-50%) scale(1.15);}
.el[data-el]{cursor:grab;}
.el[data-el]:hover{outline:1px dashed rgba(99,102,241,.35)!important;outline-offset:3px;}
` : ""}
@media(max-width:860px){
  .split{grid-template-columns:1fr!important;}
  .split > div[style*="order:2"]{order:0!important;}
  .split > div[style*="order:1"]{order:1!important;}
  .masonry{columns:2!important;}
  .nav-links{display:none!important;}
  .burger-btn{display:flex!important;}
  #oliwan-burger:checked ~ .nav-mobile-panel{display:block!important;}
}
@media(max-width:560px){
  .masonry{columns:1!important;}
}
${safeCss(cfg.customCss)}
</style>
</head>
<body style="position:relative;">
${renderNav()}
${body}
${canvasHtml}
${renderFooter()}
${editMode ? `<script>
(function(){
  var selected = null;
  function clear(){
    if (selected) selected.removeAttribute('data-sel');
    selected = null;
  }
  function mark(node){
    clear();
    if (!node) return;
    node.setAttribute('data-sel','1');
    selected = node;
  }
  function send(msg){
    try { parent.postMessage(Object.assign({ source:'oliwan-demo' }, msg), '*'); } catch (err) {}
  }

  document.addEventListener('click', function(e){
    var t = e.target;
    if (!t || !t.closest) return;
    // While editing, a click means "select this" — never "follow this link".
    var link = t.closest('a');
    if (link) e.preventDefault();

    // Canvas element clicks: select the element, don't fall through to deselect
    var cel = t.closest('[data-canvas-el]');
    if (cel) {
      e.stopPropagation();
      mark(cel);
      send({ type:'select-canvas-element', id: cel.getAttribute('data-canvas-el') });
      return;
    }

    var el = t.closest('[data-el]');
    if (el) {
      e.stopPropagation();
      mark(el);
      var parts = String(el.getAttribute('data-el')).split(':');
      send({ type:'select-element', id: parts[0], key: parts.slice(1).join(':') });
      return;
    }
    var sec = t.closest('[data-demo-section-id]');
    if (sec) {
      mark(sec);
      send({ type:'select', id: sec.getAttribute('data-demo-section-id') });
    } else {
      clear();
      send({ type:'deselect' });
    }
  }, true);

  // The sidebar can drive selection too, so the highlight stays in sync
  // whichever side the user is working from.
  // ── Inline text editing ────────────────────────────────
  var tb = document.createElement('div');
  tb.id = 'oliwan-tb';
  tb.innerHTML =
    '<div class="tb-row">' +
    '<span class="fmt-group" style="display:flex;gap:2px;">' +
    '<button data-cmd="bold" title="Negrita"><b>B</b></button>' +
    '<button data-cmd="italic" title="Cursiva"><i>I</i></button>' +
    '<button data-cmd="underline" title="Subrayado"><u>U</u></button>' +
    '<span class="sep"></span>' +
    '<button data-cmd="createLink" title="Enlace">🔗</button>' +
    '<button data-cmd="unlink" title="Quitar enlace">⛓️‍💥</button>' +
    '<span class="sep"></span>' +
    '</span>' +
    '<button data-cmd="ai" title="Reescribir con IA">✨</button>' +
    '</div>' +
    '<div class="typo-row">' +
    '<button data-font="heading" title="Fuente de títulos" style="font-size:11px;width:auto;padding:0 6px;"><b>H</b></button>' +
    '<button data-font="body" title="Fuente de texto" style="font-size:11px;width:auto;padding:0 6px;">T</button>' +
    '<span class="sep"></span>' +
    '<input type="number" data-typo="size" min="8" max="120" step="1" title="Tamaño (px)" />' +
    '<span class="typo-label">px</span>' +
    '<span class="sep"></span>' +
    '<select data-typo="weight" title="Peso">' +
    '<option value="300">Light</option>' +
    '<option value="400">Regular</option>' +
    '<option value="500">Medium</option>' +
    '<option value="600">Semi</option>' +
    '<option value="700">Bold</option>' +
    '<option value="800">Extra</option>' +
    '<option value="900">Black</option>' +
    '</select>' +
    '</div>';
  document.body.appendChild(tb);

  // Tone submenu, opened by the ✨ button. Kept outside #oliwan-tb so its own
  // mousedown doesn't get swallowed by the toolbar's focus-preserving guard.
  var toneMenu = document.createElement('div');
  toneMenu.id = 'oliwan-tone';
  toneMenu.style.cssText = 'position:absolute;z-index:2147483001;display:none;flex-direction:column;gap:1px;background:#18181b;border-radius:8px;padding:4px;box-shadow:0 8px 24px -6px rgba(0,0,0,.5);font-family:system-ui,sans-serif;min-width:140px;';
  toneMenu.innerHTML =
    '<button data-tone="shorter">Más corto</button>' +
    '<button data-tone="punchier">Más contundente</button>' +
    '<button data-tone="formal">Más formal</button>' +
    '<button data-tone="casual">Más cercano</button>';
  var toneBtnStyle = 'all:unset;cursor:pointer;color:#e4e4e7;padding:6px 8px;border-radius:5px;font-size:11px;';
  Array.prototype.forEach.call(toneMenu.querySelectorAll('button'), function(b){
    b.style.cssText = toneBtnStyle;
    b.addEventListener('mouseenter', function(){ b.style.background = '#3f3f46'; });
    b.addEventListener('mouseleave', function(){ b.style.background = 'transparent'; });
  });
  document.body.appendChild(toneMenu);

  var activeField = null;

  function hideTb(){ tb.style.display = 'none'; toneMenu.style.display = 'none'; }

  function showTbFor(node){
    var rich = node.getAttribute('data-rich') === '1';
    var hasEl = !!node.closest('[data-el]');
    tb.querySelector('.fmt-group').style.display = rich ? 'flex' : 'none';
    var typoRow = tb.querySelector('.typo-row');
    typoRow.style.display = hasEl ? 'flex' : 'none';
    if (hasEl) populateTypo(node);
    var r = node.getBoundingClientRect();
    tb.style.display = 'flex';
    tb.style.left = Math.max(8, r.left + window.scrollX) + 'px';
    var tbHeight = hasEl ? 68 : 38;
    tb.style.top = Math.max(8, r.top + window.scrollY - tbHeight) + 'px';
    toneMenu.style.display = 'none';
  }

  function populateTypo(node) {
    var cs = getComputedStyle(node);
    var sizeInput = tb.querySelector('[data-typo="size"]');
    var weightSelect = tb.querySelector('[data-typo="weight"]');
    if (sizeInput) sizeInput.value = Math.round(parseFloat(cs.fontSize));
    if (weightSelect) weightSelect.value = String(Math.round(Number(cs.fontWeight) / 100) * 100);
    var headingFont = document.querySelector('h1,h2,h3');
    var hFamily = headingFont ? getComputedStyle(headingFont).fontFamily : '';
    var isHeading = hFamily && cs.fontFamily.split(',')[0].trim() === hFamily.split(',')[0].trim();
    var hBtn = tb.querySelector('[data-font="heading"]');
    var bBtn = tb.querySelector('[data-font="body"]');
    if (hBtn) hBtn.setAttribute('data-active', isHeading ? '1' : '0');
    if (bBtn) bBtn.setAttribute('data-active', isHeading ? '0' : '1');
  }

  function getElInfo(node) {
    var elNode = node.closest('[data-el]');
    if (!elNode) return null;
    var parts = String(elNode.getAttribute('data-el')).split(':');
    return { id: parts[0], key: parts.slice(1).join(':') };
  }

  // Formatting must not steal focus from the text being edited.
  tb.addEventListener('mousedown', function(e){ e.preventDefault(); });
  toneMenu.addEventListener('mousedown', function(e){ e.preventDefault(); });

  tb.addEventListener('click', function(e){
    var btn = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!btn || !activeField) return;
    var cmd = btn.getAttribute('data-cmd');
    if (cmd === 'ai') {
      var r = tb.getBoundingClientRect();
      toneMenu.style.left = tb.style.left;
      toneMenu.style.top = Math.max(8, r.top + window.scrollY - 4) + 'px';
      toneMenu.style.display = toneMenu.style.display === 'flex' ? 'none' : 'flex';
      return;
    }
    if (cmd === 'createLink') {
      var url = prompt('Enlace (https://… o #seccion)');
      if (!url) return;
      document.execCommand('createLink', false, url);
    } else {
      document.execCommand(cmd, false, undefined);
    }
    commit(activeField, true);
  });

  tb.addEventListener('click', function(e){
    var fontBtn = e.target && e.target.closest ? e.target.closest('[data-font]') : null;
    if (fontBtn && activeField) {
      var info = getElInfo(activeField);
      if (info) {
        send({ type:'style-change', id: info.id, key: info.key, patch: { fontFamily: fontBtn.getAttribute('data-font') } });
      }
    }
  });

  var sizeInput = tb.querySelector('[data-typo="size"]');
  if (sizeInput) {
    sizeInput.addEventListener('input', function(){
      if (!activeField) return;
      var info = getElInfo(activeField);
      if (info) send({ type:'style-change', id: info.id, key: info.key, patch: { fontSize: sizeInput.value + 'px' } });
    });
    sizeInput.addEventListener('mousedown', function(e){ e.stopPropagation(); });
  }

  var weightSelect = tb.querySelector('[data-typo="weight"]');
  if (weightSelect) {
    weightSelect.addEventListener('change', function(){
      if (!activeField) return;
      var info = getElInfo(activeField);
      if (info) send({ type:'style-change', id: info.id, key: info.key, patch: { fontWeight: weightSelect.value } });
    });
    weightSelect.addEventListener('mousedown', function(e){ e.stopPropagation(); });
  }

  toneMenu.addEventListener('click', function(e){
    var btn = e.target && e.target.closest ? e.target.closest('button[data-tone]') : null;
    if (!btn || !activeField) return;
    var tone = btn.getAttribute('data-tone');
    var node = activeField;
    var rich = node.getAttribute('data-rich') === '1';
    var parts = String(node.getAttribute('data-text')).split(':');
    var current = rich ? node.innerHTML : node.innerText;
    toneMenu.style.display = 'none';
    node.setAttribute('contenteditable', 'false'); // prevent typing mid-request
    node.style.opacity = '.55';
    send({
      type: 'rewrite-request', id: parts[0], field: parts.slice(1).join(':'),
      rich: rich, text: current, tone: tone,
    });
  });

  function commit(node, immediate){
    var parts = String(node.getAttribute('data-text')).split(':');
    var rich = node.getAttribute('data-rich') === '1';
    var value = rich ? node.innerHTML : node.innerText;
    send({ type:'text-change', id: parts[0], field: parts.slice(1).join(':'), value: value, immediate: !!immediate });
  }

  var timer = null;
  document.addEventListener('input', function(e){
    var node = e.target && e.target.closest ? e.target.closest('[data-text]') : null;
    if (!node) return;
    clearTimeout(timer);
    timer = setTimeout(function(){ commit(node, false); }, 400);
  });

  document.addEventListener('focusin', function(e){
    var node = e.target && e.target.closest ? e.target.closest('[data-text]') : null;
    if (!node) { return; }
    activeField = node;
    var hasEl = !!node.closest('[data-el]');
    if (node.getAttribute('data-rich') === '1' || hasEl) showTbFor(node); else hideTb();
  });

  document.addEventListener('focusout', function(e){
    var node = e.target && e.target.closest ? e.target.closest('[data-text]') : null;
    if (!node) return;
    clearTimeout(timer);
    commit(node, true);
    setTimeout(function(){
      if (!document.activeElement || !document.activeElement.closest || !document.activeElement.closest('[data-text]')) {
        hideTb(); activeField = null;
      }
    }, 60);
  });

  // ── Drag: canvas elements (absolute) + section elements (offset) ───
  var dragTarget = null, dragKind = '', dragStartX = 0, dragStartY = 0, dragOrigX = 0, dragOrigY = 0;

  document.addEventListener('mousedown', function(e){
    var t = e.target;
    if (!t || !t.closest) return;
    // Don't start drag if clicking inside a contenteditable field
    if (t.closest('[contenteditable="true"]')) return;

    // Canvas overlay elements: absolute positioning
    var cel = t.closest('[data-canvas-el]');
    if (cel) {
      e.preventDefault();
      e.stopPropagation();
      dragTarget = cel;
      dragKind = 'canvas';
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragOrigX = parseInt(cel.style.left) || 0;
      dragOrigY = parseInt(cel.style.top) || 0;
      cel.style.cursor = 'grabbing';
      cel.style.outline = '2px solid #4f46e5';
      return;
    }

    // Section elements: translate offset
    var elNode = t.closest('[data-el]');
    if (elNode) {
      e.preventDefault();
      e.stopPropagation();
      dragTarget = elNode;
      dragKind = 'element';
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      var m = (elNode.style.transform || '').match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      dragOrigX = m ? parseFloat(m[1]) : 0;
      dragOrigY = m ? parseFloat(m[2]) : 0;
      elNode.style.cursor = 'grabbing';
      elNode.style.outline = '2px solid #4f46e5';
      elNode.style.outlineOffset = '2px';
      return;
    }
  });

  document.addEventListener('mousemove', function(e){
    if (!dragTarget) return;
    e.preventDefault();
    var dx = e.clientX - dragStartX;
    var dy = e.clientY - dragStartY;
    if (dragKind === 'canvas') {
      dragTarget.style.left = Math.max(0, dragOrigX + dx) + 'px';
      dragTarget.style.top = Math.max(0, dragOrigY + dy) + 'px';
    } else {
      dragTarget.style.position = 'relative';
      dragTarget.style.transform = 'translate(' + (dragOrigX + dx) + 'px,' + (dragOrigY + dy) + 'px)';
    }
  });

  document.addEventListener('mouseup', function(){
    if (!dragTarget) return;
    if (dragKind === 'canvas') {
      var id = dragTarget.getAttribute('data-canvas-el');
      var x = parseInt(dragTarget.style.left) || 0;
      var y = parseInt(dragTarget.style.top) || 0;
      dragTarget.style.cursor = '';
      dragTarget.style.outline = '';
      send({ type:'canvas-move', id: id, x: x, y: y });
    } else {
      var parts = String(dragTarget.getAttribute('data-el')).split(':');
      var m = (dragTarget.style.transform || '').match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      var ox = m ? Math.round(parseFloat(m[1])) : 0;
      var oy = m ? Math.round(parseFloat(m[2])) : 0;
      dragTarget.style.cursor = '';
      dragTarget.style.outline = '';
      dragTarget.style.outlineOffset = '';
      send({ type:'element-drag', id: parts[0], key: parts.slice(1).join(':'), offsetX: ox, offsetY: oy });
    }
    dragTarget = null;
    dragKind = '';
  });

  // Enter should end the edit, not insert a newline into a heading.
  document.addEventListener('keydown', function(e){
    var node = e.target && e.target.closest ? e.target.closest('[data-text]') : null;
    if (!node) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); node.blur(); }
    if (e.key === 'Escape') { node.blur(); }
  });

  window.addEventListener('scroll', function(){ if (activeField) showTbFor(activeField); }, true);

  window.addEventListener('message', function(e){
    var d = e.data;
    if (!d || d.source !== 'oliwan-editor') return;
    if (d.type === 'select-element' && d.id && d.key) {
      var el = document.querySelector('[data-el="' + d.id + ':' + d.key + '"]');
      mark(el);
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior:'smooth', block:'center' });
    } else if (d.type === 'select' && d.id) {
      var sec = document.querySelector('[data-demo-section-id="' + d.id + '"]');
      mark(sec);
      if (sec && sec.scrollIntoView) sec.scrollIntoView({ behavior:'smooth', block:'start' });
    } else if (d.type === 'deselect') {
      clear();
    } else if (d.type === 'rewrite-result' && d.id && d.field !== undefined) {
      var target = document.querySelector('[data-text="' + d.id + ':' + d.field + '"]');
      if (!target) return;
      target.setAttribute('contenteditable', 'true');
      target.style.opacity = '';
      if (typeof d.text === 'string') {
        if (target.getAttribute('data-rich') === '1') target.innerHTML = d.text; else target.innerText = d.text;
        commit(target, true);
      }
      // Errors are surfaced by the parent (toast); the field just re-enables.
    }
  });
})();
</script>` : ""}
</body>
</html>`;
}

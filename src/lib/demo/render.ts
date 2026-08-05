import type { DemoConfig, Section, MediaRef, SectionWidth, SectionPad, NavConfig, FooterConfig, NavLink, NavSize, FooterSize } from "./types";
import { getTemplate } from "./templates";
import { getFontPair } from "./fonts";
import { defaultNav, defaultFooter, defaultNavLinks } from "./types";

function esc(s: string | undefined): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

function isDark(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

function media(m: MediaRef | undefined, style: string, cls = ""): string {
  if (!m?.url) return "";
  if (m.kind === "video") {
    return `<video src="${esc(m.url)}" style="${style}" class="${cls}" autoplay muted loop playsinline></video>`;
  }
  return `<img src="${esc(m.url)}" alt="${esc(m.alt)}" style="${style}" class="${cls}" loading="lazy" />`;
}

const WIDTH_PX: Record<SectionWidth, string> = { narrow: "760px", normal: "1080px", wide: "1320px", full: "100%" };
const PAD_SCALE: Record<SectionPad, number> = { compact: 0.55, normal: 1, spacious: 1.5 };

export function renderDemo(cfg: DemoConfig): string {
  const t = getTemplate(cfg.template);
  const f = getFontPair(cfg.fontPair);
  const d = t.dna;
  const b = cfg.brand;

  const accent = b.accent || "#6366f1";
  const ink = b.ink || "#111827";
  const paper = b.paper || "#ffffff";
  const dark = isDark(paper);
  const muted = mix(ink, paper, 0.42);
  const hairline = mix(ink, paper, 0.86);
  const soft = mix(accent, paper, 0.9);
  const onAccent = isDark(accent) ? "#ffffff" : "#111111";
  const upper = f.headingCase === "upper";

  const btnRadius = b.buttonShape === "sharp" ? "0px" : b.buttonShape === "rounded" ? "10px" : "999px";
  const btnFill = b.buttonFill ?? "solid";

  // Per-section style resolution ─────────────────────────
  function widthOf(s: Section): string {
    return s.style?.width ? WIDTH_PX[s.style.width] : d.maxWidth;
  }
  function padOf(s: Section): string {
    const scale = PAD_SCALE[s.style?.pad ?? "normal"];
    return `calc(${d.sectionPadY} * ${scale})`;
  }
  function bgOf(s: Section): string {
    return s.style?.bg || paper;
  }
  function alignOf(s: Section): "left" | "center" {
    return s.style?.align ?? d.align;
  }

  const wrap = (inner: string, maxW: string, extra = "") =>
    `<div style="max-width:${maxW};margin:0 auto;padding:0 24px;${extra}">${inner}</div>`;

  const eyebrow = (text?: string, align: "left" | "center" = d.align) => {
    if (!text || d.eyebrow === "none") return "";
    if (d.eyebrow === "rule") {
      return `<p class="eyebrow" style="display:flex;align-items:center;gap:12px;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:${accent};font-weight:600;margin:0 0 18px;${align === "center" ? "justify-content:center;" : ""}"><span style="width:32px;height:1px;background:${accent};display:inline-block;"></span>${esc(text)}</p>`;
    }
    return `<p class="eyebrow" style="font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:${accent};font-weight:600;margin:0 0 14px;">${esc(text)}</p>`;
  };

  const h2 = (text?: string) =>
    text
      ? `<h2 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:${d.h2};line-height:1.08;letter-spacing:${f.headingTracking};color:${ink};margin:0 0 18px;${upper ? "text-transform:uppercase;" : ""}">${esc(text)}</h2>`
      : "";

  const lede = (text?: string, align: "left" | "center" = d.align) =>
    text ? `<p style="font-size:1.08rem;line-height:1.7;color:${muted};margin:0 0 8px;max-width:62ch;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}">${esc(text)}</p>` : "";

  const btn = (text?: string, url?: string, forceFill?: "solid" | "outline") => {
    if (!text) return "";
    const fill = forceFill ?? btnFill;
    const base = `display:inline-block;font-family:${f.body};font-weight:600;font-size:.98rem;padding:15px 34px;border-radius:${btnRadius};text-decoration:none;transition:transform .15s ease,opacity .15s ease;`;
    const style =
      fill === "solid"
        ? `${base}background:${accent};color:${onAccent};`
        : `${base}background:transparent;color:${ink};border:1.5px solid ${mix(ink, paper, 0.7)};`;
    return `<a href="${esc(url || "#contacto")}" class="btn" style="${style}">${esc(text)}</a>`;
  };

  const surfaceCard = (inner: string, pad = "32px") => {
    if (d.surface === "card")
      return `<div style="background:${dark ? mix(paper, "#ffffff", 0.06) : "#ffffff"};border-radius:${d.radius};padding:${pad};box-shadow:0 1px 3px rgba(0,0,0,.06),0 8px 24px -12px rgba(0,0,0,.12);">${inner}</div>`;
    if (d.surface === "bordered")
      return `<div style="border:2px solid ${ink};border-radius:${d.radius};padding:${pad};">${inner}</div>`;
    return `<div style="padding:${pad} 0;border-top:1px solid ${hairline};">${inner}</div>`;
  };

  // sec() now resolves bg/width/padding from the section's own style overrides.
  function sec(s: Section, inner: string, id?: string): string {
    return `<section ${id ? `id="${id}"` : ""} style="padding:${padOf(s)} 0;background:${bgOf(s)};">${wrap(inner, widthOf(s))}</section>`;
  }

  // ── HERO ────────────────────────────────────────────────
  function hero(s: Section): string {
    const title = s.heading || b.name || "Tu Negocio";
    const align = alignOf(s);
    const logo = b.logo?.url
      ? `<img src="${esc(b.logo.url)}" alt="${esc(b.name)}" style="height:56px;width:auto;object-fit:contain;margin-bottom:28px;display:block;${align === "center" || s.variant === "stack" ? "margin-left:auto;margin-right:auto;" : ""}" />`
      : "";
    const h1 = `<h1 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:${d.h1};line-height:1.02;letter-spacing:${f.headingTracking};margin:0 0 22px;${upper ? "text-transform:uppercase;" : ""}">${esc(title)}</h1>`;

    if (s.variant === "cover") {
      const overlayInk = "#ffffff";
      const overlay = (s.style?.overlay ?? 55) / 100;
      return `<section id="inicio" style="position:relative;min-height:${d.sectionPadY === "clamp(80px, 12vw, 160px)" ? "88vh" : "78vh"};display:flex;align-items:center;background:${ink};overflow:hidden;">
        ${s.media?.url ? media(s.media, "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.52;") : ""}
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,${overlay * 0.5}),rgba(0,0,0,${overlay}));"></div>
        ${wrap(`<div style="position:relative;color:${overlayInk};max-width:${align === "center" ? "760px" : "820px"};${align === "center" ? "margin:0 auto;text-align:center;" : ""}">
          ${logo}
          ${s.eyebrow ? `<p style="font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;color:${accent};font-weight:600;margin:0 0 16px;">${esc(s.eyebrow)}</p>` : ""}
          ${h1.replace("margin:0 0 22px;", `margin:0 0 22px;color:${overlayInk};`)}
          ${s.subheading ? `<p style="font-size:clamp(1.05rem,2vw,1.3rem);line-height:1.6;opacity:.9;margin:0 0 34px;max-width:56ch;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}">${esc(s.subheading)}</p>` : ""}
          ${btn(s.ctaText, s.ctaUrl)}
        </div>`, widthOf(s))}
      </section>`;
    }

    if (s.variant === "stack") {
      return sec(s, `<div style="text-align:center;max-width:780px;margin:0 auto;">
        ${logo}
        ${eyebrow(s.eyebrow, "center")}
        ${h1.replace("margin:0 0 22px;", `margin:0 0 22px;color:${ink};`)}
        ${s.subheading ? `<p style="font-size:clamp(1.05rem,2vw,1.28rem);line-height:1.65;color:${muted};margin:0 auto 36px;max-width:58ch;">${esc(s.subheading)}</p>` : ""}
        ${btn(s.ctaText, s.ctaUrl)}
      </div>`, "inicio");
    }

    if (s.variant === "offset") {
      return sec(s, `<div>
        ${logo}
        ${eyebrow(s.eyebrow, align)}
        ${h1.replace("margin:0 0 22px;", `margin:0 0 26px;color:${ink};max-width:16ch;`)}
        <div style="display:flex;flex-wrap:wrap;gap:32px;align-items:flex-end;justify-content:space-between;margin-bottom:44px;">
          ${s.subheading ? `<p style="font-size:1.12rem;line-height:1.65;color:${muted};margin:0;max-width:46ch;flex:1 1 320px;">${esc(s.subheading)}</p>` : "<span></span>"}
          ${btn(s.ctaText, s.ctaUrl)}
        </div>
        ${s.media?.url ? media(s.media, `width:100%;height:clamp(260px,42vw,520px);object-fit:cover;border-radius:${d.imageRadius};display:block;`) : ""}
      </div>`, "inicio");
    }

    // split (default)
    return sec(s, `<div class="split" style="display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(32px,5vw,72px);align-items:center;">
      <div>
        ${logo}
        ${eyebrow(s.eyebrow, align)}
        ${h1.replace("margin:0 0 22px;", `margin:0 0 22px;color:${ink};`)}
        ${s.subheading ? `<p style="font-size:1.12rem;line-height:1.68;color:${muted};margin:0 0 34px;max-width:52ch;">${esc(s.subheading)}</p>` : ""}
        ${btn(s.ctaText, s.ctaUrl)}
      </div>
      ${s.media?.url ? `<div>${media(s.media, `width:100%;height:clamp(300px,40vw,520px);object-fit:cover;border-radius:${d.imageRadius};display:block;`)}</div>` : `<div style="background:${soft};border-radius:${d.imageRadius};min-height:340px;"></div>`}
    </div>`, "inicio");
  }

  // ── FEATURES ────────────────────────────────────────────
  function features(s: Section): string {
    const items = s.items ?? [];
    const align = alignOf(s);
    const head = `<div style="${align === "center" ? "text-align:center;max-width:660px;margin:0 auto 56px;" : "max-width:640px;margin:0 0 56px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>`;

    if (s.variant === "rows") {
      return sec(s, head + items.map((it, i) => `
        <div class="split" style="display:grid;grid-template-columns:${i % 2 ? ".95fr 1.05fr" : "1.05fr .95fr"};gap:clamp(28px,4vw,64px);align-items:center;padding:clamp(28px,4vw,52px) 0;${i ? `border-top:1px solid ${hairline};` : ""}">
          <div style="${i % 2 ? "order:2;" : ""}">
            <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:clamp(1.3rem,2.4vw,1.9rem);color:${ink};margin:0 0 12px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
            <p style="color:${muted};line-height:1.7;margin:0;font-size:1.02rem;">${esc(it.body)}</p>
          </div>
          ${it.media?.url ? `<div style="${i % 2 ? "order:1;" : ""}">${media(it.media, `width:100%;height:clamp(200px,26vw,320px);object-fit:cover;border-radius:${d.imageRadius};display:block;`)}</div>` : `<div style="${i % 2 ? "order:1;" : ""}background:${soft};border-radius:${d.imageRadius};min-height:200px;"></div>`}
        </div>`).join(""), "servicios");
    }

    if (s.variant === "numbered") {
      return sec(s, head + `<div style="display:grid;gap:0;">` + items.map((it, i) => `
        <div style="display:grid;grid-template-columns:auto 1fr;gap:clamp(20px,3vw,44px);padding:clamp(24px,3.5vw,40px) 0;${i ? `border-top:1px solid ${hairline};` : ""}">
          <span style="font-family:${f.heading};font-size:clamp(1.8rem,3.4vw,2.8rem);font-weight:${f.headingWeight};color:${accent};line-height:1;min-width:2.2ch;">${String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:clamp(1.2rem,2.2vw,1.6rem);color:${ink};margin:0 0 10px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
            <p style="color:${muted};line-height:1.7;margin:0;max-width:60ch;">${esc(it.body)}</p>
          </div>
        </div>`).join("") + `</div>`, "servicios");
    }

    const cols = s.variant === "grid4" ? "minmax(220px,1fr)" : "minmax(260px,1fr)";
    return sec(s, head + `<div class="grid3" style="display:grid;grid-template-columns:repeat(auto-fit,${cols});gap:${d.surface === "card" ? "24px" : "0"};">` +
      items.map((it) => surfaceCard(`
        ${it.media?.url ? media(it.media, `width:100%;height:180px;object-fit:cover;border-radius:${d.imageRadius};display:block;margin-bottom:22px;`) : ""}
        <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.22rem;color:${ink};margin:0 0 11px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
        <p style="color:${muted};line-height:1.7;margin:0;font-size:.98rem;">${esc(it.body)}</p>`)).join("") + `</div>`, "servicios");
  }

  // ── GALLERY ─────────────────────────────────────────────
  function gallery(s: Section): string {
    const items = (s.items ?? []).filter((i) => i.media?.url);
    if (!items.length) return "";
    const align = alignOf(s);
    const head = `<div style="${align === "center" ? "text-align:center;max-width:620px;margin:0 auto 48px;" : "margin:0 0 48px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>`;

    if (s.variant === "carousel") {
      return `<section id="galeria" style="padding:${padOf(s)} 0;background:${bgOf(s)};">${wrap(head, widthOf(s))}<div style="display:flex;gap:16px;overflow-x:auto;padding:0 24px 12px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;">` +
        items.map((it) => `<div style="flex:0 0 clamp(240px,32vw,380px);scroll-snap-align:start;">${media(it.media, `width:100%;height:clamp(240px,30vw,360px);object-fit:cover;border-radius:${d.imageRadius};display:block;`)}${it.title ? `<p style="margin:12px 0 0;font-weight:600;color:${ink};font-size:.95rem;">${esc(it.title)}</p>` : ""}</div>`).join("") + `</div></section>`;
    }

    if (s.variant === "grid2") {
      return sec(s, head + `<div class="grid2" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">` +
        items.map((it) => `<figure style="margin:0;">${media(it.media, `width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:${d.imageRadius};display:block;`)}${it.title ? `<figcaption style="margin-top:12px;color:${muted};font-size:.92rem;">${esc(it.title)}</figcaption>` : ""}</figure>`).join("") + `</div>`, "galeria");
    }

    return sec(s, head + `<div class="masonry" style="columns:3;column-gap:16px;">` +
      items.map((it) => `<figure style="margin:0 0 16px;break-inside:avoid;">${media(it.media, `width:100%;border-radius:${d.imageRadius};display:block;`)}${it.title ? `<figcaption style="margin-top:10px;color:${muted};font-size:.9rem;">${esc(it.title)}</figcaption>` : ""}</figure>`).join("") + `</div>`, "galeria");
  }

  // ── VIDEO ───────────────────────────────────────────────
  function video(s: Section): string {
    if (!s.media?.url) return "";
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
      ? `<iframe src="${esc(embedUrl)}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:${d.imageRadius};display:block;" allowfullscreen allow="autoplay; encrypted-media"></iframe>`
      : `<video src="${esc(v)}" controls playsinline style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:${d.imageRadius};display:block;background:#000;"></video>`;

    if (s.variant === "full") {
      return `<section id="video" style="padding:${padOf(s)} 0;background:${bgOf(s)};"><div style="max-width:1400px;margin:0 auto;padding:0 24px;">${player}</div></section>`;
    }
    const align = alignOf(s);
    return sec(s, `<div style="${align === "center" ? "text-align:center;max-width:640px;margin:0 auto 40px;" : "max-width:620px;margin:0 0 40px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>` + player, "video");
  }

  // ── ABOUT ───────────────────────────────────────────────
  function about(s: Section): string {
    const align = alignOf(s);
    const aboutBg = s.style?.bg || (dark ? mix(paper, "#ffffff", 0.04) : soft);

    if (s.variant === "centered") {
      return `<section id="nosotros" style="padding:${padOf(s)} 0;background:${aboutBg};">${wrap(`<div style="text-align:center;max-width:720px;margin:0 auto;">
        ${eyebrow(s.eyebrow, "center")}${h2(s.heading)}
        <p style="font-size:1.14rem;line-height:1.85;color:${muted};margin:0;">${esc(s.body)}</p>
      </div>`, widthOf(s))}</section>`;
    }

    if (s.variant === "stat") {
      const stats = (s.items ?? []).slice(0, 4);
      return `<section id="nosotros" style="padding:${padOf(s)} 0;background:${aboutBg};">${wrap(`<div style="${align === "center" ? "text-align:center;max-width:700px;margin:0 auto 52px;" : "max-width:640px;margin:0 0 52px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:clamp(20px,3vw,44px);">
        ${stats.map((st) => `<div style="${align === "center" ? "text-align:center;" : ""}">
          <p style="font-family:${f.heading};font-size:clamp(2.2rem,4.5vw,3.4rem);font-weight:${f.headingWeight};color:${accent};margin:0 0 8px;line-height:1;">${esc(st.title)}</p>
          <p style="color:${muted};margin:0;font-size:.95rem;line-height:1.5;">${esc(st.body)}</p>
        </div>`).join("")}
      </div>`, widthOf(s))}</section>`;
    }

    return sec(s, `<div class="split" style="display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,72px);align-items:center;">
      ${s.media?.url ? `<div>${media(s.media, `width:100%;height:clamp(280px,36vw,460px);object-fit:cover;border-radius:${d.imageRadius};display:block;`)}</div>` : `<div style="background:${dark ? mix(paper, "#fff", 0.07) : mix(accent, paper, 0.82)};border-radius:${d.imageRadius};min-height:300px;"></div>`}
      <div>${eyebrow(s.eyebrow, align)}${h2(s.heading)}
        <p style="font-size:1.08rem;line-height:1.8;color:${muted};margin:0;">${esc(s.body)}</p>
      </div>
    </div>`, "nosotros");
  }

  // ── TESTIMONIALS ────────────────────────────────────────
  function testimonials(s: Section): string {
    const items = s.items ?? [];
    if (!items.length) return "";
    const testBg = s.style?.bg || (dark ? mix(paper, "#ffffff", 0.04) : soft);
    if (s.variant === "single") {
      const it = items[0];
      return `<section id="testimonios" style="padding:${padOf(s)} 0;background:${testBg};">${wrap(`<div style="text-align:center;max-width:800px;margin:0 auto;">
        <p style="font-family:${f.heading};font-size:clamp(1.4rem,3.2vw,2.3rem);line-height:1.4;color:${ink};margin:0 0 28px;font-weight:${f.headingWeight};letter-spacing:${f.headingTracking};">&ldquo;${esc(it.body)}&rdquo;</p>
        <p style="color:${accent};font-weight:600;margin:0;font-size:.98rem;">${esc(it.author)}${it.role ? `<span style="color:${muted};font-weight:400;"> — ${esc(it.role)}</span>` : ""}</p>
      </div>`, widthOf(s))}</section>`;
    }
    const align = alignOf(s);
    return sec(s, `<div style="${align === "center" ? "text-align:center;max-width:620px;margin:0 auto 48px;" : "margin:0 0 48px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:${d.surface === "card" ? "24px" : "0"};">
      ${items.map((it) => surfaceCard(`
        <p style="color:${ink};line-height:1.75;margin:0 0 20px;font-size:1.02rem;">&ldquo;${esc(it.body)}&rdquo;</p>
        <p style="color:${accent};font-weight:600;margin:0;font-size:.92rem;">${esc(it.author)}${it.role ? `<span style="color:${muted};font-weight:400;display:block;margin-top:2px;">${esc(it.role)}</span>` : ""}</p>`)).join("")}
    </div>`, "testimonios");
  }

  // ── STATS ───────────────────────────────────────────────
  function stats(s: Section): string {
    const items = s.items ?? [];
    if (!items.length) return "";
    const align = alignOf(s);
    const head = (s.eyebrow || s.heading) ? `<div style="${align === "center" ? "text-align:center;" : ""}margin:0 0 40px;">${eyebrow(s.eyebrow, align)}${h2(s.heading)}</div>` : "";
    if (s.variant === "cards") {
      return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;">` +
        items.map((it) => surfaceCard(`<p style="font-family:${f.heading};font-size:clamp(2rem,4vw,2.8rem);font-weight:${f.headingWeight};color:${accent};margin:0 0 6px;line-height:1;">${esc(it.title)}</p><p style="color:${muted};margin:0;font-size:.92rem;">${esc(it.body)}</p>`, "24px")).join("") + `</div>`, "cifras");
    }
    return sec(s, head + `<div style="display:flex;flex-wrap:wrap;justify-content:${align === "center" ? "center" : "flex-start"};gap:clamp(28px,6vw,64px);">` +
      items.map((it) => `<div style="${align === "center" ? "text-align:center;" : ""}min-width:120px;">
        <p style="font-family:${f.heading};font-size:clamp(2.2rem,4.5vw,3.4rem);font-weight:${f.headingWeight};color:${accent};margin:0 0 6px;line-height:1;">${esc(it.title)}</p>
        <p style="color:${muted};margin:0;font-size:.92rem;">${esc(it.body)}</p>
      </div>`).join("") + `</div>`, "cifras");
  }

  // ── TEAM ────────────────────────────────────────────────
  function team(s: Section): string {
    const items = s.items ?? [];
    if (!items.length) return "";
    const align = alignOf(s);
    const head = `<div style="${align === "center" ? "text-align:center;max-width:620px;margin:0 auto 48px;" : "margin:0 0 48px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>`;
    if (s.variant === "rows") {
      return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:28px;">` +
        items.map((it) => `<div style="display:flex;gap:16px;align-items:center;">
          ${it.media?.url ? media(it.media, "width:64px;height:64px;object-fit:cover;border-radius:999px;flex-shrink:0;") : `<div style="width:64px;height:64px;border-radius:999px;background:${soft};flex-shrink:0;"></div>`}
          <div>
            <p style="font-weight:700;color:${ink};margin:0 0 3px;font-family:${f.heading};letter-spacing:${f.headingTracking};">${esc(it.title)}</p>
            <p style="color:${muted};margin:0;font-size:.9rem;">${esc(it.body)}</p>
          </div>
        </div>`).join("") + `</div>`, "equipo");
    }
    return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:24px;">` +
      items.map((it) => `<div style="text-align:center;">
        ${it.media?.url ? media(it.media, `width:100%;aspect-ratio:1;object-fit:cover;border-radius:${d.imageRadius};display:block;margin-bottom:14px;`) : `<div style="width:100%;aspect-ratio:1;border-radius:${d.imageRadius};background:${soft};margin-bottom:14px;"></div>`}
        <p style="font-weight:700;color:${ink};margin:0 0 3px;font-family:${f.heading};letter-spacing:${f.headingTracking};">${esc(it.title)}</p>
        <p style="color:${muted};margin:0;font-size:.9rem;">${esc(it.body)}</p>
      </div>`).join("") + `</div>`, "equipo");
  }

  // ── LOGOS ───────────────────────────────────────────────
  function logos(s: Section): string {
    const items = (s.items ?? []).filter((i) => i.media?.url);
    if (!items.length) return "";
    return sec(s, `${s.eyebrow ? `<p style="text-align:center;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:${muted};font-weight:600;margin:0 0 32px;">${esc(s.eyebrow)}</p>` : ""}
    <div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:clamp(24px,5vw,56px);">
      ${items.map((it) => media(it.media, "height:32px;width:auto;object-fit:contain;opacity:.75;filter:" + (dark ? "brightness(2) grayscale(1);" : "grayscale(1);")))
        .join("")}
    </div>`, "clientes");
  }

  // ── FAQ ─────────────────────────────────────────────────
  function faq(s: Section): string {
    const items = s.items ?? [];
    if (!items.length) return "";
    const align = alignOf(s);
    const head = `<div style="${align === "center" ? "text-align:center;max-width:620px;margin:0 auto 44px;" : "max-width:620px;margin:0 0 44px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}</div>`;
    const row = (it: { title?: string; body?: string }) => `<details style="border-top:1px solid ${hairline};padding:18px 0;">
      <summary style="cursor:pointer;font-weight:600;color:${ink};font-size:1rem;list-style:none;display:flex;justify-content:space-between;gap:16px;">
        ${esc(it.title)}<span style="color:${accent};">+</span>
      </summary>
      <p style="color:${muted};line-height:1.7;margin:12px 0 0;font-size:.95rem;">${esc(it.body)}</p>
    </details>`;
    if (s.variant === "twocol") {
      const half = Math.ceil(items.length / 2);
      return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:0 40px;">
        <div>${items.slice(0, half).map(row).join("")}</div>
        <div>${items.slice(half).map(row).join("")}</div>
      </div>`, "preguntas");
    }
    return sec(s, head + `<div style="max-width:720px;${align === "center" ? "margin:0 auto;" : ""}">${items.map(row).join("")}</div>`, "preguntas");
  }

  // ── BANNER ──────────────────────────────────────────────
  function banner(s: Section): string {
    if (s.variant === "image" && s.media?.url) {
      const overlay = (s.style?.overlay ?? 55) / 100;
      return `<section style="position:relative;padding:${padOf(s)} 0;overflow:hidden;">
        ${media(s.media, "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")}
        <div style="position:absolute;inset:0;background:rgba(0,0,0,${overlay});"></div>
        ${wrap(`<div style="position:relative;text-align:center;color:#fff;">
          <h2 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:${d.h2};margin:0 0 12px;letter-spacing:${f.headingTracking};">${esc(s.heading)}</h2>
          ${s.body ? `<p style="opacity:.9;margin:0 0 26px;font-size:1.05rem;">${esc(s.body)}</p>` : ""}
          ${btn(s.ctaText, s.ctaUrl, "solid")}
        </div>`, widthOf(s))}
      </section>`;
    }
    return `<section style="padding:${padOf(s)} 0;background:${s.style?.bg || accent};">${wrap(`<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px;color:${onAccent};">
      <div>
        <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.3rem;margin:0 0 4px;letter-spacing:${f.headingTracking};">${esc(s.heading)}</h3>
        ${s.body ? `<p style="margin:0;opacity:.9;font-size:.95rem;">${esc(s.body)}</p>` : ""}
      </div>
      ${btn(s.ctaText, s.ctaUrl, isDark(s.style?.bg || accent) ? "outline" : "solid")}
    </div>`, widthOf(s))}</section>`;
  }

  // ── DIVIDER ─────────────────────────────────────────────
  function divider(s: Section): string {
    if (s.variant === "space") return `<div style="height:${padOf(s)};background:${bgOf(s)};"></div>`;
    return `<div style="padding:${padOf(s)} 0;background:${bgOf(s)};">${wrap(`<hr style="border:none;border-top:1px solid ${hairline};margin:0;"/>`, widthOf(s))}</div>`;
  }

  // ── COLUMNS (free text) ─────────────────────────────────
  function columns(s: Section): string {
    const items = s.items ?? [];
    const n = s.variant === "three" ? 3 : s.variant === "single" ? 1 : 2;
    const head = s.heading ? `<div style="margin:0 0 44px;${alignOf(s) === "center" ? "text-align:center;" : ""}">${h2(s.heading)}</div>` : "";
    return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(${n},1fr);gap:clamp(28px,4vw,56px);">` +
      items.slice(0, n).map((it) => `<div>
        ${it.title ? `<h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.2rem;color:${ink};margin:0 0 12px;letter-spacing:${f.headingTracking};">${esc(it.title)}</h3>` : ""}
        <p style="color:${muted};line-height:1.75;margin:0;font-size:1rem;white-space:pre-line;">${esc(it.body)}</p>
      </div>`).join("") + `</div>`);
  }

  // ── MENU / PRICING ──────────────────────────────────────
  function menu(s: Section): string {
    const items = s.items ?? [];
    if (!items.length) return "";
    const align = alignOf(s);
    const head = `<div style="${align === "center" ? "text-align:center;max-width:620px;margin:0 auto 52px;" : "margin:0 0 52px;"}">${eyebrow(s.eyebrow, align)}${h2(s.heading)}${lede(s.body, align)}</div>`;

    if (s.variant === "cards") {
      return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px;">` +
        items.map((it) => surfaceCard(`
          ${it.media?.url ? media(it.media, `width:100%;height:190px;object-fit:cover;border-radius:${d.imageRadius};display:block;margin-bottom:18px;`) : ""}
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:14px;margin-bottom:8px;">
            <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.12rem;color:${ink};margin:0;${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
            ${it.price ? `<span style="color:${accent};font-weight:700;font-size:1.05rem;white-space:nowrap;">${esc(it.price)}</span>` : ""}
          </div>
          <p style="color:${muted};line-height:1.65;margin:0;font-size:.94rem;">${esc(it.body)}</p>`, "20px")).join("") + `</div>`, "menu");
    }

    if (s.variant === "tiers") {
      return sec(s, head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;align-items:stretch;">` +
        items.map((it, i) => `<div style="border:2px solid ${i === 1 ? accent : hairline};border-radius:${d.radius};padding:36px 28px;display:flex;flex-direction:column;${i === 1 ? `background:${soft};` : ""}">
          <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.15rem;color:${ink};margin:0 0 10px;${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
          ${it.price ? `<p style="font-family:${f.heading};font-size:clamp(2rem,4vw,2.8rem);font-weight:${f.headingWeight};color:${accent};margin:0 0 18px;line-height:1;">${esc(it.price)}</p>` : ""}
          <p style="color:${muted};line-height:1.7;margin:0 0 26px;font-size:.96rem;flex:1;">${esc(it.body)}</p>
          ${btn(s.ctaText || "Elegir", s.ctaUrl)}
        </div>`).join("") + `</div>`, "menu");
    }

    return sec(s, head + `<div style="max-width:760px;${align === "center" ? "margin:0 auto;" : ""}">` +
      items.map((it, i) => `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px;padding:20px 0;${i ? `border-top:1px solid ${hairline};` : ""}">
        <div style="text-align:left;">
          <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.08rem;color:${ink};margin:0 0 5px;${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
          ${it.body ? `<p style="color:${muted};margin:0;font-size:.94rem;line-height:1.6;">${esc(it.body)}</p>` : ""}
        </div>
        ${it.price ? `<span style="color:${accent};font-weight:700;font-size:1.08rem;white-space:nowrap;">${esc(it.price)}</span>` : ""}
      </div>`).join("") + `</div>`, "menu");
  }

  // ── CTA ─────────────────────────────────────────────────
  function cta(s: Section): string {
    if (s.variant === "boxed") {
      return sec(s, `<div style="border:2px solid ${accent};border-radius:${d.radius};padding:clamp(36px,6vw,72px);text-align:center;">
        ${h2(s.heading)}${s.body ? `<p style="font-size:1.08rem;color:${muted};line-height:1.7;margin:0 auto 32px;max-width:52ch;">${esc(s.body)}</p>` : ""}
        ${btn(s.ctaText, s.ctaUrl)}
      </div>`);
    }
    const bg = s.style?.bg || accent;
    const onBg = isDark(bg) ? "#ffffff" : "#111111";
    return `<section style="padding:${padOf(s)} 0;background:${bg};">
      ${wrap(`<div style="text-align:center;color:${onBg};">
        <h2 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:${d.h2};line-height:1.1;margin:0 0 16px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(s.heading)}</h2>
        ${s.body ? `<p style="font-size:1.1rem;opacity:.88;line-height:1.7;margin:0 auto 34px;max-width:54ch;">${esc(s.body)}</p>` : ""}
        <a href="${esc(s.ctaUrl || "#contacto")}" class="btn" style="display:inline-block;background:${onBg};color:${bg};font-weight:700;font-size:1rem;padding:16px 40px;border-radius:${btnRadius};text-decoration:none;">${esc(s.ctaText)}</a>
      </div>`, widthOf(s))}
    </section>`;
  }

  // ── CONTACT ─────────────────────────────────────────────
  function contact(s: Section): string {
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
      return r.href ? `<a href="${esc(r.href)}" style="${st}">${inner}</a>` : `<div style="${st}">${inner}</div>`;
    }).join("");

    if (s.variant === "inline") {
      return sec(s, `<div style="text-align:center;">${eyebrow(s.eyebrow, "center")}${h2(s.heading)}${lede(s.body, "center")}
        <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:34px;">
          ${rows.map((r) => r.href ? `<a href="${esc(r.href)}" style="display:flex;align-items:center;gap:10px;background:${soft};border-radius:${btnRadius === "0px" ? "0" : "999px"};padding:14px 26px;color:${ink};text-decoration:none;font-weight:600;font-size:.96rem;">${icon(r.icon)}${esc(r.label)}</a>` : "").join("")}
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
  const body = (cfg.sections ?? [])
    .filter((s) => s.enabled)
    .map((s) => {
      const html = renderers[s.type]?.(s) ?? "";
      return html ? `<div data-demo-section-id="${s.id}">${html}</div>` : "";
    })
    .join("\n");

  const nav: NavConfig = cfg.nav ?? { ...defaultNav(), links: defaultNavLinks(cfg.sections ?? []) };
  const footer: FooterConfig = cfg.footer ?? { ...defaultFooter(), columns: [{ id: "default", title: "Enlaces", links: defaultNavLinks(cfg.sections ?? []) }] };

  const NAV_SIZE_PAD: Record<NavSize, string> = { compact: "8px 24px", normal: "14px 24px", large: "22px 24px" };
  const NAV_LOGO_H: Record<NavSize, string> = { compact: "32px", normal: "40px", large: "52px" };

  function navLinkHtml(l: NavLink, mobile: boolean): string {
    const hasChildren = !!l.children?.length;
    if (mobile) {
      const child = hasChildren
        ? `<div style="display:flex;flex-direction:column;gap:10px;padding:8px 0 4px 16px;">${l.children!.map((c) => `<a href="${esc(c.url)}" style="color:${ink};opacity:.72;text-decoration:none;font-size:.94rem;">${esc(c.label)}</a>`).join("")}</div>`
        : "";
      return `<div><a href="${esc(l.url)}" style="color:${ink};text-decoration:none;font-size:1.05rem;font-weight:600;">${esc(l.label)}</a>${child}</div>`;
    }
    if (!hasChildren) {
      return `<a href="${esc(l.url)}" style="color:${ink};text-decoration:none;font-size:.92rem;opacity:.75;">${esc(l.label)}</a>`;
    }
    return `<div class="nav-item" style="position:relative;">
      <a href="${esc(l.url)}" style="color:${ink};text-decoration:none;font-size:.92rem;opacity:.75;display:flex;align-items:center;gap:4px;">${esc(l.label)}<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></a>
      <div class="nav-submenu" style="display:none;position:absolute;top:100%;left:0;margin-top:8px;background:${paper};border:1px solid ${hairline};border-radius:10px;padding:8px;min-width:180px;box-shadow:0 8px 24px -8px rgba(0,0,0,.2);">
        ${l.children!.map((c) => `<a href="${esc(c.url)}" style="display:block;padding:8px 10px;border-radius:6px;color:${ink};text-decoration:none;font-size:.88rem;">${esc(c.label)}</a>`).join("")}
      </div>
    </div>`;
  }

  function renderNav(): string {
    if (!nav.links.length && !nav.ctaText) return "";
    const logo = nav.showLogo
      ? (b.logo?.url
          ? `<img src="${esc(b.logo.url)}" alt="${esc(b.name)}" style="height:${NAV_LOGO_H[nav.size]};width:auto;object-fit:contain;"/>`
          : `<span style="font-family:${f.heading};font-weight:${f.headingWeight};color:${ink};font-size:1.05rem;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(b.name)}</span>`)
      : "";
    const navCta = nav.ctaText ? btn(nav.ctaText, nav.ctaUrl) : "";
    const desktopLinks = nav.links.map((l) => navLinkHtml(l, false)).join("");
    const mobileLinks = nav.links.map((l) => navLinkHtml(l, true)).join("");

    return `<nav data-demo-section-id="__nav__" style="${nav.sticky ? "position:sticky;top:0;" : ""}z-index:50;background:${paper}e8;backdrop-filter:blur(12px);border-bottom:1px solid ${hairline};max-width:100%;">
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
    const footerBg = dark ? mix(paper, "#000", 0.4) : mix(ink, paper, 0.05);
    const footerInk = dark ? ink : paper;
    const footerMuted = dark ? mix(ink, footerBg, 0.5) : mix(paper, footerBg, 0.35);

    const socialRows: { label: string; url: string }[] = [];
    if (b.instagram) socialRows.push({ label: "Instagram", url: `https://instagram.com/${b.instagram.replace("@", "")}` });
    if (b.whatsapp) socialRows.push({ label: "WhatsApp", url: `https://wa.me/${b.whatsapp.replace(/\D/g, "")}` });

    const logoBlock = footer.showLogo
      ? (b.logo?.url
          ? `<img src="${esc(b.logo.url)}" alt="${esc(b.name)}" style="height:36px;width:auto;object-fit:contain;margin-bottom:12px;"/>`
          : `<p style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.15rem;color:${footerInk};margin:0 0 10px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(b.name)}</p>`)
      : "";

    const contactLines = footer.showContact
      ? [b.phone, b.email, b.address].filter(Boolean).map((v) => `<p style="margin:0 0 6px;font-size:.86rem;color:${footerMuted};">${esc(v)}</p>`).join("")
      : "";

    const socialLine = footer.showSocial && socialRows.length
      ? `<div style="display:flex;gap:16px;margin-top:12px;">${socialRows.map((s) => `<a href="${esc(s.url)}" style="color:${footerMuted};text-decoration:none;font-size:.84rem;">${esc(s.label)}</a>`).join("")}</div>`
      : "";

    const copyright = `<p style="margin:0;opacity:.6;font-size:.82rem;color:${footerInk};">© ${new Date().getFullYear()} ${esc(b.name)} · Todos los derechos reservados${footer.copyrightExtra ? ` · ${esc(footer.copyrightExtra)}` : ""}</p>`;

    if (footer.variant === "simple") {
      return `<footer data-demo-section-id="__footer__" style="background:${footerBg};color:${footerInk};padding:${FOOTER_PAD[footer.size]};text-align:center;">
        ${logoBlock}
        ${footer.tagline ? `<p style="margin:0 0 14px;font-size:.92rem;color:${footerMuted};max-width:420px;margin-left:auto;margin-right:auto;">${esc(footer.tagline)}</p>` : ""}
        ${contactLines}
        <div style="display:flex;justify-content:center;">${socialLine}</div>
        <div style="margin-top:18px;">${copyright}</div>
      </footer>`;
    }

    return `<footer data-demo-section-id="__footer__" style="background:${footerBg};color:${footerInk};padding:${FOOTER_PAD[footer.size]};">
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
            ${col.links.map((l) => `<a href="${esc(l.url)}" style="color:${footerInk};opacity:.75;text-decoration:none;font-size:.88rem;">${esc(l.label)}</a>`).join("")}
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
body{margin:0;background:${paper};color:${ink};font-family:${f.body};font-weight:${f.bodyWeight};-webkit-font-smoothing:antialiased;}
img,video{max-width:100%;}
.btn:hover{transform:translateY(-1px);opacity:.92;}
.nav-links a:hover{opacity:1!important;}
.nav-item:hover .nav-submenu{display:block!important;}
.nav-submenu a:hover{background:${hairline};}
.nav-mobile-panel{display:none;}
details summary::-webkit-details-marker{display:none;}
[data-demo-section-id]{cursor:pointer;}
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
${cfg.customCss || ""}
</style>
</head>
<body>
${renderNav()}
${body}
${renderFooter()}
<script>
document.addEventListener('click', function(e){
  var el = e.target && e.target.closest ? e.target.closest('[data-demo-section-id]') : null;
  if (!el) return;
  try { parent.postMessage({ source: 'oliwan-demo', type: 'select', id: el.getAttribute('data-demo-section-id') }, '*'); } catch (err) {}
});
</script>
</body>
</html>`;
}

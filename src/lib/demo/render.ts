import type { DemoConfig, Section, MediaRef } from "./types";
import { getTemplate } from "./templates";
import { getFontPair } from "./fonts";

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

  const wrap = (inner: string, extra = "") =>
    `<div style="max-width:${d.maxWidth};margin:0 auto;padding:0 24px;${extra}">${inner}</div>`;

  const eyebrow = (text?: string) => {
    if (!text || d.eyebrow === "none") return "";
    if (d.eyebrow === "rule") {
      return `<p class="eyebrow" style="display:flex;align-items:center;gap:12px;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:${accent};font-weight:600;margin:0 0 18px;${d.align === "center" ? "justify-content:center;" : ""}"><span style="width:32px;height:1px;background:${accent};display:inline-block;"></span>${esc(text)}</p>`;
    }
    return `<p class="eyebrow" style="font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:${accent};font-weight:600;margin:0 0 14px;">${esc(text)}</p>`;
  };

  const h2 = (text?: string) =>
    text
      ? `<h2 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:${d.h2};line-height:1.08;letter-spacing:${f.headingTracking};color:${ink};margin:0 0 18px;${upper ? "text-transform:uppercase;" : ""}">${esc(text)}</h2>`
      : "";

  const lede = (text?: string) =>
    text ? `<p style="font-size:1.08rem;line-height:1.7;color:${muted};margin:0 0 8px;max-width:62ch;${d.align === "center" ? "margin-left:auto;margin-right:auto;" : ""}">${esc(text)}</p>` : "";

  const btn = (text?: string, url?: string, variant: "solid" | "ghost" = "solid") => {
    if (!text) return "";
    const base = `display:inline-block;font-family:${f.body};font-weight:600;font-size:.98rem;padding:15px 34px;border-radius:${d.radius === "0px" ? "0px" : d.radius === "2px" ? "2px" : "999px"};text-decoration:none;transition:transform .15s ease,opacity .15s ease;`;
    const style =
      variant === "solid"
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

  const sec = (inner: string, bg?: string, id?: string) =>
    `<section ${id ? `id="${id}"` : ""} style="padding:${d.sectionPadY} 0;background:${bg || paper};">${inner}</section>`;

  // ── HERO ────────────────────────────────────────────────
  function hero(s: Section): string {
    const title = s.heading || b.name || "Tu Negocio";
    const logo = b.logo?.url
      ? `<img src="${esc(b.logo.url)}" alt="${esc(b.name)}" style="height:56px;width:auto;object-fit:contain;margin-bottom:28px;display:block;${d.align === "center" || s.variant === "stack" ? "margin-left:auto;margin-right:auto;" : ""}" />`
      : "";
    const h1 = `<h1 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:${d.h1};line-height:1.02;letter-spacing:${f.headingTracking};margin:0 0 22px;${upper ? "text-transform:uppercase;" : ""}">${esc(title)}</h1>`;

    if (s.variant === "cover") {
      const overlayInk = "#ffffff";
      return `<section id="inicio" style="position:relative;min-height:${d.sectionPadY === "clamp(80px, 12vw, 160px)" ? "88vh" : "78vh"};display:flex;align-items:center;background:${ink};overflow:hidden;">
        ${s.media?.url ? media(s.media, "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.52;") : ""}
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.7));"></div>
        ${wrap(`<div style="position:relative;color:${overlayInk};max-width:${d.align === "center" ? "760px" : "820px"};${d.align === "center" ? "margin:0 auto;text-align:center;" : ""}">
          ${logo}
          ${s.eyebrow ? `<p style="font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;color:${accent};font-weight:600;margin:0 0 16px;">${esc(s.eyebrow)}</p>` : ""}
          ${h1.replace("margin:0 0 22px;", `margin:0 0 22px;color:${overlayInk};`)}
          ${s.subheading ? `<p style="font-size:clamp(1.05rem,2vw,1.3rem);line-height:1.6;opacity:.9;margin:0 0 34px;max-width:56ch;${d.align === "center" ? "margin-left:auto;margin-right:auto;" : ""}">${esc(s.subheading)}</p>` : ""}
          ${btn(s.ctaText, s.ctaUrl)}
        </div>`)}
      </section>`;
    }

    if (s.variant === "stack") {
      return sec(wrap(`<div style="text-align:center;max-width:780px;margin:0 auto;">
        ${logo}
        ${eyebrow(s.eyebrow)}
        ${h1.replace("margin:0 0 22px;", `margin:0 0 22px;color:${ink};`)}
        ${s.subheading ? `<p style="font-size:clamp(1.05rem,2vw,1.28rem);line-height:1.65;color:${muted};margin:0 auto 36px;max-width:58ch;">${esc(s.subheading)}</p>` : ""}
        ${btn(s.ctaText, s.ctaUrl)}
      </div>`), paper, "inicio");
    }

    if (s.variant === "offset") {
      return sec(wrap(`<div>
        ${logo}
        ${eyebrow(s.eyebrow)}
        ${h1.replace("margin:0 0 22px;", `margin:0 0 26px;color:${ink};max-width:16ch;`)}
        <div style="display:flex;flex-wrap:wrap;gap:32px;align-items:flex-end;justify-content:space-between;margin-bottom:44px;">
          ${s.subheading ? `<p style="font-size:1.12rem;line-height:1.65;color:${muted};margin:0;max-width:46ch;flex:1 1 320px;">${esc(s.subheading)}</p>` : "<span></span>"}
          ${btn(s.ctaText, s.ctaUrl)}
        </div>
        ${s.media?.url ? media(s.media, `width:100%;height:clamp(260px,42vw,520px);object-fit:cover;border-radius:${d.imageRadius};display:block;`) : ""}
      </div>`), paper, "inicio");
    }

    // split (default)
    return sec(wrap(`<div class="split" style="display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(32px,5vw,72px);align-items:center;">
      <div>
        ${logo}
        ${eyebrow(s.eyebrow)}
        ${h1.replace("margin:0 0 22px;", `margin:0 0 22px;color:${ink};`)}
        ${s.subheading ? `<p style="font-size:1.12rem;line-height:1.68;color:${muted};margin:0 0 34px;max-width:52ch;">${esc(s.subheading)}</p>` : ""}
        ${btn(s.ctaText, s.ctaUrl)}
      </div>
      ${s.media?.url ? `<div>${media(s.media, `width:100%;height:clamp(300px,40vw,520px);object-fit:cover;border-radius:${d.imageRadius};display:block;`)}</div>` : `<div style="background:${soft};border-radius:${d.imageRadius};min-height:340px;"></div>`}
    </div>`), paper, "inicio");
  }

  // ── FEATURES ────────────────────────────────────────────
  function features(s: Section): string {
    const items = s.items ?? [];
    const head = `<div style="${d.align === "center" ? "text-align:center;max-width:660px;margin:0 auto 56px;" : "max-width:640px;margin:0 0 56px;"}">${eyebrow(s.eyebrow)}${h2(s.heading)}${lede(s.body)}</div>`;

    if (s.variant === "rows") {
      return sec(wrap(head + items.map((it, i) => `
        <div class="split" style="display:grid;grid-template-columns:${i % 2 ? ".95fr 1.05fr" : "1.05fr .95fr"};gap:clamp(28px,4vw,64px);align-items:center;padding:clamp(28px,4vw,52px) 0;${i ? `border-top:1px solid ${hairline};` : ""}">
          <div style="${i % 2 ? "order:2;" : ""}">
            <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:clamp(1.3rem,2.4vw,1.9rem);color:${ink};margin:0 0 12px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
            <p style="color:${muted};line-height:1.7;margin:0;font-size:1.02rem;">${esc(it.body)}</p>
          </div>
          ${it.media?.url ? `<div style="${i % 2 ? "order:1;" : ""}">${media(it.media, `width:100%;height:clamp(200px,26vw,320px);object-fit:cover;border-radius:${d.imageRadius};display:block;`)}</div>` : `<div style="${i % 2 ? "order:1;" : ""}background:${soft};border-radius:${d.imageRadius};min-height:200px;"></div>`}
        </div>`).join("")), paper, "servicios");
    }

    if (s.variant === "numbered") {
      return sec(wrap(head + `<div style="display:grid;gap:0;">` + items.map((it, i) => `
        <div style="display:grid;grid-template-columns:auto 1fr;gap:clamp(20px,3vw,44px);padding:clamp(24px,3.5vw,40px) 0;${i ? `border-top:1px solid ${hairline};` : ""}">
          <span style="font-family:${f.heading};font-size:clamp(1.8rem,3.4vw,2.8rem);font-weight:${f.headingWeight};color:${accent};line-height:1;min-width:2.2ch;">${String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:clamp(1.2rem,2.2vw,1.6rem);color:${ink};margin:0 0 10px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
            <p style="color:${muted};line-height:1.7;margin:0;max-width:60ch;">${esc(it.body)}</p>
          </div>
        </div>`).join("") + `</div>`), paper, "servicios");
    }

    // grid3
    return sec(wrap(head + `<div class="grid3" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:${d.surface === "card" ? "24px" : "0"};">` +
      items.map((it) => surfaceCard(`
        ${it.media?.url ? media(it.media, `width:100%;height:180px;object-fit:cover;border-radius:${d.imageRadius};display:block;margin-bottom:22px;`) : ""}
        <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.22rem;color:${ink};margin:0 0 11px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
        <p style="color:${muted};line-height:1.7;margin:0;font-size:.98rem;">${esc(it.body)}</p>`)).join("") + `</div>`), paper, "servicios");
  }

  // ── GALLERY ─────────────────────────────────────────────
  function gallery(s: Section): string {
    const items = (s.items ?? []).filter((i) => i.media?.url);
    if (!items.length) return "";
    const head = `<div style="${d.align === "center" ? "text-align:center;max-width:620px;margin:0 auto 48px;" : "margin:0 0 48px;"}">${eyebrow(s.eyebrow)}${h2(s.heading)}${lede(s.body)}</div>`;

    if (s.variant === "carousel") {
      return sec(wrap(head) + `<div style="display:flex;gap:16px;overflow-x:auto;padding:0 24px 12px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;">` +
        items.map((it) => `<div style="flex:0 0 clamp(240px,32vw,380px);scroll-snap-align:start;">${media(it.media, `width:100%;height:clamp(240px,30vw,360px);object-fit:cover;border-radius:${d.imageRadius};display:block;`)}${it.title ? `<p style="margin:12px 0 0;font-weight:600;color:${ink};font-size:.95rem;">${esc(it.title)}</p>` : ""}</div>`).join("") + `</div>`, paper, "galeria");
    }

    if (s.variant === "grid2") {
      return sec(wrap(head + `<div class="grid2" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">` +
        items.map((it) => `<figure style="margin:0;">${media(it.media, `width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:${d.imageRadius};display:block;`)}${it.title ? `<figcaption style="margin-top:12px;color:${muted};font-size:.92rem;">${esc(it.title)}</figcaption>` : ""}</figure>`).join("") + `</div>`), paper, "galeria");
    }

    // masonry
    return sec(wrap(head + `<div class="masonry" style="columns:3;column-gap:16px;">` +
      items.map((it) => `<figure style="margin:0 0 16px;break-inside:avoid;">${media(it.media, `width:100%;border-radius:${d.imageRadius};display:block;`)}${it.title ? `<figcaption style="margin-top:10px;color:${muted};font-size:.9rem;">${esc(it.title)}</figcaption>` : ""}</figure>`).join("") + `</div>`), paper, "galeria");
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
      return sec(`<div style="max-width:1400px;margin:0 auto;padding:0 24px;">${player}</div>`, paper, "video");
    }
    return sec(wrap(`<div style="${d.align === "center" ? "text-align:center;max-width:640px;margin:0 auto 40px;" : "max-width:620px;margin:0 0 40px;"}">${eyebrow(s.eyebrow)}${h2(s.heading)}${lede(s.body)}</div>` + player), paper, "video");
  }

  // ── ABOUT ───────────────────────────────────────────────
  function about(s: Section): string {
    if (s.variant === "centered") {
      return sec(wrap(`<div style="text-align:center;max-width:720px;margin:0 auto;">
        ${eyebrow(s.eyebrow)}${h2(s.heading)}
        <p style="font-size:1.14rem;line-height:1.85;color:${muted};margin:0;">${esc(s.body)}</p>
      </div>`), dark ? mix(paper, "#ffffff", 0.04) : soft, "nosotros");
    }

    if (s.variant === "stat") {
      const stats = (s.items ?? []).slice(0, 4);
      return sec(wrap(`<div style="${d.align === "center" ? "text-align:center;max-width:700px;margin:0 auto 52px;" : "max-width:640px;margin:0 0 52px;"}">${eyebrow(s.eyebrow)}${h2(s.heading)}${lede(s.body)}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:clamp(20px,3vw,44px);">
        ${stats.map((st) => `<div style="${d.align === "center" ? "text-align:center;" : ""}">
          <p style="font-family:${f.heading};font-size:clamp(2.2rem,4.5vw,3.4rem);font-weight:${f.headingWeight};color:${accent};margin:0 0 8px;line-height:1;">${esc(st.title)}</p>
          <p style="color:${muted};margin:0;font-size:.95rem;line-height:1.5;">${esc(st.body)}</p>
        </div>`).join("")}
      </div>`), dark ? mix(paper, "#ffffff", 0.04) : soft, "nosotros");
    }

    // split
    return sec(wrap(`<div class="split" style="display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,72px);align-items:center;">
      ${s.media?.url ? `<div>${media(s.media, `width:100%;height:clamp(280px,36vw,460px);object-fit:cover;border-radius:${d.imageRadius};display:block;`)}</div>` : `<div style="background:${dark ? mix(paper, "#fff", 0.07) : mix(accent, paper, 0.82)};border-radius:${d.imageRadius};min-height:300px;"></div>`}
      <div>${eyebrow(s.eyebrow)}${h2(s.heading)}
        <p style="font-size:1.08rem;line-height:1.8;color:${muted};margin:0;">${esc(s.body)}</p>
      </div>
    </div>`), paper, "nosotros");
  }

  // ── TESTIMONIALS ────────────────────────────────────────
  function testimonials(s: Section): string {
    const items = s.items ?? [];
    if (!items.length) return "";
    if (s.variant === "single") {
      const it = items[0];
      return sec(wrap(`<div style="text-align:center;max-width:800px;margin:0 auto;">
        <p style="font-family:${f.heading};font-size:clamp(1.4rem,3.2vw,2.3rem);line-height:1.4;color:${ink};margin:0 0 28px;font-weight:${f.headingWeight};letter-spacing:${f.headingTracking};">&ldquo;${esc(it.body)}&rdquo;</p>
        <p style="color:${accent};font-weight:600;margin:0;font-size:.98rem;">${esc(it.author)}${it.role ? `<span style="color:${muted};font-weight:400;"> — ${esc(it.role)}</span>` : ""}</p>
      </div>`), dark ? mix(paper, "#ffffff", 0.04) : soft, "testimonios");
    }
    return sec(wrap(`<div style="${d.align === "center" ? "text-align:center;max-width:620px;margin:0 auto 48px;" : "margin:0 0 48px;"}">${eyebrow(s.eyebrow)}${h2(s.heading)}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:${d.surface === "card" ? "24px" : "0"};">
      ${items.map((it) => surfaceCard(`
        <p style="color:${ink};line-height:1.75;margin:0 0 20px;font-size:1.02rem;">&ldquo;${esc(it.body)}&rdquo;</p>
        <p style="color:${accent};font-weight:600;margin:0;font-size:.92rem;">${esc(it.author)}${it.role ? `<span style="color:${muted};font-weight:400;display:block;margin-top:2px;">${esc(it.role)}</span>` : ""}</p>`)).join("")}
    </div>`), paper, "testimonios");
  }

  // ── MENU / PRICING ──────────────────────────────────────
  function menu(s: Section): string {
    const items = s.items ?? [];
    if (!items.length) return "";
    const head = `<div style="${d.align === "center" ? "text-align:center;max-width:620px;margin:0 auto 52px;" : "margin:0 0 52px;"}">${eyebrow(s.eyebrow)}${h2(s.heading)}${lede(s.body)}</div>`;

    if (s.variant === "cards") {
      return sec(wrap(head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px;">` +
        items.map((it) => surfaceCard(`
          ${it.media?.url ? media(it.media, `width:100%;height:190px;object-fit:cover;border-radius:${d.imageRadius};display:block;margin-bottom:18px;`) : ""}
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:14px;margin-bottom:8px;">
            <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.12rem;color:${ink};margin:0;${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
            ${it.price ? `<span style="color:${accent};font-weight:700;font-size:1.05rem;white-space:nowrap;">${esc(it.price)}</span>` : ""}
          </div>
          <p style="color:${muted};line-height:1.65;margin:0;font-size:.94rem;">${esc(it.body)}</p>`, "20px")).join("") + `</div>`), paper, "menu");
    }

    if (s.variant === "tiers") {
      return sec(wrap(head + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;align-items:stretch;">` +
        items.map((it, i) => `<div style="border:2px solid ${i === 1 ? accent : hairline};border-radius:${d.radius};padding:36px 28px;display:flex;flex-direction:column;${i === 1 ? `background:${soft};` : ""}">
          <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.15rem;color:${ink};margin:0 0 10px;${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
          ${it.price ? `<p style="font-family:${f.heading};font-size:clamp(2rem,4vw,2.8rem);font-weight:${f.headingWeight};color:${accent};margin:0 0 18px;line-height:1;">${esc(it.price)}</p>` : ""}
          <p style="color:${muted};line-height:1.7;margin:0 0 26px;font-size:.96rem;flex:1;">${esc(it.body)}</p>
          ${btn(s.ctaText || "Elegir", s.ctaUrl)}
        </div>`).join("") + `</div>`), paper, "menu");
    }

    // list
    return sec(wrap(head + `<div style="max-width:760px;${d.align === "center" ? "margin:0 auto;" : ""}">` +
      items.map((it, i) => `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px;padding:20px 0;${i ? `border-top:1px solid ${hairline};` : ""}">
        <div style="text-align:left;">
          <h3 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.08rem;color:${ink};margin:0 0 5px;${upper ? "text-transform:uppercase;" : ""}">${esc(it.title)}</h3>
          ${it.body ? `<p style="color:${muted};margin:0;font-size:.94rem;line-height:1.6;">${esc(it.body)}</p>` : ""}
        </div>
        ${it.price ? `<span style="color:${accent};font-weight:700;font-size:1.08rem;white-space:nowrap;">${esc(it.price)}</span>` : ""}
      </div>`).join("") + `</div>`), paper, "menu");
  }

  // ── CTA ─────────────────────────────────────────────────
  function cta(s: Section): string {
    if (s.variant === "boxed") {
      return sec(wrap(`<div style="border:2px solid ${accent};border-radius:${d.radius};padding:clamp(36px,6vw,72px);text-align:center;">
        ${h2(s.heading)}${s.body ? `<p style="font-size:1.08rem;color:${muted};line-height:1.7;margin:0 auto 32px;max-width:52ch;">${esc(s.body)}</p>` : ""}
        ${btn(s.ctaText, s.ctaUrl)}
      </div>`), paper);
    }
    return `<section style="padding:clamp(56px,8vw,100px) 0;background:${accent};">
      ${wrap(`<div style="text-align:center;color:${onAccent};">
        <h2 style="font-family:${f.heading};font-weight:${f.headingWeight};font-size:${d.h2};line-height:1.1;margin:0 0 16px;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(s.heading)}</h2>
        ${s.body ? `<p style="font-size:1.1rem;opacity:.88;line-height:1.7;margin:0 auto 34px;max-width:54ch;">${esc(s.body)}</p>` : ""}
        <a href="${esc(s.ctaUrl || "#contacto")}" class="btn" style="display:inline-block;background:${onAccent};color:${accent};font-weight:700;font-size:1rem;padding:16px 40px;border-radius:${d.radius === "0px" ? "0px" : d.radius === "2px" ? "2px" : "999px"};text-decoration:none;">${esc(s.ctaText)}</a>
      </div>`)}
    </section>`;
  }

  // ── CONTACT ─────────────────────────────────────────────
  function contact(s: Section): string {
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
      return sec(wrap(`<div style="text-align:center;">${eyebrow(s.eyebrow)}${h2(s.heading)}${lede(s.body)}
        <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:34px;">
          ${rows.map((r) => r.href ? `<a href="${esc(r.href)}" style="display:flex;align-items:center;gap:10px;background:${soft};border-radius:${d.radius === "0px" ? "0" : "999px"};padding:14px 26px;color:${ink};text-decoration:none;font-weight:600;font-size:.96rem;">${icon(r.icon)}${esc(r.label)}</a>` : "").join("")}
        </div>
      </div>`), paper, "contacto");
    }

    if (s.variant === "card") {
      return sec(wrap(`<div style="max-width:520px;margin:0 auto;text-align:center;">
        ${eyebrow(s.eyebrow)}${h2(s.heading)}${lede(s.body)}
        <div style="margin-top:32px;text-align:left;">${surfaceCard(list, "8px 28px")}</div>
      </div>`), paper, "contacto");
    }

    // split
    return sec(wrap(`<div class="split" style="display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,72px);align-items:start;">
      <div>${eyebrow(s.eyebrow)}${h2(s.heading)}${lede(s.body)}${btn(s.ctaText, s.ctaUrl) ? `<div style="margin-top:28px;">${btn(s.ctaText, s.ctaUrl)}</div>` : ""}</div>
      <div>${list}</div>
    </div>`), paper, "contacto");
  }

  const renderers: Record<string, (s: Section) => string> = {
    hero, features, gallery, video, about, testimonials, menu, cta, contact,
  };

  const body = (cfg.sections ?? [])
    .filter((s) => s.enabled)
    .map((s) => renderers[s.type]?.(s) ?? "")
    .join("\n");

  const navLinks = (cfg.sections ?? [])
    .filter((s) => s.enabled && s.type !== "hero" && s.type !== "cta")
    .map((s) => {
      const map: Record<string, [string, string]> = {
        features: ["servicios", "Servicios"], gallery: ["galeria", "Galería"],
        video: ["video", "Video"], about: ["nosotros", "Nosotros"],
        testimonials: ["testimonios", "Testimonios"], menu: ["menu", "Menú"],
        contact: ["contacto", "Contacto"],
      };
      const m = map[s.type];
      return m ? `<a href="#${m[0]}" style="color:${ink};text-decoration:none;font-size:.92rem;opacity:.75;">${m[1]}</a>` : "";
    })
    .join("");

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
nav a:hover{opacity:1!important;}
@media(max-width:860px){
  .split{grid-template-columns:1fr!important;}
  .split > div[style*="order:2"]{order:0!important;}
  .split > div[style*="order:1"]{order:1!important;}
  .masonry{columns:2!important;}
}
@media(max-width:560px){
  .masonry{columns:1!important;}
  nav{display:none!important;}
}
</style>
</head>
<body>
${navLinks ? `<nav style="position:sticky;top:0;z-index:50;background:${paper}e8;backdrop-filter:blur(12px);border-bottom:1px solid ${hairline};padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:24px;max-width:100%;">
  <a href="#inicio" style="font-family:${f.heading};font-weight:${f.headingWeight};color:${ink};text-decoration:none;font-size:1.05rem;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(b.name)}</a>
  <div style="display:flex;gap:24px;align-items:center;">${navLinks}</div>
</nav>` : ""}
${body}
<footer style="background:${dark ? mix(paper, "#000", 0.4) : mix(ink, paper, 0.05)};color:${dark ? ink : paper};padding:44px 24px;text-align:center;">
  <p style="margin:0 0 6px;font-family:${f.heading};font-weight:${f.headingWeight};font-size:1.1rem;letter-spacing:${f.headingTracking};${upper ? "text-transform:uppercase;" : ""}">${esc(b.name)}</p>
  <p style="margin:0;opacity:.6;font-size:.86rem;">© ${new Date().getFullYear()} · Todos los derechos reservados</p>
</footer>
</body>
</html>`;
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Loader2,
  Tag,
  Copy,
  Check,
  RefreshCw,
  Download,
  History,
  Trash2,
  X,
} from "lucide-react";

const TONES = {
  ar: [
    { id: "premium", label: "فاخر", hint: "أنيق ومقنّع" },
    { id: "friendly", label: "ودّي", hint: "قريب وبسيط" },
    { id: "punchy", label: "مباشر", hint: "قصير وحاسم" },
  ],
  en: [
    { id: "premium", label: "Premium", hint: "Elegant, refined" },
    { id: "friendly", label: "Friendly", hint: "Warm, casual" },
    { id: "punchy", label: "Punchy", hint: "Short, direct" },
  ],
};

const UI = {
  ar: {
    dir: "rtl",
    eyebrow: "لأصحاب المتاجر الإلكترونية",
    title: "مولّد أوصاف المنتجات",
    subtitle:
      "اكتب اسم المنتج ومواصفاته، واحصل على وصف تسويقي جاهز خلال ثوانٍ — بدل ما تقعد تصيغه بنفسك لكل منتج.",
    nameLabel: "اسم المنتج",
    namePlaceholder: "مثال: سماعة بلوتوث لاسلكية",
    featuresLabel: "المواصفات (اختياري)",
    featuresPlaceholder: "مثال: عمر بطارية 20 ساعة، مقاومة للماء، لون أسود وأبيض",
    toneLabel: "الأسلوب",
    generate: "أنشئ الوصف",
    generating: "جارٍ الكتابة...",
    emptyText: "الوصف الجاهز هيظهر هنا على شكل بطاقة منتج",
    loadingText: "بنجهّز وصف منتجك...",
    kicker: "وصف المنتج",
    copy: "نسخ الوصف",
    copied: "تم النسخ",
    regen: "نسخة أخرى",
    download: "تنزيل كصورة",
    error: "حدث خطأ أثناء إنشاء الوصف. حاول مرة أخرى.",
    historyBtn: "السجل",
    historyTitle: "الأوصاف السابقة",
    historyEmpty: "لسه معملتش أي وصف",
    clearAll: "حذف الكل",
    footer: "نموذج تجريبي — مبني على واجهة Claude API",
    langToggle: "English",
  },
  en: {
    dir: "ltr",
    eyebrow: "For online store owners",
    title: "Product Description Generator",
    subtitle:
      "Enter a product name and specs, get a ready marketing description in seconds — instead of writing it yourself for every item.",
    nameLabel: "Product name",
    namePlaceholder: "e.g. Wireless Bluetooth headphones",
    featuresLabel: "Specs (optional)",
    featuresPlaceholder: "e.g. 20-hour battery, waterproof, black & white",
    toneLabel: "Tone",
    generate: "Generate description",
    generating: "Writing...",
    emptyText: "Your ready description will appear here as a product tag",
    loadingText: "Preparing your product description...",
    kicker: "Product description",
    copy: "Copy description",
    copied: "Copied",
    regen: "Regenerate",
    download: "Download as image",
    error: "Something went wrong. Please try again.",
    historyBtn: "History",
    historyTitle: "Previous descriptions",
    historyEmpty: "No descriptions yet",
    clearAll: "Clear all",
    footer: "Demo — powered by the Claude API",
    langToggle: "عربي",
  },
};

const HISTORY_KEY = "pdg:history";

export default function ProductDescriptionGenerator() {
  const [lang, setLang] = useState("ar");
  const [name, setName] = useState("");
  const [features, setFeatures] = useState("");
  const [tone, setTone] = useState("friendly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const canvasRef = useRef(null);

  const t = UI[lang];
  const tones = TONES[lang];
  const canGenerate = name.trim().length > 0 && !loading;

  // Load history on mount (browser localStorage)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {
      // no history yet — fine
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  function persistHistory(next) {
    setHistory(next);
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch (e) {
      // best-effort
    }
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, features, tone, lang }),
      });

      if (!response.ok) throw new Error("request failed");
      const parsed = await response.json();
      setResult(parsed);

      const entry = {
        id: `${Date.now()}`,
        name,
        lang,
        tone,
        ...parsed,
      };
      const next = [entry, ...history].slice(0, 30);
      persistHistory(next);
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    const full = `${result.headline}\n\n${result.description}\n\n${result.bullets
      .map((b) => `• ${b}`)
      .join("\n")}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function loadFromHistory(entry) {
    setLang(entry.lang || "ar");
    setName(entry.name || "");
    setTone(entry.tone || "friendly");
    setResult({
      headline: entry.headline,
      description: entry.description,
      bullets: entry.bullets,
      seo_tags: entry.seo_tags,
    });
    setShowHistory(false);
  }

  function removeFromHistory(id, e) {
    e.stopPropagation();
    persistHistory(history.filter((h) => h.id !== id));
  }

  function clearHistory() {
    persistHistory([]);
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function handleDownloadImage() {
    if (!result) return;
    const isRTL = lang === "ar";
    const canvas = document.createElement("canvas");
    const W = 900;
    canvas.width = W;
    const ctx = canvas.getContext("2d");
    const marginX = 64;
    const contentW = W - marginX * 2;

    // First pass: measure height
    ctx.font = "600 15px Tajawal, sans-serif";
    const descLines = wrapText(ctx, result.description, contentW);
    ctx.font = "700 32px Tajawal, sans-serif";
    const headlineLines = wrapText(ctx, result.headline, contentW);

    const bulletCount = (result.bullets || []).length;
    const tagCount = (result.seo_tags || []).length;
    const H =
      120 +
      headlineLines.length * 42 +
      descLines.length * 28 +
      bulletCount * 30 +
      (tagCount ? 50 : 0) +
      60;

    canvas.height = H;

    // Background
    ctx.fillStyle = "#F7F0E3";
    ctx.fillRect(0, 0, W, H);

    // Perforation line + hole (always on the "spine" side)
    const spineX = isRTL ? W - 90 : 90;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "#D8CFB8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(spineX, 0);
    ctx.lineTo(spineX, H);
    ctx.stroke();
    ctx.setLineDash([]);

    const holeX = isRTL ? W - 45 : 45;
    ctx.beginPath();
    ctx.arc(holeX, 45, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#1B2430";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#F7F0E3";
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#C08A3E";
    ctx.stroke();

    const textX = isRTL ? W - 130 : 130;
    ctx.textAlign = isRTL ? "right" : "left";
    let y = 70;

    // Kicker
    ctx.fillStyle = "#A63D2F";
    ctx.font = "600 12px monospace";
    ctx.fillText(t.kicker.toUpperCase(), textX, y);
    y += 36;

    // Headline
    ctx.fillStyle = "#1B2430";
    ctx.font = "700 28px Tajawal, sans-serif";
    for (const line of headlineLines) {
      ctx.fillText(line, textX, y);
      y += 38;
    }
    y += 8;

    // Description
    ctx.fillStyle = "#3F3A2E";
    ctx.font = "400 16px Tajawal, sans-serif";
    for (const line of descLines) {
      ctx.fillText(line, textX, y);
      y += 26;
    }
    y += 14;

    // Bullets
    ctx.font = "400 15px Tajawal, sans-serif";
    for (const b of result.bullets || []) {
      ctx.fillStyle = "#0F5C5C";
      ctx.beginPath();
      const dotX = isRTL ? textX + 4 : textX - 4;
      ctx.arc(dotX, y - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3F3A2E";
      const bx = isRTL ? textX - 16 : textX + 16;
      ctx.textAlign = isRTL ? "right" : "left";
      ctx.fillText(b, bx, y);
      y += 28;
    }
    y += 10;

    // SEO tags
    if (tagCount) {
      ctx.font = "600 12px monospace";
      let tx = textX;
      for (const tg of result.seo_tags) {
        const label = `#${tg}`;
        const w = ctx.measureText(label).width + 20;
        const boxX = isRTL ? tx - w : tx;
        ctx.fillStyle = "rgba(15,92,92,0.1)";
        ctx.strokeStyle = "rgba(15,92,92,0.3)";
        roundRect(ctx, boxX, y - 16, w, 24, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#0F5C5C";
        ctx.textAlign = "center";
        ctx.fillText(label, boxX + w / 2, y);
        tx = isRTL ? boxX - 8 : boxX + w + 8;
      }
    }

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "product"}-description.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return (
    <div dir={t.dir} style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400..700&family=Tajawal:wght@400;500;700;900&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .pdg-input:focus, .pdg-textarea:focus, .pdg-tone:focus {
          outline: 2px solid #C08A3E;
          outline-offset: 2px;
        }
        .pdg-btn:focus-visible { outline: 2px solid #F7F0E3; outline-offset: 3px; }
        @keyframes pdg-rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pdg-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .pdg-spin { animation: pdg-spin 1s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pdg-rise, .pdg-spin { animation: none !important; }
        }
        @media (max-width: 640px) {
          .pdg-grid { grid-template-columns: 1fr !important; }
        }
        .pdg-hist-item:hover { background: #2B3849 !important; }
      `}</style>

      {/* Top bar */}
      <div style={styles.topbar}>
        <button style={styles.topbarBtn} onClick={() => setShowHistory(true)}>
          <History size={15} />
          {t.historyBtn}
          {history.length > 0 && (
            <span style={styles.historyCount}>{history.length}</span>
          )}
        </button>
        <button
          style={styles.topbarBtn}
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
        >
          {t.langToggle}
        </button>
      </div>

      {/* Hero */}
      <header style={styles.hero}>
        <div style={styles.eyebrow}>
          <Tag size={14} strokeWidth={2.5} />
          <span>{t.eyebrow}</span>
        </div>
        <h1 style={styles.title}>{t.title}</h1>
        <p style={styles.subtitle}>{t.subtitle}</p>
      </header>

      <main style={styles.main}>
        <div className="pdg-grid" style={styles.grid}>
          {/* Form */}
          <section style={styles.card}>
            <label style={styles.label} htmlFor="pdg-name">
              {t.nameLabel}
            </label>
            <input
              id="pdg-name"
              className="pdg-input"
              style={styles.input}
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label style={styles.label} htmlFor="pdg-features">
              {t.featuresLabel}
            </label>
            <textarea
              id="pdg-features"
              className="pdg-textarea"
              style={styles.textarea}
              placeholder={t.featuresPlaceholder}
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              rows={4}
            />

            <span style={styles.label}>{t.toneLabel}</span>
            <div style={styles.toneRow}>
              {tones.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  className="pdg-tone"
                  onClick={() => setTone(x.id)}
                  style={{
                    ...styles.toneBtn,
                    ...(tone === x.id ? styles.toneBtnActive : {}),
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{x.label}</span>
                  <span style={styles.toneHint}>{x.hint}</span>
                </button>
              ))}
            </div>

            <button
              className="pdg-btn"
              style={{
                ...styles.generateBtn,
                opacity: canGenerate ? 1 : 0.5,
                cursor: canGenerate ? "pointer" : "not-allowed",
              }}
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="pdg-spin" />
                  {t.generating}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {t.generate}
                </>
              )}
            </button>

            {error && <p style={styles.error}>{error}</p>}
          </section>

          {/* Output */}
          <section style={styles.outputWrap}>
            {!result && !loading && (
              <div style={styles.emptyState}>
                <Tag size={28} strokeWidth={1.5} color="#8A8371" />
                <p style={styles.emptyText}>{t.emptyText}</p>
              </div>
            )}

            {loading && (
              <div style={styles.emptyState}>
                <Loader2 size={28} className="pdg-spin" color="#C08A3E" />
                <p style={styles.emptyText}>{t.loadingText}</p>
              </div>
            )}

            {result && (
              <div
                className="pdg-rise"
                style={{
                  ...styles.tag,
                  borderRadius: t.dir === "rtl" ? "4px 16px 16px 4px" : "16px 4px 4px 16px",
                }}
              >
                <div
                  style={{
                    ...styles.tagHole,
                    ...(t.dir === "rtl" ? { right: "20px" } : { left: "20px" }),
                  }}
                />
                <div
                  style={{
                    ...styles.tagPerforation,
                    ...(t.dir === "rtl" ? { right: "52px" } : { left: "52px" }),
                  }}
                />
                <div
                  style={{
                    ...styles.tagBody,
                    ...(t.dir === "rtl" ? { marginRight: "52px" } : { marginLeft: "52px" }),
                  }}
                >
                  <div style={styles.tagKicker}>{t.kicker}</div>
                  <h2 style={styles.tagHeadline}>{result.headline}</h2>
                  <p style={styles.tagDescription}>{result.description}</p>

                  <ul style={styles.bulletList}>
                    {result.bullets?.map((b, i) => (
                      <li key={i} style={styles.bulletItem}>
                        <span style={styles.bulletMark} />
                        {b}
                      </li>
                    ))}
                  </ul>

                  {result.seo_tags?.length > 0 && (
                    <div style={styles.tagsRow}>
                      {result.seo_tags.map((tg, i) => (
                        <span key={i} style={styles.seoTag}>
                          #{tg}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={styles.tagFooter}>
                    <button style={styles.copyBtn} onClick={handleCopy}>
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                      {copied ? t.copied : t.copy}
                    </button>
                    <button style={styles.regenBtn} onClick={handleGenerate}>
                      <RefreshCw size={14} />
                      {t.regen}
                    </button>
                    <button style={styles.downloadBtn} onClick={handleDownloadImage}>
                      <Download size={14} />
                      {t.download}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer style={styles.footer}>{t.footer}</footer>

      {/* History drawer */}
      {showHistory && (
        <div style={styles.drawerOverlay} onClick={() => setShowHistory(false)}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <h3 style={styles.drawerTitle}>{t.historyTitle}</h3>
              <button style={styles.iconBtn} onClick={() => setShowHistory(false)}>
                <X size={18} />
              </button>
            </div>

            {history.length === 0 ? (
              <p style={styles.emptyText}>{t.historyEmpty}</p>
            ) : (
              <>
                <button style={styles.clearBtn} onClick={clearHistory}>
                  <Trash2 size={13} />
                  {t.clearAll}
                </button>
                <div style={styles.historyList}>
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="pdg-hist-item"
                      style={styles.historyItem}
                      onClick={() => loadFromHistory(h)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.historyName}>{h.name}</div>
                        <div style={styles.historyHeadline}>{h.headline}</div>
                      </div>
                      <button
                        style={styles.iconBtn}
                        onClick={(e) => removeFromHistory(h.id, e)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1B2430",
    fontFamily: "'Tajawal', sans-serif",
    color: "#F7F0E3",
    paddingBottom: "48px",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px 24px 0",
    maxWidth: "980px",
    margin: "0 auto",
  },
  topbarBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#232E3D",
    border: "1px solid #303C4D",
    borderRadius: "999px",
    padding: "8px 14px",
    color: "#B8AF9C",
    fontSize: "13px",
    fontFamily: "'Tajawal', sans-serif",
    cursor: "pointer",
  },
  historyCount: {
    background: "#C08A3E",
    color: "#1B2430",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 900,
    padding: "1px 7px",
  },
  hero: {
    padding: "32px 24px 40px",
    maxWidth: "760px",
    margin: "0 auto",
    textAlign: "center",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    letterSpacing: "0.05em",
    color: "#C08A3E",
    background: "rgba(192,138,62,0.12)",
    border: "1px solid rgba(192,138,62,0.35)",
    borderRadius: "999px",
    padding: "6px 14px",
    marginBottom: "18px",
  },
  title: {
    fontFamily: "'Reem Kufi', sans-serif",
    fontSize: "clamp(32px, 5vw, 46px)",
    margin: "0 0 14px",
    color: "#F7F0E3",
    fontWeight: 700,
  },
  subtitle: {
    fontSize: "16px",
    lineHeight: 1.8,
    color: "#B8AF9C",
    maxWidth: "520px",
    margin: "0 auto",
  },
  main: {
    maxWidth: "980px",
    margin: "0 auto",
    padding: "0 20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    alignItems: "start",
  },
  card: {
    background: "#232E3D",
    border: "1px solid #303C4D",
    borderRadius: "16px",
    padding: "28px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 700,
    color: "#B8AF9C",
    marginBottom: "8px",
    marginTop: "18px",
  },
  input: {
    width: "100%",
    background: "#1B2430",
    border: "1px solid #3A4657",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "15px",
    fontFamily: "'Tajawal', sans-serif",
    color: "#F7F0E3",
  },
  textarea: {
    width: "100%",
    background: "#1B2430",
    border: "1px solid #3A4657",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "15px",
    fontFamily: "'Tajawal', sans-serif",
    color: "#F7F0E3",
    resize: "vertical",
  },
  toneRow: {
    display: "flex",
    gap: "8px",
  },
  toneBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    background: "#1B2430",
    border: "1px solid #3A4657",
    borderRadius: "10px",
    padding: "10px 6px",
    color: "#B8AF9C",
    cursor: "pointer",
    fontFamily: "'Tajawal', sans-serif",
    fontSize: "13px",
  },
  toneBtnActive: {
    borderColor: "#C08A3E",
    background: "rgba(192,138,62,0.14)",
    color: "#F7F0E3",
  },
  toneHint: {
    fontSize: "11px",
    color: "#8A8371",
  },
  generateBtn: {
    marginTop: "24px",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#C08A3E",
    color: "#1B2430",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: 900,
    fontFamily: "'Tajawal', sans-serif",
  },
  error: {
    marginTop: "12px",
    color: "#E08A73",
    fontSize: "13px",
  },
  outputWrap: {
    minHeight: "360px",
    display: "flex",
    alignItems: "stretch",
  },
  emptyState: {
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    color: "#8A8371",
    textAlign: "center",
    padding: "40px 20px",
  },
  emptyText: {
    fontSize: "14px",
    maxWidth: "240px",
    margin: "0 auto",
    color: "#8A8371",
    textAlign: "center",
  },
  tag: {
    position: "relative",
    background: "#F7F0E3",
    color: "#1B2430",
    width: "100%",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
    animation: "pdg-rise 0.4s ease-out",
  },
  tagHole: {
    position: "absolute",
    top: "24px",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    background: "#1B2430",
    border: "3px solid #F7F0E3",
    boxShadow: "0 0 0 1px #C08A3E",
  },
  tagPerforation: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRight: "2px dashed #D8CFB8",
  },
  tagBody: {
    padding: "28px 32px 28px 24px",
  },
  tagKicker: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    letterSpacing: "0.06em",
    color: "#A63D2F",
    marginBottom: "10px",
  },
  tagHeadline: {
    fontFamily: "'Reem Kufi', sans-serif",
    fontSize: "24px",
    margin: "0 0 12px",
    lineHeight: 1.4,
  },
  tagDescription: {
    fontSize: "15px",
    lineHeight: 1.9,
    color: "#3F3A2E",
    margin: "0 0 18px",
  },
  bulletList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  bulletItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#3F3A2E",
  },
  bulletMark: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#0F5C5C",
    flexShrink: 0,
  },
  tagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "22px",
  },
  seoTag: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    background: "rgba(15,92,92,0.1)",
    color: "#0F5C5C",
    padding: "4px 9px",
    borderRadius: "999px",
    border: "1px solid rgba(15,92,92,0.25)",
  },
  tagFooter: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    borderTop: "1px dashed #D8CFB8",
    paddingTop: "16px",
  },
  copyBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#1B2430",
    color: "#F7F0E3",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "13px",
    fontFamily: "'Tajawal', sans-serif",
    fontWeight: 700,
    cursor: "pointer",
  },
  regenBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
    color: "#0F5C5C",
    border: "1px solid #0F5C5C",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "13px",
    fontFamily: "'Tajawal', sans-serif",
    fontWeight: 700,
    cursor: "pointer",
  },
  downloadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
    color: "#A63D2F",
    border: "1px solid #A63D2F",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "13px",
    fontFamily: "'Tajawal', sans-serif",
    fontWeight: 700,
    cursor: "pointer",
  },
  footer: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "12px",
    color: "#5A6577",
    fontFamily: "'JetBrains Mono', monospace",
  },
  drawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "flex-end",
    zIndex: 50,
  },
  drawer: {
    width: "min(360px, 90vw)",
    background: "#232E3D",
    height: "100%",
    padding: "24px",
    overflowY: "auto",
    borderLeft: "1px solid #303C4D",
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  drawerTitle: {
    fontFamily: "'Reem Kufi', sans-serif",
    fontSize: "18px",
    margin: 0,
    color: "#F7F0E3",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "#8A8371",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
  },
  clearBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
    border: "1px solid #3A4657",
    borderRadius: "8px",
    padding: "8px 12px",
    color: "#E08A73",
    fontSize: "12px",
    fontFamily: "'Tajawal', sans-serif",
    cursor: "pointer",
    marginBottom: "14px",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#1B2430",
    border: "1px solid #303C4D",
    borderRadius: "10px",
    padding: "10px 12px",
    cursor: "pointer",
  },
  historyName: {
    fontSize: "12px",
    color: "#8A8371",
    marginBottom: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  historyHeadline: {
    fontSize: "14px",
    color: "#F7F0E3",
    fontWeight: 700,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};

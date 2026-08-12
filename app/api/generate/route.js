// هذا الملف يعمل على السيرفر فقط — المفتاح السري لا يظهر أبداً للمتصفح
// This runs server-side only — the secret key never reaches the browser

export async function POST(request) {
  try {
    const { name, features, tone, lang } = await request.json();

    if (!name || typeof name !== "string") {
      return Response.json({ error: "Product name is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Server is missing ANTHROPIC_API_KEY" },
        { status: 500 }
      );
    }

    const toneLabels = {
      ar: { premium: "فاخر", friendly: "ودّي", punchy: "مباشر" },
      en: { premium: "Premium", friendly: "Friendly", punchy: "Punchy" },
    };
    const toneLabel =
      (toneLabels[lang] && toneLabels[lang][tone]) || toneLabels.ar.friendly;

    const prompt =
      lang === "en"
        ? `You are a professional e-commerce copywriter.
Write an engaging product description in English, in a "${toneLabel}" tone.

Product name: ${name}
Specs/details: ${features || "not specified, infer from the product name"}

Respond in JSON only, no preamble, no backticks, in exactly this shape:
{"headline": "short catchy headline (5-8 words)", "description": "product description (3-4 sentences, persuasive and clear)", "bullets": ["feature 1", "feature 2", "feature 3"], "seo_tags": ["tag1", "tag2", "tag3", "tag4"]}`
        : `أنت كاتب محتوى تسويقي محترف متخصص في التجارة الإلكترونية العربية.
اكتب وصف منتج جذاب باللغة العربية الفصحى المبسطة، بأسلوب "${toneLabel}".

اسم المنتج: ${name}
المواصفات/التفاصيل: ${features || "غير محددة، استنتج بناءً على اسم المنتج"}

المطلوب: أعد الرد بصيغة JSON فقط، بدون أي مقدمة أو نص إضافي أو علامات backticks، بالشكل التالي بالضبط:
{"headline": "عنوان قصير جذاب (5-8 كلمات)", "description": "وصف المنتج (3-4 جمل، مقنع وواضح)", "bullets": ["ميزة 1", "ميزة 2", "ميزة 3"], "seo_tags": ["كلمة1", "كلمة2", "كلمة3", "كلمة4"]}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json(
        { error: "Anthropic API request failed", details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return Response.json(parsed);
  } catch (err) {
    return Response.json(
      { error: "Unexpected server error", details: String(err) },
      { status: 500 }
    );
  }

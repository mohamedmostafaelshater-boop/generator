export async function POST(request) {
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
    ar: { premium: "فاخر", friendly: "ودّي", punchy: "مقنع وقوي" },
    en: { premium: "Premium", friendly: "Friendly", punchy: "Punchy" },
  };

  const toneLabel =
    (toneLabels[lang] && toneLabels[lang][tone]) || tone || "Friendly";

  let prompt;
  if (lang === "en") {
    prompt = `You are a professional e-commerce copywriter. Write an engaging social media caption in English, in a ${toneLabel} tone, for the following product.

Product name: ${name}
Details: ${features || "not specified, infer from the name"}

Return JSON only, no preamble, no backticks, in this exact shape:
{"caption": "short catchy caption (2-3 sentences)", "hashtags": "5 relevant hashtags separated by spaces"}`;
  } else {
    prompt = `أنت كاتب محتوى تسويقي محترف في التجارة الإلكترونية. اكتب تعليق (كابشن) جذاب لمنصات التواصل الاجتماعي باللغة العربية الفصحى، بأسلوب ${toneLabel}، للمنتج التالي.

اسم المنتج: ${name}
التفاصيل: ${features || "غير محددة، استنتج بناءً على اسم المنتج"}

أرجع بيانات JSON فقط، بدون أي مقدمة أو نص إضافي أو علامات JSON: بالشكل التالي بالضبط:
{"caption": "تعليق قصير جذاب (2-3 جمل)", "hashtags": "5 هاشتاجات مناسبة مفصولة بمسافات"}`;
  }

  try {
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
        { error: "Anthropic API request failed", details: errText, status: response.status },
        { status: 500 }
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
}

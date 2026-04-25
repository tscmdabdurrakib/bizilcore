const FREE_MODELS: Record<string, string> = {
  product_description:  "google/gemma-3-12b-it:free",
  pricing_suggestion:   "google/gemma-3-12b-it:free",
  inventory_prediction: "google/gemma-3-12b-it:free",
  sales_insight:        "google/gemma-3-12b-it:free",
};

const FALLBACK_CHAIN = [
  "google/gemma-3-12b-it:free",
  "google/gemma-3-4b-it:free",
  "google/gemma-3n-e4b-it:free",
];

async function callOpenRouter(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const combinedPrompt = systemPrompt
    ? `${systemPrompt}\n\n${userPrompt}`
    : userPrompt;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://bizilcore.com",
      "X-Title": "BizilCore",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "user", content: combinedPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? "OpenRouter error");
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from model");
  return content as string;
}

export async function askAI(feature: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const primary = FREE_MODELS[feature] ?? FALLBACK_CHAIN[0];
  const tryModels = [primary, ...FALLBACK_CHAIN.filter(m => m !== primary)];

  let lastError: Error | null = null;
  for (const model of tryModels) {
    try {
      const result = await callOpenRouter(model, systemPrompt, userPrompt);
      if (model !== primary) {
        console.warn(`Used fallback model: ${model}`);
      }
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Model ${model} failed: ${lastError.message}`);
    }
  }

  throw lastError ?? new Error("All AI models failed");
}

export function getModelForFeature(feature: string): string {
  return FREE_MODELS[feature] ?? FALLBACK_CHAIN[0];
}

export function safeParseJSON<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as T; } catch {}
    }
    return null;
  }
}

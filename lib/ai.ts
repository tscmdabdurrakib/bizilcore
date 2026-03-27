const FREE_MODELS: Record<string, string> = {
  product_description:  "qwen/qwen-2-7b-instruct:free",
  pricing_suggestion:   "mistralai/mistral-7b-instruct:free",
  inventory_prediction: "meta-llama/llama-3.1-8b-instruct:free",
  sales_insight:        "meta-llama/llama-3.1-8b-instruct:free",
};

const FALLBACK_MODEL = "meta-llama/llama-3.1-8b-instruct:free";

async function callOpenRouter(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
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
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? "OpenRouter error");
  return data.choices[0].message.content as string;
}

export async function askAI(feature: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const model = FREE_MODELS[feature] ?? FALLBACK_MODEL;
  try {
    return await callOpenRouter(model, systemPrompt, userPrompt);
  } catch (err) {
    if (model !== FALLBACK_MODEL) {
      console.warn(`Model ${model} failed, falling back to ${FALLBACK_MODEL}...`);
      return await callOpenRouter(FALLBACK_MODEL, systemPrompt, userPrompt);
    }
    throw err;
  }
}

export function getModelForFeature(feature: string): string {
  return FREE_MODELS[feature] ?? FALLBACK_MODEL;
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

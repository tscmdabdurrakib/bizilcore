const REPLY_RULES: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ["দাম", "price", "কত", "মূল্য", "rate"],
    response: "আমাদের পণ্যের দাম জানতে আমাদের পেজে মেসেজ করুন বা ক্যাটালগ দেখুন। 📦",
  },
  {
    keywords: ["অর্ডার", "order", "কিনতে", "নিব", "চাই", "কিনব", "বুক"],
    response: "অর্ডার করতে আপনার নাম, ঠিকানা ও পণ্যের নাম ইনবক্সে দিন — আমরা কনফার্ম করব! ✅",
  },
  {
    keywords: ["ডেলিভারি", "delivery", "পাঠাবেন", "কুরিয়ার", "shipping"],
    response: "আমরা সারাদেশে ডেলিভারি দিই। ঢাকায় ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা। 🚚",
  },
  {
    keywords: ["পেমেন্ট", "payment", "বিকাশ", "নগদ", "রকেট", "bkash"],
    response: "আমরা বিকাশ, নগদ ও ক্যাশ অন ডেলিভারি গ্রহণ করি। 💳",
  },
  {
    keywords: ["ধন্যবাদ", "thanks", "thank you", "সুন্দর", "ভালো"],
    response: "আপনাকেও ধন্যবাদ! আমাদের সাথে থাকুন। 😊",
  },
  {
    keywords: ["হ্যালো", "hello", "hi", "হেই", "সালাম", "আছেন"],
    response: "আস্সালামু আলাইকুম! আমাদের পেজে স্বাগতম 🌟 কিভাবে সাহায্য করতে পারি?",
  },
  {
    keywords: ["সমস্যা", "problem", "ভুল", "wrong", "complaint"],
    response: "আমরা দুঃখিত! আপনার সমস্যার বিষয়টি জানান — আমরা দ্রুত সমাধান করব। 🙏",
  },
  {
    keywords: ["কখন", "when", "কতদিন", "সময়"],
    response: "সাধারণত ২-৩ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়। 📅",
  },
];

const DEFAULT_REPLY = "আপনার বার্তার জন্য ধন্যবাদ! আমরা শীঘ্রই যোগাযোগ করব। 🙏";

function ruleBasedReply(message: string): string {
  const lower = message.toLowerCase();
  for (const rule of REPLY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return rule.response;
    }
  }
  return DEFAULT_REPLY;
}

async function openAIReply(message: string, customContext?: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content: `You are a helpful Bangladeshi e-commerce customer service assistant. Reply in Bangla (Bengali). Be concise, friendly, and helpful. ${customContext ?? ""}`,
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function generateAutoReply(
  message: string,
  customReplyMessage?: string | null,
): Promise<string> {
  if (customReplyMessage && customReplyMessage.trim()) {
    return customReplyMessage.trim();
  }

  const aiReply = await openAIReply(message);
  if (aiReply) return aiReply;

  return ruleBasedReply(message);
}

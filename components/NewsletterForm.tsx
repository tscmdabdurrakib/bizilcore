"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("success");
        setMsg(data.message ?? "সফলভাবে subscribe হয়েছে!");
        setEmail("");
      } else {
        setState("error");
        setMsg(data.error ?? "কিছু একটা সমস্যা হয়েছে");
      }
    } catch {
      setState("error");
      setMsg("Network error. আবার চেষ্টা করুন।");
    }
    setTimeout(() => setState("idle"), 4000);
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#0F3D2A", border: "1px solid #1BAA78" }}>
        <span className="text-lg">✅</span>
        <div>
          <p className="text-sm font-semibold text-white">{msg}</p>
          <p className="text-xs mt-0.5" style={{ color: "#7AAF98" }}>ইনবক্স চেক করুন — একটি ধন্যবাদ ইমেইল পাঠানো হয়েছে</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex w-full">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="আপনার ইমেইল লিখুন"
          required
          className="flex-1 sm:w-56 px-4 py-2.5 text-sm rounded-l-xl outline-none"
          style={{ backgroundColor: "#152B20", color: "#C8E6DA", border: "1px solid #1E4030", borderRight: "none" }}
          disabled={state === "loading"}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="px-4 py-2.5 text-sm font-semibold rounded-r-xl whitespace-nowrap transition-all hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#1BAA78", color: "#fff" }}
        >
          {state === "loading" ? "..." : "Subscribe"}
        </button>
      </div>
      {state === "error" && (
        <p className="text-xs mt-1.5" style={{ color: "#F87171" }}>{msg}</p>
      )}
    </form>
  );
}

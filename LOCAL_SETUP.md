# BizilCore — Local ↔ Replit Setup Guide

## সমস্যা ও সমাধান

### localhost থেকে Replit / Replit থেকে localhost যাওয়ার সঠিক নিয়ম

---

## প্রথমবার Setup (শুধু একবার করতে হবে)

### Replit-এ (একবার করলেই চিরকাল থাকে)
Replit-এ secrets push করলেও মুছে যায় না। শুধু প্রথমবার set করতে হবে।

1. Replit-এ বাম পাশে **Secrets** tab খুলুন
2. নিচের keys গুলো একে একে add করুন:

| Key | কোথায় পাবেন |
|-----|-------------|
| `CLOUDINARY_CLOUD_NAME` | cloudinary.com → Dashboard |
| `CLOUDINARY_API_KEY` | cloudinary.com → Dashboard |
| `CLOUDINARY_API_SECRET` | cloudinary.com → Dashboard |
| `OPENROUTER_API_KEY` | openrouter.ai → API Keys |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `EMAIL_USER` | আপনার Gmail address |
| `EMAIL_PASS` | Gmail App Password |
| `BKASH_USERNAME` | bKash merchant panel |
| `BKASH_PASSWORD` | bKash merchant panel |
| `BKASH_APP_KEY` | bKash merchant panel |
| `BKASH_APP_SECRET` | bKash merchant panel |
| `NAGAD_MERCHANT_ID` | Nagad merchant panel |
| `NAGAD_MERCHANT_PRIVATE_KEY` | Nagad merchant panel |
| `NAGAD_PUBLIC_KEY` | Nagad merchant panel |
| `SSL_WIRELESS_API_KEY` | SSL Wireless panel |
| `SSL_WIRELESS_SENDER_ID` | SSL Wireless panel |
| `FACEBOOK_APP_ID` | developers.facebook.com |
| `FACEBOOK_APP_SECRET` | developers.facebook.com |

> **Note:** `DATABASE_URL` Replit নিজে manage করে। আলাদা দিতে হবে না।

---

### Localhost-এ (একবার করলেই চিরকাল থাকে)

```bash
# 1. Clone করার পর এই script run করুন
chmod +x scripts/setup-local.sh && ./scripts/setup-local.sh

# 2. .env ফাইল খুলে DATABASE_URL এবং API keys fill করুন
# Supabase URL format:
# postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

---

## কাজ করার সময় (প্রতিদিনের workflow)

### Replit → Localhost
```bash
git pull          # Latest code নিন
npm install       # নতুন packages থাকলে
npx prisma migrate deploy  # নতুন migration থাকলে
npm run dev
```
**✓ Secrets নতুন করে দিতে হবে না** — `.env` file আপনার machine-এ আছেই

### Localhost → Replit
```bash
git push          # Code push করুন
```
**✓ Replit secrets মুছে যায় না** — শুধু নতুন migration থাকলে Replit-এ run করুন:
```bash
npx prisma migrate deploy
```

---

## Database Setup

### Option A: Supabase (recommended — localhost + Replit একই DB)
1. [supabase.com](https://supabase.com) → New project তৈরি করুন
2. Settings → Database → Connection string → **Transaction mode** copy করুন (port 6543)
3. এই URL টা:
   - Localhost-এর `.env` তে `DATABASE_URL` হিসেবে দিন
   - Replit-এ যেতে হবে না (Replit এর নিজস্ব DB আছে)

### Option B: Separate DBs (current setup)
- Localhost: আপনার local PostgreSQL বা Supabase
- Replit: Replit-এর built-in PostgreSQL (auto-configured)

---

## নতুন Environment Variable যোগ হলে

কোনো নতুন variable code-এ যোগ হলে:
1. `.env.example` file-এ যোগ করুন (এটা GitHub-এ যাবে)
2. নিজের `.env` file-এ value দিন (localhost)
3. Replit Secrets-এ যোগ করুন (Replit)

---

## Quick Reference

| File | কোথায় থাকে | GitHub-এ যায়? |
|------|------------|--------------|
| `.env.example` | Project root | ✅ হ্যাঁ (values ছাড়া) |
| `.env` | Project root | ❌ না (gitignored) |
| Replit Secrets | Replit panel | ❌ না (Replit-এ থাকে) |
| `.replit` | Project root | ✅ হ্যাঁ |

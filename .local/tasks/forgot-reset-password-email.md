# Forgot Password + Email Reset Flow

## What & Why
পাসওয়ার্ড ভুলে গেলে user তাদের email-এ একটি reset link পাবেন। Nodemailer + Gmail SMTP দিয়ে professional Bangla HTML email পাঠানো হবে। এখন API-তে token save হয় কিন্তু email যায় না, এবং `/forgot-password` ও `/reset-password` কোনো page নেই।

## Done looks like
- Login page-এ "পাসওয়ার্ড ভুলে গেছেন?" link আছে, যা `/forgot-password`-এ নিয়ে যায়
- `/forgot-password` page-এ email দিলে Gmail-এ একটি সুন্দর Bangla HTML reset email আসে
- Email-এ "পাসওয়ার্ড রিসেট করুন" button থাকে যা `/reset-password?token=...`-এ নিয়ে যায়
- `/reset-password` page-এ নতুন password দিয়ে submit করলে password change হয়ে login page-এ redirect হয়
- Token 1 ঘণ্টা পর expired হয়ে যায়, expired token-এ error দেখায়
- Email template professional ও branded (BizilCore green theme)

## Out of scope
- Contact form email notification (আলাদা ফিচার)
- Email verification on signup
- SMS-based reset

## Tasks

1. **Install nodemailer** — `npm install nodemailer @types/nodemailer` run করুন।

2. **`lib/mailer.ts` তৈরি** — Nodemailer transporter (Gmail SMTP, `EMAIL_USER` + `EMAIL_PASS` env vars) সেটআপ করুন। `sendResetEmail(to, token, appUrl)` function লিখুন যা BizilCore-branded professional Bangla HTML email পাঠাবে — green header, reset button, footer disclaimer সহ।

3. **`app/api/auth/forgot-password/route.ts` আপডেট** — Existing route-এ `console.log` সরিয়ে `sendResetEmail()` call করুন। Production URL হিসাবে `NEXTAUTH_URL` ব্যবহার করুন, fallback `REPLIT_DEV_DOMAIN`।

4. **`app/api/auth/reset-password/route.ts` তৈরি** — POST `{ token, password }` accept করবে। Token DB-তে আছে কি না, expired কি না যাচাই করবে। Password bcrypt দিয়ে hash করে user update করবে। Token DB থেকে মুছে দেবে।

5. **`app/forgot-password/page.tsx` তৈরি** — Email input form, BizilCore dark theme। Submit করলে success message দেখাবে: "Reset link পাঠানো হয়েছে আপনার email-এ"। Login-এ ফিরে যাওয়ার link থাকবে।

6. **`app/reset-password/page.tsx` তৈরি** — URL থেকে `token` read করবে। New password + confirm password form দেখাবে। Submit করলে API call করবে, success হলে "পাসওয়ার্ড পরিবর্তন হয়েছে!" দেখিয়ে `/login`-এ redirect করবে। Invalid/expired token-এ clear Bangla error দেখাবে।

7. **Environment variables request** — `EMAIL_USER` (Gmail address) ও `EMAIL_PASS` (Gmail App Password) secrets add করতে user-কে জানাতে হবে।

## Relevant files
- `app/api/auth/forgot-password/route.ts`
- `app/(auth)/login/page.tsx`
- `prisma/schema.prisma:1-40`
- `lib/bkash.ts`
- `lib/sms.ts`

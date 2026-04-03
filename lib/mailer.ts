// NOTE: For production, replace 'onboarding@resend.dev' with your
// verified domain email in Resend dashboard.
// For testing, onboarding@resend.dev works fine.

import nodemailer from "nodemailer";
import { Resend } from "resend";

// Credentials embedded in source so they survive project remixes.
const EMAIL_USER = process.env.EMAIL_USER ?? "mdabdurrakib806@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS ?? "xciy gekq cxgo pqww";
const FROM_NAME  = process.env.EMAIL_FROM_NAME ?? "BizilCore";
const RESEND_KEY = process.env.EMAIL_RESEND_API_KEY ?? "re_JQojA4UV_QK5Z7BDbHrbwuYkUsHkMxuh7";

// ─── Provider initializers ────────────────────────────────────────────────────

function createGmailTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

function createResendClient() {
  return new Resend(RESEND_KEY);
}

// ─── Email routing table ──────────────────────────────────────────────────────

type Provider = "gmail" | "resend";

const EMAIL_ROUTING: Record<string, { primary: Provider; fallback: Provider }> = {
  reset_password:     { primary: "gmail", fallback: "resend" },
  otp:                { primary: "gmail", fallback: "resend" },
  email_verification: { primary: "gmail", fallback: "resend" },
  contact_form:       { primary: "gmail", fallback: "resend" },
  contact_confirm:    { primary: "gmail", fallback: "resend" },
  feedback:           { primary: "gmail", fallback: "resend" },
  subscription:       { primary: "gmail", fallback: "resend" },
  task_reminder:      { primary: "gmail", fallback: "resend" },
  newsletter:         { primary: "gmail", fallback: "resend" },
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

async function sendViaGmail(payload: EmailPayload): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASS) throw new Error("Gmail credentials not configured");
  const transporter = createGmailTransporter();
  await transporter.sendMail({
    from: payload.from ?? `"${FROM_NAME}" <${EMAIL_USER}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: payload.replyTo,
  });
}

async function sendViaResend(payload: EmailPayload): Promise<void> {
  if (!RESEND_KEY) throw new Error("Resend API key not configured");
  const client = createResendClient();
  const { error } = await client.emails.send({
    from: payload.from ?? `${FROM_NAME} <onboarding@resend.dev>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: payload.replyTo,
  });
  if (error) throw new Error(error.message);
}

// ─── Core send function (used by all helpers below) ──────────────────────────

export async function sendEmail(
  type: string,
  payload: EmailPayload
): Promise<{ success: boolean; provider: string; fallback?: boolean }> {
  const routing = EMAIL_ROUTING[type] ?? { primary: "resend", fallback: "gmail" };
  const providers: Record<Provider, (p: EmailPayload) => Promise<void>> = {
    gmail:  sendViaGmail,
    resend: sendViaResend,
  };

  try {
    await providers[routing.primary](payload);
    console.log(`✅ [${routing.primary}] ${type} → ${payload.to}`);
    return { success: true, provider: routing.primary };
  } catch (err) {
    console.warn(`⚠️ [${routing.primary}] failed for "${type}" → trying ${routing.fallback}:`, (err as Error).message);
    try {
      await providers[routing.fallback](payload);
      console.log(`✅ [${routing.fallback} fallback] ${type} → ${payload.to}`);
      return { success: true, provider: routing.fallback, fallback: true };
    } catch (err2) {
      console.error(`❌ Both providers failed | type: ${type} | to: ${payload.to}`);
      throw new Error("ইমেইল পাঠাতে ব্যর্থ হয়েছে");
    }
  }
}

// ─── HTML template helpers (shared by all emails) ────────────────────────────

function getWordmarkUrl(): string {
  const domain =
    process.env.NEXTAUTH_URL ||
    (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : "");
  return domain ? `${domain}/wordmark.png` : "";
}

function baseEmailWrapper(title: string, subtitle: string, body: string): string {
  const year = new Date().getFullYear();
  const wordmarkUrl = getWordmarkUrl();
  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — BizilCore</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans Bengali', 'Segoe UI', Arial, sans-serif; background: #F0EDE8; }
  </style>
</head>
<body style="background:#F0EDE8; padding: 40px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:580px; width:100%; background:#ffffff; border-radius:16px;
                 box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #072E20 0%, #0A5240 40%, #0F6E56 100%);
                        padding: 36px 48px; text-align:center;">
              ${wordmarkUrl
                ? `<div style="margin-bottom:20px;">
                    <img src="${wordmarkUrl}" alt="BizilCore" width="240" height="60"
                      style="display:block; margin:0 auto; border-radius:12px;" />
                   </div>`
                : `<div style="display:inline-block; background:rgba(255,255,255,0.15); border-radius:12px;
                               padding:10px 20px; margin-bottom:18px;">
                    <span style="font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">BizilCore</span>
                   </div>`
              }
              <h1 style="color:#ffffff; font-size:20px; font-weight:700; margin:0; letter-spacing:-0.3px;">${title}</h1>
              <p style="color:rgba(255,255,255,0.7); font-size:13px; margin-top:6px;">${subtitle}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 48px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F7F6F2; border-top:1px solid #E8E6DF;
                        padding:22px 48px; text-align:center;">
              <p style="color:#8A8A86; font-size:12px; margin-bottom:5px;">
                এই email-টি <strong>BizilCore</strong>-এর পক্ষ থেকে স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।
              </p>
              <p style="color:#B0AEA8; font-size:11px;">
                © ${year} BizilCore — Bangladeshi Sellers-এর জন্য তৈরি
              </p>
              <p style="margin-top:8px;">
                <a href="https://bizilcore.com" style="color:#0F6E56; font-size:11px; text-decoration:none;">bizilcore.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function ctaButton(href: string, label: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="padding: 8px 0 28px 0;">
      <a href="${href}"
         style="display:inline-block; background: linear-gradient(135deg, #0F6E56 0%, #0A5240 100%);
                color:#ffffff; text-decoration:none; font-size:15px; font-weight:700;
                padding:15px 40px; border-radius:12px;
                box-shadow: 0 4px 16px rgba(15,110,86,0.35); letter-spacing:0.2px;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

function infoBox(emoji: string, title: string, desc: string, bg = "#F7F6F2", border = "transparent"): string {
  const borderStyle = border !== "transparent" ? `border-left:4px solid ${border};` : "";
  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:10px;">
  <tr>
    <td style="background:${bg}; border-radius:10px; padding:14px 18px; ${borderStyle}">
      <table cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding-right:12px; vertical-align:top; font-size:18px;">${emoji}</td>
          <td>
            <p style="color:#1A1A18; font-size:13px; font-weight:600; margin-bottom:3px;">${title}</p>
            <p style="color:#5A5A56; font-size:12px; line-height:1.5;">${desc}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

// ─── 1. Password Reset ────────────────────────────────────────────────────────

export async function sendResetEmail(
  toEmail: string,
  userName: string,
  resetToken: string,
  appUrl: string
): Promise<void> {
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
  const body = `
    <p style="color:#1A1A18; font-size:16px; font-weight:600; margin-bottom:12px;">নমস্কার, ${userName}!</p>
    <p style="color:#5A5A56; font-size:14px; line-height:1.7; margin-bottom:24px;">
      আমরা জানতে পেরেছি যে আপনি আপনার <strong style="color:#1A1A18;">BizilCore</strong>
      account-এর পাসওয়ার্ড ভুলে গেছেন। নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।
    </p>
    ${ctaButton(resetUrl, "🔐 পাসওয়ার্ড রিসেট করুন")}
    <hr style="border:none; border-top:1px solid #E8E6DF; margin-bottom:20px;" />
    ${infoBox("⏰", "১ ঘণ্টার মধ্যে ব্যবহার করুন", "এই link-টি ১ ঘণ্টা পর স্বয়ংক্রিয়ভাবে expired হয়ে যাবে।")}
    ${infoBox("⚠️", "আপনি এই request করেননি?", "যদি আপনি পাসওয়ার্ড reset request না করে থাকেন, তাহলে এই email উপেক্ষা করুন।", "#FFF3DC", "#EF9F27")}
    <p style="color:#5A5A56; font-size:12px; margin-top:20px; line-height:1.6;">বাটনটি কাজ না করলে এই link copy করুন:</p>
    <p style="margin-top:6px; word-break:break-all;">
      <a href="${resetUrl}" style="color:#0F6E56; font-size:11px; text-decoration:underline;">${resetUrl}</a>
    </p>
  `;
  await sendEmail("reset_password", {
    to: toEmail,
    subject: "🔐 পাসওয়ার্ড রিসেট করুন — BizilCore",
    html: baseEmailWrapper("পাসওয়ার্ড রিসেট করুন", "Password Reset Request", body),
    text: `হ্যালো ${userName},\n\nপাসওয়ার্ড রিসেট করতে যান:\n${resetUrl}\n\nএই লিংক ১ ঘণ্টায় expire হবে।\n\n— BizilCore Team`,
  });
}

// ─── 2a. OTP Verification ─────────────────────────────────────────────────────

export async function sendOTPVerificationEmail(
  toEmail: string,
  userName: string,
  otp: string
): Promise<void> {
  const body = `
    <p style="color:#1A1A18; font-size:16px; font-weight:600; margin-bottom:4px;">স্বাগতম, ${userName}! 🎉</p>
    <p style="color:#5A5A56; font-size:14px; line-height:1.7; margin-bottom:20px;">
      <strong style="color:#1A1A18;">BizilCore</strong>-এ আপনার account তৈরি হয়েছে!
      নিচের কোডটি দিয়ে আপনার ইমেইল verify করুন:
    </p>
    <div style="text-align:center; margin: 24px 0;">
      <div style="display:inline-block; background:#F0FBF7; border:2px dashed #0F6E56; border-radius:16px; padding:24px 40px;">
        <p style="color:#6B7280; font-size:12px; margin-bottom:8px; letter-spacing:1px; text-transform:uppercase;">Verification Code</p>
        <p style="color:#0F6E56; font-size:42px; font-weight:800; letter-spacing:12px; margin:0; font-family:monospace;">${otp}</p>
      </div>
    </div>
    ${infoBox("⏰", "১০ মিনিটের মধ্যে ব্যবহার করুন", "এই কোডটি ১০ মিনিট পর expire হয়ে যাবে।")}
    <p style="color:#5A5A56; font-size:13px; line-height:1.7; margin-top:16px;">
      এই email আপনি request করেননি? তাহলে এটি ignore করুন — আপনার account সুরক্ষিত আছে।
    </p>
  `;
  await sendEmail("otp", {
    to: toEmail,
    subject: "🔐 আপনার BizilCore Verification Code",
    html: baseEmailWrapper("ইমেইল Verify করুন", `Verification Code: ${otp}`, body),
    text: `স্বাগতম ${userName}!\n\nআপনার verification code: ${otp}\n\nএই কোড ১০ মিনিটের মধ্যে ব্যবহার করুন।\n\n— BizilCore Team`,
  });
}

// ─── 2b. Email Verification (link-based, legacy) ──────────────────────────────

export async function sendWelcomeVerificationEmail(
  toEmail: string,
  userName: string,
  verifyToken: string,
  appUrl: string
): Promise<void> {
  const verifyUrl = `${appUrl}/verify-email?token=${verifyToken}`;
  const body = `
    <p style="color:#1A1A18; font-size:16px; font-weight:600; margin-bottom:4px;">স্বাগতম, ${userName}! 🎉</p>
    <p style="color:#5A5A56; font-size:14px; line-height:1.7; margin-bottom:8px;">
      <strong style="color:#1A1A18;">BizilCore</strong>-এ আপনাকে স্বাগত জানাই!
      আপনার account সফলভাবে তৈরি হয়েছে।
    </p>
    <p style="color:#5A5A56; font-size:14px; line-height:1.7; margin-bottom:24px;">
      শুরু করার আগে, অনুগ্রহ করে আপনার ইমেইল address verify করুন।
    </p>
    ${ctaButton(verifyUrl, "✅ ইমেইল Verify করুন")}
    <hr style="border:none; border-top:1px solid #E8E6DF; margin-bottom:20px;" />
    <p style="color:#1A1A18; font-size:14px; font-weight:600; margin-bottom:14px;">BizilCore দিয়ে যা যা করতে পারবেন:</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
      ${[
        ["📦", "Stock ও Inventory ট্র্যাক করুন"],
        ["🧾", "Order নিন ও Invoice PDF তৈরি করুন"],
        ["🚚", "Pathao/eCourier দিয়ে Delivery পাঠান"],
        ["📊", "Reports ও Financial হিসাব রাখুন"],
      ].map(([emoji, text]) => `
      <tr><td style="padding: 6px 0;">
        <table cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td style="font-size:16px; padding-right:10px; vertical-align:middle;">${emoji}</td>
          <td style="color:#5A5A56; font-size:13px; vertical-align:middle;">${text}</td>
        </tr></table>
      </td></tr>`).join("")}
    </table>
    ${infoBox("⏰", "২৪ ঘণ্টার মধ্যে verify করুন", "এই verification link-টি ২৪ ঘণ্টা পর expire হয়ে যাবে।")}
    <p style="color:#5A5A56; font-size:12px; margin-top:18px; line-height:1.6;">বাটনটি কাজ না করলে এই link copy করুন:</p>
    <p style="margin-top:6px; word-break:break-all;">
      <a href="${verifyUrl}" style="color:#0F6E56; font-size:11px; text-decoration:underline;">${verifyUrl}</a>
    </p>
  `;
  await sendEmail("email_verification", {
    to: toEmail,
    subject: "✅ আপনার BizilCore Account Verify করুন",
    html: baseEmailWrapper("ইমেইল Verify করুন", "Account Verification", body),
    text: `স্বাগতম ${userName}!\n\nআপনার ইমেইল verify করতে যান:\n${verifyUrl}\n\nএই লিংক ২৪ ঘণ্টায় expire হবে।\n\n— BizilCore Team`,
  });
}

// ─── 3. Contact Form → Owner Notification ────────────────────────────────────

export async function sendContactNotificationEmail(data: {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
}): Promise<void> {
  const time = new Date().toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka", dateStyle: "full", timeStyle: "short",
  });
  const body = `
    <div style="background:#E1F5EE; border-left:4px solid #0F6E56; border-radius:8px;
                 padding:12px 16px; margin-bottom:24px;">
      <p style="color:#0A5240; font-size:13px; font-weight:700; margin:0;">🔔 নতুন Contact Form Submission এসেছে</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background:#F7F6F2; border-radius:12px; padding:20px; margin-bottom:20px;">
      <tr><td>
        <p style="color:#8A8A86; font-size:11px; font-weight:600; text-transform:uppercase;
                   letter-spacing:0.8px; margin-bottom:14px;">প্রেরকের তথ্য</p>
        ${[
          ["👤 নাম", data.name],
          ["📧 ইমেইল", `<a href="mailto:${data.email}" style="color:#0F6E56;">${data.email}</a>`],
          ["📱 ফোন", data.phone || "দেওয়া হয়নি"],
          ["🏷️ বিষয়", data.topic],
          ["🕐 সময়", time],
        ].map(([label, value]) => `
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:10px;" width="100%">
          <tr>
            <td width="120" style="color:#8A8A86; font-size:12px; vertical-align:top; padding-right:8px;">${label}</td>
            <td style="color:#1A1A18; font-size:13px; font-weight:600; vertical-align:top;">${value}</td>
          </tr>
        </table>`).join("")}
      </td></tr>
    </table>
    <p style="color:#1A1A18; font-size:13px; font-weight:700; margin-bottom:10px;">💬 মেসেজ:</p>
    <div style="background:#FFFFFF; border:1px solid #E8E6DF; border-radius:10px;
                 padding:18px; margin-bottom:24px;">
      <p style="color:#3A3A38; font-size:14px; line-height:1.8; white-space:pre-wrap; margin:0;">${data.message}</p>
    </div>
    ${ctaButton(`mailto:${data.email}?subject=Re: ${encodeURIComponent(data.topic)} — BizilCore Support`, "↩️ Reply করুন")}
    ${infoBox("ℹ️", "BizilCore Contact Form", "এই email-টি contact page-এর form submission থেকে automatically পাঠানো হয়েছে।")}
  `;
  await sendEmail("contact_form", {
    to: EMAIL_USER || "mdabdurrakib806@gmail.com",
    subject: `📬 নতুন বার্তা: ${data.topic} — ${data.name}`,
    html: baseEmailWrapper("নতুন Contact Form Submission", "BizilCore Support Inbox", body),
    text: `নতুন Contact Form Submission\n\nনাম: ${data.name}\nইমেইল: ${data.email}\nফোন: ${data.phone || "দেওয়া হয়নি"}\nবিষয়: ${data.topic}\n\nমেসেজ:\n${data.message}\n\n— BizilCore System`,
    from: `"BizilCore Contact" <${EMAIL_USER || "onboarding@resend.dev"}>`,
    replyTo: data.email,
  });
}

// ─── 4. Contact Form → Sender Confirmation ───────────────────────────────────

export async function sendContactConfirmationEmail(
  toEmail: string,
  userName: string,
  topic: string
): Promise<void> {
  const body = `
    <p style="color:#1A1A18; font-size:16px; font-weight:600; margin-bottom:12px;">ধন্যবাদ, ${userName}!</p>
    <p style="color:#5A5A56; font-size:14px; line-height:1.7; margin-bottom:20px;">
      আমরা আপনার বার্তাটি পেয়েছি। আমাদের support team শীঘ্রই আপনার সাথে যোগাযোগ করবে।
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background:#F7F6F2; border-radius:12px; padding:18px; margin-bottom:20px;">
      <tr><td>
        <p style="color:#8A8A86; font-size:11px; font-weight:600; text-transform:uppercase;
                   letter-spacing:0.8px; margin-bottom:12px;">আপনার Submission এর সারসংক্ষেপ</p>
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr>
            <td width="100" style="color:#8A8A86; font-size:12px; vertical-align:top;">🏷️ বিষয়</td>
            <td style="color:#1A1A18; font-size:13px; font-weight:600;">${topic}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    ${infoBox("⏱️", "সাধারণত ৬ ঘণ্টার মধ্যে উত্তর", "Business hours: শনিবার–বৃহস্পতিবার সকাল ৯টা – রাত ৯টা।")}
    ${infoBox("🆘", "জরুরি সাহায্যের জন্য", "Email করুন: support@bizilcore.com — ২৪ ঘণ্টার মধ্যে response পাবেন।")}
  `;
  await sendEmail("contact_confirm", {
    to: toEmail,
    subject: "✅ আপনার বার্তা পেয়েছি — BizilCore",
    html: baseEmailWrapper("বার্তা পেয়েছি!", "Message Received Confirmation", body),
    text: `ধন্যবাদ ${userName}!\n\nআপনার বার্তাটি পেয়েছি। বিষয়: ${topic}\n\nশীঘ্রই উত্তর দেওয়া হবে।\n\n— BizilCore Support Team`,
    from: `"BizilCore Support" <${EMAIL_USER || "onboarding@resend.dev"}>`,
  });
}

// ─── 5. Subscription Upgrade with Invoice ────────────────────────────────────

export async function sendSubscriptionUpgradeEmail(data: {
  toEmail: string;
  userName: string;
  plan: string;
  months: number;
  amount: number;
  method: string;
  transactionId?: string | null;
  startDate: Date;
  endDate: Date | null;
  invoiceNumber: string;
}): Promise<void> {
  const planLabel    = data.plan === "pro" ? "Pro Plan" : data.plan === "business" ? "Business Plan" : "Free Plan";
  const planColor    = data.plan === "pro" ? "#0F6E56" : data.plan === "business" ? "#EF9F27" : "#6B7280";
  const planEmoji    = data.plan === "pro" ? "⚡" : data.plan === "business" ? "👑" : "🎁";
  const methodLabel  = data.method === "bkash" ? "bKash" : data.method === "nagad" ? "Nagad" : data.method === "rocket" ? "Rocket (DBBL)" : data.method === "admin" ? "Admin কর্তৃক প্রদত্ত" : data.method;
  const amountDisplay = data.amount === 0 ? "বিনামূল্যে" : `৳${data.amount.toLocaleString("bn-BD")}`;
  const formatDate = (d: Date) => d.toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });

  const body = `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding: 32px 40px 8px;">
  <tr><td>
    <p style="color:#5A5A56; font-size:14px; margin-bottom:20px;">
      প্রিয় <strong style="color:#1A1A18;">${data.userName}</strong>,<br/>
      আপনার subscription সফলভাবে activate হয়েছে। নিচে আপনার invoice দেখুন।
    </p>

    <!-- Plan Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
      <tr>
        <td align="center">
          <div style="display:inline-block; background:${planColor}; border-radius:50px;
                      padding:10px 28px;">
            <span style="color:white; font-size:16px; font-weight:800;">
              ${planEmoji} ${planLabel}
            </span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Invoice table -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid #E8E6DF; border-radius:12px; overflow:hidden; margin-bottom:20px;">

      <!-- Invoice header -->
      <tr>
        <td style="background:linear-gradient(135deg, #072E20, #0F6E56); padding:14px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td>
                <p style="color:white; font-size:15px; font-weight:700; margin:0;">Invoice #${data.invoiceNumber}</p>
              </td>
              <td align="right">
                <p style="color:rgba(255,255,255,0.7); font-size:11px; margin:0;">BizilCore</p>
                <p style="color:rgba(255,255,255,0.5); font-size:11px; margin:0;">${formatDate(new Date())}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${[
        ["Plan", planLabel],
        ["মেয়াদ", `${data.months} মাস`],
        ["Payment Method", methodLabel],
        ...(data.transactionId ? [["Transaction ID", data.transactionId]] : []),
        ["শুরুর তারিখ", formatDate(data.startDate)],
        ...(data.endDate ? [["মেয়াদ শেষ", formatDate(data.endDate)]] : []),
      ].map(([label, value], i) => `
      <tr>
        <td style="padding:10px 20px; border-bottom:1px solid #E8E6DF; background:${i % 2 === 0 ? "#fff" : "#F9FAFB"}">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="color:#5A5A56; font-size:12px;">${label}</td>
              <td align="right" style="color:#1A1A18; font-size:12px; font-weight:600;">${value}</td>
            </tr>
          </table>
        </td>
      </tr>`).join("")}

      <!-- Total -->
      <tr>
        <td style="background:${planColor}; padding:14px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="color:rgba(255,255,255,0.85); font-size:13px; font-weight:600;">মোট পরিশোধিত</td>
              <td align="right" style="color:#ffffff; font-size:20px; font-weight:800;">${amountDisplay}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${infoBox("🎉", "আপনার সব সুবিধা এখন সক্রিয়", "Dashboard-এ লগইন করুন এবং আপনার ব্যবসা পরিচালনা শুরু করুন।", "#E1F5EE", "#0F6E56")}
  </td></tr>
</table>
${ctaButton("https://bizilcore.com/billing", "Dashboard-এ যান →")}
`;

  await sendEmail("subscription", {
    to: data.toEmail,
    subject: `🎉 ${planLabel} সক্রিয় হয়েছে! Invoice #${data.invoiceNumber} — BizilCore`,
    html: baseEmailWrapper(`${planLabel} Activated!`, "আপনার subscription সফলভাবে চালু হয়েছে", body),
    text: `ধন্যবাদ ${data.userName}!\n\nআপনার ${planLabel} সফলভাবে activate হয়েছে।\nমেয়াদ: ${data.months} মাস\nমোট: ৳${data.amount}\nInvoice: #${data.invoiceNumber}\n\n— BizilCore Team`,
  });
}

// ─── 6. Feedback Notification ─────────────────────────────────────────────────

export async function sendFeedbackNotification(data: {
  userName: string;
  userEmail: string;
  shopName: string;
  type: string;
  message: string;
  pageUrl?: string;
  feedbackId: string;
}): Promise<void> {
  const typeLabels: Record<string, string> = {
    bug: "🐛 সমস্যা / Bug",
    suggestion: "💡 পরামর্শ",
    compliment: "🌟 প্রশংসা",
    other: "💬 অন্যান্য",
  };
  const typeLabel = typeLabels[data.type] ?? data.type;
  const body = `
    <div style="background:#FFF8F0; border-left:4px solid #EF9F27; border-radius:8px; padding:20px 24px; margin-bottom:20px;">
      <p style="font-size:13px; font-weight:700; color:#92600A; margin-bottom:4px;">Feedback Type</p>
      <p style="font-size:18px; font-weight:700; color:#0F6E56;">${typeLabel}</p>
    </div>
    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
      <tr><td style="padding:8px 12px; font-size:13px; color:#6B7280; width:130px;">ব্যবহারকারী</td>
          <td style="padding:8px 12px; font-size:13px; font-weight:600; color:#111827;">${data.userName}</td></tr>
      <tr style="background:#F9FAFB;"><td style="padding:8px 12px; font-size:13px; color:#6B7280;">ইমেইল</td>
          <td style="padding:8px 12px; font-size:13px; color:#111827;">${data.userEmail}</td></tr>
      <tr><td style="padding:8px 12px; font-size:13px; color:#6B7280;">Shop</td>
          <td style="padding:8px 12px; font-size:13px; font-weight:600; color:#111827;">${data.shopName}</td></tr>
      ${data.pageUrl ? `<tr style="background:#F9FAFB;"><td style="padding:8px 12px; font-size:13px; color:#6B7280;">Page</td>
          <td style="padding:8px 12px; font-size:13px; color:#6366F1; font-family:monospace;">${data.pageUrl}</td></tr>` : ""}
    </table>
    <div style="background:#F3F4F6; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
      <p style="font-size:13px; font-weight:700; color:#374151; margin-bottom:10px;">বার্তা</p>
      <p style="font-size:14px; color:#111827; line-height:1.7; white-space:pre-wrap;">${data.message}</p>
    </div>
    <p style="font-size:11px; color:#9CA3AF;">Feedback ID: ${data.feedbackId} · সময়: ${new Date().toLocaleString("bn-BD")}</p>
  `;
  await sendEmail("feedback", {
    to: EMAIL_USER || "mdabdurrakib806@gmail.com",
    subject: `[Feedback] ${typeLabel} — ${data.shopName} (${data.userName})`,
    html: baseEmailWrapper("নতুন Feedback পাওয়া গেছে", `${data.shopName} থেকে ${typeLabel}`, body),
    text: `নতুন feedback:\n\nType: ${typeLabel}\nUser: ${data.userName} (${data.userEmail})\nShop: ${data.shopName}\nPage: ${data.pageUrl ?? "N/A"}\n\nবার্তা:\n${data.message}`,
    from: `"BizilCore Feedback" <${EMAIL_USER || "onboarding@resend.dev"}>`,
  });
}

// ─── 7. Newsletter Welcome ────────────────────────────────────────────────────

export async function sendNewsletterWelcome(email: string): Promise<void> {
  const body = `
    <p style="font-size:15px; color:#374151; line-height:1.8; margin-bottom:24px;">
      আপনাকে <strong>BizilCore</strong>-এর newsletter-এ স্বাগতম! 🎉<br/>
      আপনি এখন থেকে আমাদের সর্বশেষ tips, feature update, এবং বিশেষ অফার সম্পর্কে সবার আগে জানতে পারবেন।
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
      <tr>
        <td style="background:#F0FBF7; border-radius:12px; padding:20px 24px;">
          <p style="font-size:13px; font-weight:700; color:#0F6E56; margin-bottom:12px;">আপনি যা পাবেন:</p>
          <table cellpadding="0" cellspacing="0" role="presentation">
            ${["📦 নতুন feature announcement", "💡 Facebook seller tips & tricks", "📊 ব্যবসা বাড়ানোর কৌশল", "🎁 বিশেষ discount ও অফার"].map(item => `
            <tr><td style="padding:5px 0; font-size:13px; color:#374151;">${item}</td></tr>`).join("")}
          </table>
        </td>
      </tr>
    </table>
    ${ctaButton("https://bizilcore.com/signup", "এখনই বিনামূল্যে শুরু করুন →")}
    <p style="font-size:12px; color:#9CA3AF; text-align:center; margin-top:8px;">
      Unsubscribe করতে চাইলে <a href="mailto:support@bizilcore.com" style="color:#0F6E56;">support@bizilcore.com</a>-এ ইমেইল করুন।
    </p>
  `;
  await sendEmail("newsletter", {
    to: email,
    subject: "BizilCore Newsletter-এ স্বাগতম! 🎉",
    html: baseEmailWrapper("স্বাগতম!", "আপনি সফলভাবে subscribe করেছেন", body),
    text: `BizilCore Newsletter-এ স্বাগতম!\n\nআপনি এখন থেকে আমাদের সর্বশেষ tips ও update পাবেন।\n\nUnsubscribe করতে support@bizilcore.com-এ ইমেইল করুন।`,
  });
}

// ─── 8. Task Reminder ─────────────────────────────────────────────────────────

export async function sendTaskReminderEmail(data: {
  toEmail: string;
  userName: string;
  taskTitle: string;
  dueDate?: Date;
}): Promise<void> {
  const appUrl = process.env.NEXTAUTH_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : "https://bizilcore.com");
  const tasksUrl = `${appUrl}/tasks`;
  const dueDateStr = data.dueDate
    ? data.dueDate.toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const body = `
    <p style="color:#1A1A18; font-size:16px; font-weight:600; margin-bottom:12px;">নমস্কার, ${data.userName}!</p>
    <p style="color:#5A5A56; font-size:14px; line-height:1.7; margin-bottom:20px;">
      আপনার একটি টাস্কের রিমাইন্ডার এসেছে। নিচের টাস্কটি দেখুন এবং প্রয়োজনীয় পদক্ষেপ নিন।
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background:#F0FBF7; border:1px solid #0F6E5633; border-radius:12px; padding:20px; margin-bottom:20px;">
      <tr><td>
        <p style="color:#8A8A86; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:12px;">টাস্কের বিবরণ</p>
        <p style="color:#0A5240; font-size:18px; font-weight:700; margin-bottom:8px;">${data.taskTitle}</p>
        ${dueDateStr ? `<p style="color:#5A5A56; font-size:13px;">📅 ডেডলাইন: <strong>${dueDateStr}</strong></p>` : ""}
      </td></tr>
    </table>
    ${ctaButton(tasksUrl, "🗂️ টাস্ক দেখুন")}
    ${infoBox("⚡", "দ্রুত সম্পন্ন করুন", "টাস্কটি সময়মতো সম্পন্ন করলে আপনার টিমের কার্যক্ষমতা বাড়বে।")}
  `;
  await sendEmail("task_reminder", {
    to: data.toEmail,
    subject: `⏰ টাস্ক রিমাইন্ডার: ${data.taskTitle} — BizilCore`,
    html: baseEmailWrapper("টাস্ক রিমাইন্ডার", "Task Reminder Notification", body),
    text: `নমস্কার ${data.userName}!\n\nটাস্ক রিমাইন্ডার: ${data.taskTitle}${dueDateStr ? `\nডেডলাইন: ${dueDateStr}` : ""}\n\nটাস্ক দেখতে যান: ${tasksUrl}\n\n— BizilCore Team`,
  });
}

// ─── Account Status Email ─────────────────────────────────────────────────────

const STATUS_EMAIL_CFG: Record<string, { icon: string; title: string; subtitle: string; color: string; bg: string }> = {
  disabled: {
    icon: "🚫", title: "আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে",
    subtitle: "Account Disabled", color: "#DC2626", bg: "#FEF2F2",
  },
  suspended: {
    icon: "⏸️", title: "আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে",
    subtitle: "Account Suspended", color: "#D97706", bg: "#FFFBEB",
  },
  active: {
    icon: "✅", title: "আপনার অ্যাকাউন্ট পুনরায় সক্রিয় করা হয়েছে",
    subtitle: "Account Reactivated", color: "#059669", bg: "#ECFDF5",
  },
};

export async function sendAccountStatusEmail(data: {
  toEmail: string;
  userName: string;
  accountStatus: string;
  statusReason?: string;
}) {
  const cfg = STATUS_EMAIL_CFG[data.accountStatus] ?? STATUS_EMAIL_CFG.active;
  const isPositive = data.accountStatus === "active";

  const body = `
    <div style="text-align:center; margin-bottom:28px;">
      <div style="display:inline-block; background:${cfg.bg}; border-radius:16px; width:64px; height:64px; line-height:64px; font-size:32px; margin-bottom:16px;">${cfg.icon}</div>
      <h2 style="color:#1A1A18; font-size:20px; font-weight:700; margin-bottom:8px;">${cfg.title}</h2>
      <p style="color:#5A5A56; font-size:14px;">নমস্কার ${data.userName},</p>
    </div>

    ${!isPositive ? `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background:${cfg.bg}; border:1px solid ${cfg.color}33; border-radius:12px; padding:20px; margin-bottom:20px;">
      <tr><td>
        <p style="color:${cfg.color}; font-size:13px; font-weight:600; margin-bottom:6px;">অ্যাকাউন্ট স্ট্যাটাস</p>
        <p style="color:#1A1A18; font-size:16px; font-weight:700; margin-bottom:${data.statusReason ? "12px" : "0"};">${cfg.subtitle}</p>
        ${data.statusReason ? `<p style="color:#4B5563; font-size:13px;">কারণ: ${data.statusReason}</p>` : ""}
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background:#F0FBF7; border:1px solid #0F6E5633; border-radius:12px; padding:20px; margin-bottom:20px;">
      <tr><td>
        <p style="color:#0A5240; font-size:13px; font-weight:600; margin-bottom:10px;">সমাধান করতে যোগাযোগ করুন</p>
        <p style="color:#5A5A56; font-size:13px; margin-bottom:6px;">📧 ইমেইল: <a href="mailto:support@bizilcore.com" style="color:#0F6E56;">support@bizilcore.com</a></p>
        <p style="color:#5A5A56; font-size:13px;">⏰ সাড়া পাবেন ২৪ ঘন্টার মধ্যে</p>
      </td></tr>
    </table>
    ` : `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background:#ECFDF5; border:1px solid #059669; border-radius:12px; padding:20px; margin-bottom:20px;">
      <tr><td>
        <p style="color:#065F46; font-size:15px; font-weight:600; margin-bottom:6px;">অ্যাকাউন্ট পুনরায় সক্রিয়!</p>
        <p style="color:#5A5A56; font-size:13px;">আপনার BizilCore অ্যাকাউন্ট এখন সম্পূর্ণ স্বাভাবিক। আপনি আবার সব ফিচার ব্যবহার করতে পারবেন।</p>
      </td></tr>
    </table>
    ${ctaButton("https://app.bizilcore.com/dashboard", "📊 Dashboard-এ যান")}
    `}
  `;

  const subjects: Record<string, string> = {
    disabled:  "🚫 আপনার BizilCore অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে",
    suspended: "⏸️ আপনার BizilCore অ্যাকাউন্ট সাময়িকভাবে স্থগিত",
    active:    "✅ আপনার BizilCore অ্যাকাউন্ট পুনরায় সক্রিয়",
  };

  await sendEmail("subscription", {
    to: data.toEmail,
    subject: subjects[data.accountStatus] ?? subjects.active,
    html: baseEmailWrapper(cfg.title, cfg.subtitle, body),
    text: `${cfg.title}\n\nনমস্কার ${data.userName},\n\n${data.statusReason ? `কারণ: ${data.statusReason}\n\n` : ""}যোগাযোগ: support@bizilcore.com\n\n— BizilCore Team`,
  });
}

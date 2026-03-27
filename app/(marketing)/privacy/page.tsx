import Link from "next/link";
import TocSidebar from "@/components/TocSidebar";

export const metadata = {
  title: "গোপনীয়তা নীতি — BizilCore",
  description: "BizilCore-এর গোপনীয়তা নীতি — আপনার ডেটা কিভাবে সংগ্রহ, সংরক্ষণ ও ব্যবহার করা হয়।",
};

const sections = [
  { id: "intro", title: "ভূমিকা" },
  { id: "collection", title: "তথ্য সংগ্রহ" },
  { id: "usage", title: "তথ্য ব্যবহার" },
  { id: "sharing", title: "তথ্য শেয়ার" },
  { id: "security", title: "ডেটা নিরাপত্তা" },
  { id: "cookies", title: "কুকিজ ও ট্র্যাকিং" },
  { id: "retention", title: "ডেটা সংরক্ষণকাল" },
  { id: "rights", title: "আপনার অধিকার" },
  { id: "children", title: "শিশুদের গোপনীয়তা" },
  { id: "thirdparty", title: "তৃতীয় পক্ষের সেবা" },
  { id: "changes", title: "নীতি পরিবর্তন" },
  { id: "contact", title: "যোগাযোগ" },
];

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: "#F7F6F2" }}>

      {/* Hero */}
      <section style={{ backgroundColor: "#0F6E56" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">হোম</Link>
            <span className="text-white/40 text-sm">/</span>
            <span className="text-white/80 text-sm">গোপনীয়তা নীতি</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            গোপনীয়তা নীতি
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-2xl">
            আপনার ব্যক্তিগত তথ্য ও ব্যবসায়িক ডেটা সুরক্ষিত রাখা আমাদের সর্বোচ্চ অগ্রাধিকার। এই নীতিতে আমরা ব্যাখ্যা করেছি যে আমরা কী ধরনের তথ্য সংগ্রহ করি এবং কিভাবে ব্যবহার করি।
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            সর্বশেষ আপডেট: ২২ মার্চ, ২০২৬
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Table of Contents */}
          <aside className="lg:w-64 flex-shrink-0">
            <TocSidebar sections={sections} crossLink={{ href: "/terms", label: "শর্তাবলী" }} />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border p-8 md:p-10 space-y-10" style={{ borderColor: "#E8E6DF" }}>

              <section id="intro">
                <SectionHeader number={1} title="ভূমিকা" />
                <Body>
                  BizilCore Technologies ("আমরা", "আমাদের") বাংলাদেশের Facebook-ভিত্তিক বিক্রেতাদের জন্য একটি ব্যবসা ম্যানেজমেন্ট প্ল্যাটফর্ম পরিচালনা করে। এই গোপনীয়তা নীতি ব্যাখ্যা করে যে আমরা আমাদের ওয়েবসাইট ও অ্যাপ ব্যবহারকারীদের কাছ থেকে কী তথ্য সংগ্রহ করি, কিভাবে তা ব্যবহার করি এবং কিভাবে সুরক্ষিত রাখি।
                </Body>
                <Body className="mt-3">
                  BizilCore ব্যবহার করে আপনি এই গোপনীয়তা নীতিতে বর্ণিত তথ্য সংগ্রহ ও ব্যবহারে সম্মত হচ্ছেন। আপনি যদি একমত না হন, দয়া করে আমাদের প্ল্যাটফর্ম ব্যবহার করবেন না।
                </Body>
              </section>

              <Divider />

              <section id="collection">
                <SectionHeader number={2} title="তথ্য সংগ্রহ" />
                <Body>আমরা নিম্নলিখিত ধরনের তথ্য সংগ্রহ করি:</Body>
                <div className="mt-4 space-y-4">
                  <DataCard title="ব্যক্তিগত পরিচয় তথ্য" items={["নাম ও ইমেইল ঠিকানা", "ফোন নম্বর", "ব্যবসার নাম ও ঠিকানা", "পাসওয়ার্ড (এনক্রিপ্টেড)"]} />
                  <DataCard title="ব্যবসায়িক তথ্য" items={["পণ্যের তথ্য ও ছবি", "অর্ডার ও কাস্টমার ডেটা", "বিক্রয় ও আর্থিক রেকর্ড", "স্টক ও ইনভেন্টরি তথ্য"]} />
                  <DataCard title="প্রযুক্তিগত তথ্য" items={["IP ঠিকানা ও ব্রাউজার তথ্য", "ডিভাইসের ধরন ও অপারেটিং সিস্টেম", "প্ল্যাটফর্ম ব্যবহারের লগ ও সময়", "কুকিজ ও সেশন ডেটা"]} />
                  <DataCard title="পেমেন্ট তথ্য" items={["সাবস্ক্রিপশন ইতিহাস", "পেমেন্ট পদ্ধতির ধরন (সম্পূর্ণ কার্ড নম্বর সংরক্ষণ করা হয় না)", "বিলিং ঠিকানা"]} />
                </div>
              </section>

              <Divider />

              <section id="usage">
                <SectionHeader number={3} title="তথ্য ব্যবহার" />
                <Body>সংগ্রহ করা তথ্য আমরা নিম্নলিখিত উদ্দেশ্যে ব্যবহার করি:</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "সেবা প্রদান ও অ্যাকাউন্ট পরিচালনা",
                    "অর্ডার প্রক্রিয়াকরণ ও কুরিয়ার ইন্টিগ্রেশন",
                    "SMS, WhatsApp ও ইমেইল নোটিফিকেশন পাঠানো",
                    "প্ল্যাটফর্মের মান উন্নয়ন ও নতুন ফিচার তৈরি",
                    "কাস্টমার সাপোর্ট প্রদান",
                    "নিরাপত্তা নিশ্চিত করা ও প্রতারণা প্রতিরোধ",
                    "আইনি বাধ্যবাধকতা পূরণ",
                  ].map(item => <ListItem key={item}>{item}</ListItem>)}
                </ul>
                <InfoBox className="mt-5">
                  আমরা আপনার ডেটা কখনো বিজ্ঞাপনের উদ্দেশ্যে তৃতীয় পক্ষের সাথে শেয়ার করি না।
                </InfoBox>
              </section>

              <Divider />

              <section id="sharing">
                <SectionHeader number={4} title="তথ্য শেয়ার" />
                <Body>আমরা নিম্নলিখিত সীমিত পরিস্থিতিতে আপনার তথ্য শেয়ার করতে পারি:</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "কুরিয়ার পার্টনার (Pathao, eCourier) — ডেলিভারি সম্পন্ন করতে",
                    "পেমেন্ট প্রসেসর (bKash, Nagad) — পেমেন্ট যাচাই করতে",
                    "SMS ও Email সেবা প্রদানকারী — নোটিফিকেশন পাঠাতে",
                    "আইনি কর্তৃপক্ষ — আদালতের আদেশ বা আইনি প্রয়োজনে",
                  ].map(item => <ListItem key={item}>{item}</ListItem>)}
                </ul>
                <Body className="mt-4">সমস্ত তৃতীয় পক্ষের অংশীদার আমাদের কঠোর গোপনীয়তা চুক্তি মেনে চলে এবং তারা আপনার ডেটা নির্দিষ্ট উদ্দেশ্যের বাইরে ব্যবহার করতে পারে না।</Body>
              </section>

              <Divider />

              <section id="security">
                <SectionHeader number={5} title="ডেটা নিরাপত্তা" />
                <Body>আপনার ডেটা সুরক্ষিত রাখতে আমরা শিল্প-মানের নিরাপত্তা ব্যবস্থা ব্যবহার করি:</Body>
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: "🔒", title: "SSL এনক্রিপশন", desc: "সকল ডেটা ট্রান্সফারে TLS 1.3 এনক্রিপশন" },
                    { icon: "🛡️", title: "ডেটা এনক্রিপশন", desc: "সংবেদনশীল তথ্য AES-256 দিয়ে এনক্রিপ্টেড" },
                    { icon: "🔑", title: "দুই-স্তরীয় যাচাই", desc: "অতিরিক্ত নিরাপত্তার জন্য 2FA সুবিধা" },
                    { icon: "📊", title: "নিরাপত্তা অডিট", desc: "নিয়মিত নিরাপত্তা পরীক্ষা ও আপডেট" },
                    { icon: "💾", title: "ব্যাকআপ", desc: "প্রতিদিন স্বয়ংক্রিয় ডেটা ব্যাকআপ" },
                    { icon: "🚨", title: "ইনসিডেন্ট রেসপন্স", desc: "নিরাপত্তা লঙ্ঘনে ৭২ ঘণ্টার মধ্যে জানানো" },
                  ].map(item => (
                    <div key={item.title} className="flex gap-3 p-4 rounded-xl" style={{ backgroundColor: "#F7F6F2" }}>
                      <span className="text-2xl flex-shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold mb-0.5" style={{ color: "#1A1A18" }}>{item.title}</p>
                        <p className="text-xs" style={{ color: "#7A7A72" }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <Divider />

              <section id="cookies">
                <SectionHeader number={6} title="কুকিজ ও ট্র্যাকিং" />
                <Body>আমরা আমাদের সেবার মান উন্নয়নের জন্য কুকিজ ব্যবহার করি:</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "প্রয়োজনীয় কুকিজ — সেবা চালু রাখতে অপরিহার্য (সর্বদা সক্রিয়)",
                    "কার্যকারিতা কুকিজ — আপনার পছন্দ ও সেটিংস মনে রাখতে",
                    "অ্যানালিটিক্স কুকিজ — ব্যবহারের প্যাটার্ন বিশ্লেষণ করতে",
                    "পারফরমেন্স কুকিজ — প্ল্যাটফর্মের গতি উন্নয়নে",
                  ].map(item => <ListItem key={item}>{item}</ListItem>)}
                </ul>
                <Body className="mt-4">আপনার ব্রাউজারের সেটিংসে গিয়ে যেকোনো সময় কুকিজ ব্যবস্থাপনা করতে পারবেন। তবে কিছু কুকিজ বন্ধ করলে প্ল্যাটফর্মের কার্যকারিতা সীমিত হতে পারে।</Body>
              </section>

              <Divider />

              <section id="retention">
                <SectionHeader number={7} title="ডেটা সংরক্ষণকাল" />
                <Body>আমরা বিভিন্ন ধরনের তথ্য বিভিন্ন সময়ের জন্য সংরক্ষণ করি:</Body>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: "#F7F6F2" }}>
                        <th className="text-left px-4 py-3 font-semibold rounded-l-xl" style={{ color: "#1A1A18" }}>তথ্যের ধরন</th>
                        <th className="text-left px-4 py-3 font-semibold rounded-r-xl" style={{ color: "#1A1A18" }}>সংরক্ষণকাল</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["অ্যাকাউন্ট তথ্য", "অ্যাকাউন্ট বাতিলের ৩০ দিন পর মুছে যায়"],
                        ["অর্ডার ও বিক্রয় রেকর্ড", "৭ বছর (আইনি প্রয়োজনে)"],
                        ["পেমেন্ট তথ্য", "৫ বছর (আর্থিক বিধিমালা অনুযায়ী)"],
                        ["লগ ফাইল", "৯০ দিন"],
                        ["কুকিজ ডেটা", "সেশন বা সর্বোচ্চ ১ বছর"],
                      ].map(([type, duration], i) => (
                        <tr key={type} style={{ borderTop: i > 0 ? "1px solid #F0EDE8" : "none" }}>
                          <td className="px-4 py-3" style={{ color: "#5A5A56" }}>{type}</td>
                          <td className="px-4 py-3" style={{ color: "#5A5A56" }}>{duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <Divider />

              <section id="rights">
                <SectionHeader number={8} title="আপনার অধিকার" />
                <Body>আপনার ডেটা সম্পর্কে আপনার নিম্নলিখিত অধিকার রয়েছে:</Body>
                <div className="mt-4 space-y-3">
                  {[
                    { right: "দেখার অধিকার", desc: "আমরা আপনার কী তথ্য সংরক্ষণ করেছি তা দেখার অনুরোধ করতে পারবেন" },
                    { right: "সংশোধনের অধিকার", desc: "ভুল বা অসম্পূর্ণ তথ্য সংশোধনের অনুরোধ করতে পারবেন" },
                    { right: "মুছে ফেলার অধিকার", desc: "নির্দিষ্ট পরিস্থিতিতে আপনার ডেটা মুছে ফেলার অনুরোধ করতে পারবেন" },
                    { right: "পোর্টেবিলিটির অধিকার", desc: "আপনার ডেটা CSV/Excel ফরম্যাটে ডাউনলোড করতে পারবেন" },
                    { right: "আপত্তির অধিকার", desc: "নির্দিষ্ট উদ্দেশ্যে আপনার ডেটা ব্যবহারে আপত্তি জানাতে পারবেন" },
                  ].map(item => (
                    <div key={item.right} className="flex gap-3 p-4 rounded-xl border" style={{ borderColor: "#E8E6DF" }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#0F6E56", marginTop: "4px" }} />
                      <div>
                        <p className="text-sm font-semibold mb-0.5" style={{ color: "#1A1A18" }}>{item.right}</p>
                        <p className="text-sm" style={{ color: "#5A5A56" }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Body className="mt-5">
                  উপরোক্ত যেকোনো অধিকার প্রয়োগ করতে <a href="mailto:privacy@bizilcore.com" className="font-medium underline underline-offset-2" style={{ color: "#0F6E56" }}>privacy@bizilcore.com</a>-এ ইমেইল পাঠান। আমরা ৩০ দিনের মধ্যে সাড়া দেব।
                </Body>
              </section>

              <Divider />

              <section id="children">
                <SectionHeader number={9} title="শিশুদের গোপনীয়তা" />
                <Body>
                  BizilCore-এর সেবা ১৮ বছরের কম বয়সীদের জন্য নয়। আমরা সচেতনভাবে ১৮ বছরের কম বয়সী কারো কাছ থেকে তথ্য সংগ্রহ করি না। যদি আপনি জানতে পারেন যে কোনো শিশু আমাদের প্ল্যাটফর্মে অ্যাকাউন্ট তৈরি করেছে, অনুগ্রহ করে আমাদের জানান।
                </Body>
              </section>

              <Divider />

              <section id="thirdparty">
                <SectionHeader number={10} title="তৃতীয় পক্ষের সেবা" />
                <Body>আমাদের প্ল্যাটফর্মে নিম্নলিখিত তৃতীয় পক্ষের সেবা ব্যবহার করা হয়:</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "Facebook API — অর্ডার সাজেশন ও সোশ্যাল লগইনের জন্য",
                    "bKash ও Nagad — পেমেন্ট প্রক্রিয়াকরণের জন্য",
                    "Pathao, eCourier — ডেলিভারি সেবার জন্য",
                    "Google Analytics — প্ল্যাটফর্ম ব্যবহার বিশ্লেষণের জন্য",
                    "Twilio/SSL Wireless — SMS নোটিফিকেশনের জন্য",
                  ].map(item => <ListItem key={item}>{item}</ListItem>)}
                </ul>
                <Body className="mt-4">
                  এই সেবাগুলোর নিজস্ব গোপনীয়তা নীতি রয়েছে। আমরা তাদের ডেটা ব্যবস্থাপনার জন্য দায়বদ্ধ নই।
                </Body>
              </section>

              <Divider />

              <section id="changes">
                <SectionHeader number={11} title="নীতি পরিবর্তন" />
                <Body>
                  আমরা সময়ে সময়ে এই গোপনীয়তা নীতি আপডেট করতে পারি। গুরুত্বপূর্ণ পরিবর্তনের ক্ষেত্রে আমরা ইমেইলের মাধ্যমে এবং প্ল্যাটফর্মে নোটিশ দেওয়ার মাধ্যমে আপনাকে অবহিত করব। নতুন নীতি কার্যকর হওয়ার তারিখ সবসময় এই পেজের শীর্ষে উল্লেখ থাকবে।
                </Body>
              </section>

              <Divider />

              <section id="contact">
                <SectionHeader number={12} title="যোগাযোগ" />
                <Body>গোপনীয়তা সংক্রান্ত কোনো প্রশ্ন বা উদ্বেগ থাকলে আমাদের Privacy Team-এর সাথে যোগাযোগ করুন:</Body>
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <ContactCard icon="🔏" label="প্রাইভেসি ইমেইল" value="privacy@bizilcore.com" />
                  <ContactCard icon="✉️" label="সাধারণ সাপোর্ট" value="support@bizilcore.com" />
                  <ContactCard icon="🏢" label="ঠিকানা" value="ঢাকা, বাংলাদেশ" />
                  <ContactCard icon="⏰" label="সাড়া দেওয়ার সময়" value="সর্বোচ্চ ৩০ কার্যদিবসের মধ্যে" />
                </div>
              </section>

            </div>

            {/* Bottom Links */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
              <p className="text-sm" style={{ color: "#9A9A92" }}>
                আরও জানুন:{" "}
                <Link href="/terms" className="font-medium hover:opacity-80 transition-opacity" style={{ color: "#0F6E56" }}>
                  শর্তাবলী
                </Link>
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#0F6E56" }}
              >
                বিনামূল্যে শুরু করুন →
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ backgroundColor: "#0F6E56" }}>
        {number}
      </span>
      <h2 className="text-xl font-bold" style={{ color: "#1A1A18" }}>{title}</h2>
    </div>
  );
}

function Body({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm leading-relaxed ${className}`} style={{ color: "#5A5A56" }}>
      {children}
    </p>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm" style={{ color: "#5A5A56" }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#0F6E56", marginTop: "6px" }} />
      {children}
    </li>
  );
}

function Divider() {
  return <hr style={{ borderColor: "#F0EDE8" }} />;
}

function InfoBox({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-4 text-sm leading-relaxed ${className}`} style={{ backgroundColor: "#ECFDF5", color: "#0F6E56", border: "1px solid #BBF7D0" }}>
      {children}
    </div>
  );
}

function DataCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border p-5" style={{ borderColor: "#E8E6DF" }}>
      <h4 className="text-sm font-semibold mb-3" style={{ color: "#1A1A18" }}>{title}</h4>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "#5A5A56" }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#0F6E56" }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: "#F7F6F2" }}>
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xs font-semibold mb-0.5" style={{ color: "#9A9A92" }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: "#1A1A18" }}>{value}</p>
      </div>
    </div>
  );
}

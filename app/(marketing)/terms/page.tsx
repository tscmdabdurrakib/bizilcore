import Link from "next/link";
import TocSidebar from "@/components/TocSidebar";

export const metadata = {
  title: "শর্তাবলী — BizilCore",
  description: "BizilCore ব্যবহারের শর্তাবলী ও নিয়মনীতি।",
};

const sections = [
  { id: "acceptance", title: "শর্ত গ্রহণ" },
  { id: "services", title: "সেবার বিবরণ" },
  { id: "account", title: "অ্যাকাউন্ট ও নিবন্ধন" },
  { id: "subscription", title: "সাবস্ক্রিপশন ও পেমেন্ট" },
  { id: "usage", title: "ব্যবহারের নীতিমালা" },
  { id: "prohibited", title: "নিষিদ্ধ কার্যক্রম" },
  { id: "ip", title: "মেধাস্বত্ব" },
  { id: "data", title: "ডেটা ও গোপনীয়তা" },
  { id: "liability", title: "দায়বদ্ধতার সীমা" },
  { id: "termination", title: "অ্যাকাউন্ট বাতিল" },
  { id: "changes", title: "পরিবর্তন ও আপডেট" },
  { id: "contact", title: "যোগাযোগ" },
];

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: "#F7F6F2" }}>

      {/* Hero */}
      <section style={{ backgroundColor: "#0F6E56" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">হোম</Link>
            <span className="text-white/40 text-sm">/</span>
            <span className="text-white/80 text-sm">শর্তাবলী</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ব্যবহারের শর্তাবলী
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-2xl">
            BizilCore প্ল্যাটফর্ম ব্যবহার করার আগে এই শর্তাবলী মনোযোগ দিয়ে পড়ুন। প্ল্যাটফর্ম ব্যবহার করলে আপনি এই শর্তগুলো মেনে নিচ্ছেন বলে গণ্য হবে।
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
            <TocSidebar sections={sections} crossLink={{ href: "/privacy", label: "গোপনীয়তা নীতি" }} />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border p-8 md:p-10 space-y-10" style={{ borderColor: "#E8E6DF" }}>

              <section id="acceptance">
                <SectionHeader number={1} title="শর্ত গ্রহণ" />
                <Body>
                  BizilCore প্ল্যাটফর্ম (ওয়েবসাইট, অ্যাপ ও সংশ্লিষ্ট সেবাসমূহ) ব্যবহার করলে আপনি এই ব্যবহারের শর্তাবলী ("শর্তাবলী") মেনে নিচ্ছেন বলে গণ্য হবে। আপনি যদি এই শর্তাবলীর কোনো অংশের সাথে একমত না হন, তাহলে অনুগ্রহ করে আমাদের প্ল্যাটফর্ম ব্যবহার করবেন না।
                </Body>
                <Body className="mt-3">
                  এই শর্তাবলী BizilCore Technologies এবং তার ব্যবহারকারীদের মধ্যে একটি আইনি চুক্তি গঠন করে। ব্যবহারকারী হিসেবে আপনি নিশ্চিত করছেন যে আপনি কমপক্ষে ১৮ বছর বয়সী এবং আইনগতভাবে এই চুক্তিতে প্রবেশ করতে সক্ষম।
                </Body>
              </section>

              <Divider />

              <section id="services">
                <SectionHeader number={2} title="সেবার বিবরণ" />
                <Body>BizilCore একটি SaaS (Software as a Service) প্ল্যাটফর্ম যা বাংলাদেশের Facebook-ভিত্তিক বিক্রেতা ও ছোট ব্যবসার জন্য তৈরি। আমাদের সেবার মধ্যে রয়েছে:</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "অর্ডার ম্যানেজমেন্ট — অর্ডার গ্রহণ, প্রক্রিয়াকরণ ও ট্র্যাকিং",
                    "ইনভেন্টরি ম্যানেজমেন্ট — স্টক পরিচালনা ও লো-স্টক অ্যালার্ট",
                    "কাস্টমার ম্যানেজমেন্ট — CRM ও কাস্টমার ডেটাবেজ",
                    "কুরিয়ার ইন্টিগ্রেশন — Pathao, eCourier সহ বিভিন্ন কুরিয়ার সেবা",
                    "পেমেন্ট গেটওয়ে — bKash ও Nagad ইন্টিগ্রেশন",
                    "রিপোর্ট ও অ্যানালিটিক্স — বিক্রয় ও মুনাফার বিস্তারিত রিপোর্ট",
                    "Facebook ইন্টিগ্রেশন — মন্তব্য থেকে অর্ডার সাজেশন",
                    "SMS ও WhatsApp নোটিফিকেশন — অর্ডার আপডেট পাঠানো",
                  ].map(item => <ListItem key={item}>{item}</ListItem>)}
                </ul>
                <Body className="mt-4">আমরা যেকোনো সময় বিনা পূর্ব নোটিশে সেবার বৈশিষ্ট্য যোগ, পরিবর্তন বা অপসারণের অধিকার সংরক্ষণ করি।</Body>
              </section>

              <Divider />

              <section id="account">
                <SectionHeader number={3} title="অ্যাকাউন্ট ও নিবন্ধন" />
                <Body>BizilCore ব্যবহার করতে আপনাকে একটি অ্যাকাউন্ট তৈরি করতে হবে। অ্যাকাউন্ট তৈরির সময় আপনাকে সঠিক ও সম্পূর্ণ তথ্য প্রদান করতে হবে।</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "আপনি আপনার পাসওয়ার্ড গোপন রাখার জন্য দায়ী",
                    "আপনার অ্যাকাউন্টের সকল কার্যক্রমের জন্য আপনি দায়বদ্ধ",
                    "অ্যাকাউন্ট অন্য কাউকে হস্তান্তর করা নিষিদ্ধ",
                    "একজন ব্যক্তি একাধিক অ্যাকাউন্ট তৈরি করতে পারবেন না (প্রযোজ্য ক্ষেত্র ছাড়া)",
                    "সন্দেহজনক কার্যক্রম লক্ষ্য করলে অবিলম্বে আমাদের জানাবেন",
                  ].map(item => <ListItem key={item}>{item}</ListItem>)}
                </ul>
              </section>

              <Divider />

              <section id="subscription">
                <SectionHeader number={4} title="সাবস্ক্রিপশন ও পেমেন্ট" />
                <Body>BizilCore বিভিন্ন সাবস্ক্রিপশন প্ল্যান অফার করে। পেমেন্ট সংক্রান্ত গুরুত্বপূর্ণ তথ্য:</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "সকল মূল্য বাংলাদেশী টাকায় (BDT) প্রযোজ্য এবং ভ্যাট অন্তর্ভুক্ত",
                    "মাসিক সাবস্ক্রিপশন প্রতি মাসের শুরুতে স্বয়ংক্রিয়ভাবে নবায়ন হয়",
                    "বার্ষিক প্ল্যানে অতিরিক্ত ছাড় পাওয়া যায়",
                    "পেমেন্ট ব্যর্থ হলে ৭ দিনের গ্রেস পিরিয়ড দেওয়া হয়",
                    "সাবস্ক্রিপশন বাতিলের পর বর্তমান বিলিং সাইকেলের শেষ পর্যন্ত সেবা চলবে",
                    "রিফান্ড নীতি অনুযায়ী প্রযোজ্য ক্ষেত্রে অর্থ ফেরত দেওয়া হয়",
                  ].map(item => <ListItem key={item}>{item}</ListItem>)}
                </ul>
                <InfoBox className="mt-5">
                  <strong>রিফান্ড নীতি:</strong> যদি আপনি প্রথম ৭ দিনের মধ্যে সেবায় সন্তুষ্ট না হন, আমাদের সাথে যোগাযোগ করুন। আমরা সম্পূর্ণ রিফান্ড প্রদান করব।
                </InfoBox>
              </section>

              <Divider />

              <section id="usage">
                <SectionHeader number={5} title="ব্যবহারের নীতিমালা" />
                <Body>BizilCore ব্যবহার করে আপনি নিম্নলিখিত শর্তগুলো মেনে চলতে সম্মত হচ্ছেন:</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "শুধুমাত্র আইনসম্মত ব্যবসায়িক উদ্দেশ্যে প্ল্যাটফর্ম ব্যবহার করবেন",
                    "সঠিক ও আপডেটেড তথ্য সংরক্ষণ করবেন",
                    "তৃতীয় পক্ষের গোপনীয়তা ও অধিকার সম্মান করবেন",
                    "বাংলাদেশের প্রচলিত আইন মেনে চলবেন",
                    "অন্য ব্যবহারকারীদের সাথে সম্মানজনক আচরণ করবেন",
                  ].map(item => <ListItem key={item}>{item}</ListItem>)}
                </ul>
              </section>

              <Divider />

              <section id="prohibited">
                <SectionHeader number={6} title="নিষিদ্ধ কার্যক্রম" />
                <Body>নিম্নলিখিত কার্যক্রম কঠোরভাবে নিষিদ্ধ এবং অ্যাকাউন্ট বাতিলের কারণ হতে পারে:</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "অবৈধ পণ্য বা সেবা বিক্রয়ের জন্য প্ল্যাটফর্ম ব্যবহার",
                    "ভুয়া বা প্রতারণামূলক তথ্য প্রদান",
                    "অন্য ব্যবহারকারীর অ্যাকাউন্টে অননুমোদিত প্রবেশের চেষ্টা",
                    "ম্যালওয়্যার, ভাইরাস বা ক্ষতিকর কোড ছড়ানো",
                    "স্প্যাম বা অযাচিত বার্তা পাঠানো",
                    "প্ল্যাটফর্মের নিরাপত্তা দুর্বলতা খোঁজা বা শোষণ করা",
                    "প্রতিযোগিতামূলক গোয়েন্দাগিরি বা ডেটা সংগ্রহ",
                    "BizilCore-এর মেধাস্বত্ব অনুমতি ছাড়া ব্যবহার করা",
                  ].map(item => <ListItem key={item} variant="warning">{item}</ListItem>)}
                </ul>
              </section>

              <Divider />

              <section id="ip">
                <SectionHeader number={7} title="মেধাস্বত্ব" />
                <Body>BizilCore প্ল্যাটফর্মের সমস্ত কন্টেন্ট, ডিজাইন, লোগো, ট্রেডমার্ক, সোর্স কোড এবং সংশ্লিষ্ট সকল মেধাসম্পদ BizilCore Technologies-এর একচেটিয়া সম্পত্তি।</Body>
                <Body className="mt-3">আপনার অ্যাকাউন্টে আপলোড করা কন্টেন্টের (পণ্যের ছবি, তথ্য ইত্যাদি) মালিকানা আপনার কাছেই থাকবে। তবে আপনি আমাদেরকে সেবা প্রদানের উদ্দেশ্যে উক্ত কন্টেন্ট ব্যবহার করার অনুমতি দিচ্ছেন।</Body>
              </section>

              <Divider />

              <section id="data">
                <SectionHeader number={8} title="ডেটা ও গোপনীয়তা" />
                <Body>আপনার ব্যক্তিগত তথ্য ও ব্যবসায়িক ডেটা সুরক্ষিত রাখা আমাদের সর্বোচ্চ অগ্রাধিকার। আমাদের ডেটা ব্যবস্থাপনা সম্পর্কে বিস্তারিত জানতে আমাদের <Link href="/privacy" className="font-medium underline underline-offset-2" style={{ color: "#0F6E56" }}>গোপনীয়তা নীতি</Link> পড়ুন।</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "আমরা আপনার ডেটা তৃতীয় পক্ষের কাছে বিক্রি করি না",
                    "আপনার ডেটা এনক্রিপ্টেড অবস্থায় সংরক্ষণ করা হয়",
                    "আপনি যেকোনো সময় আপনার ডেটা ডাউনলোড বা মুছে ফেলার অনুরোধ করতে পারেন",
                  ].map(item => <ListItem key={item}>{item}</ListItem>)}
                </ul>
              </section>

              <Divider />

              <section id="liability">
                <SectionHeader number={9} title="দায়বদ্ধতার সীমা" />
                <Body>BizilCore সর্বোচ্চ মানের সেবা নিশ্চিত করতে প্রতিশ্রুতিবদ্ধ। তবে আমরা নিম্নলিখিত বিষয়গুলোর জন্য দায়বদ্ধ নই:</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "প্রযুক্তিগত সমস্যা বা সার্ভার বিভ্রাটের কারণে ব্যবসায়িক ক্ষতি",
                    "তৃতীয় পক্ষের সেবা (কুরিয়ার, পেমেন্ট গেটওয়ে) সংক্রান্ত সমস্যা",
                    "আপনার অসাবধানতা বা অবহেলার কারণে ডেটা হারিয়ে যাওয়া",
                    "ইন্টারনেট সংযোগ বিচ্ছিন্ন হওয়ার কারণে সেবা বাধাগ্রস্ত হওয়া",
                  ].map(item => <ListItem key={item}>{item}</ListItem>)}
                </ul>
                <InfoBox className="mt-5">
                  যেকোনো পরিস্থিতিতে আমাদের সর্বোচ্চ দায় আপনার পরিশোধিত গত ৩ মাসের সাবস্ক্রিপশন ফির বেশি হবে না।
                </InfoBox>
              </section>

              <Divider />

              <section id="termination">
                <SectionHeader number={10} title="অ্যাকাউন্ট বাতিল" />
                <Body>নিম্নলিখিত পরিস্থিতিতে অ্যাকাউন্ট বাতিল হতে পারে:</Body>
                <ul className="space-y-2 mt-3">
                  {[
                    "আপনার অনুরোধে — যেকোনো সময় অ্যাকাউন্ট বাতিল করা যাবে",
                    "শর্তাবলী লঙ্ঘনের কারণে — বিনা পূর্ব নোটিশে অ্যাকাউন্ট বাতিল করা হতে পারে",
                    "নিষ্ক্রিয়তার কারণে — ১২ মাস ব্যবহার না হলে অ্যাকাউন্ট নিষ্ক্রিয় হতে পারে",
                    "পেমেন্ট ব্যর্থতার কারণে — গ্রেস পিরিয়ড পার হলে সেবা স্থগিত হবে",
                  ].map(item => <ListItem key={item}>{item}</ListItem>)}
                </ul>
                <Body className="mt-4">অ্যাকাউন্ট বাতিলের আগে আপনার ডেটা ডাউনলোড করার সুযোগ দেওয়া হবে।</Body>
              </section>

              <Divider />

              <section id="changes">
                <SectionHeader number={11} title="পরিবর্তন ও আপডেট" />
                <Body>আমরা যেকোনো সময় এই শর্তাবলী আপডেট করতে পারি। গুরুত্বপূর্ণ পরিবর্তনের ক্ষেত্রে আমরা ইমেইলের মাধ্যমে আপনাকে অবহিত করব। পরিবর্তনের পরেও প্ল্যাটফর্ম ব্যবহার অব্যাহত রাখলে আপনি নতুন শর্তাবলী মেনে নিচ্ছেন বলে গণ্য হবে।</Body>
              </section>

              <Divider />

              <section id="contact">
                <SectionHeader number={12} title="যোগাযোগ" />
                <Body>শর্তাবলী সম্পর্কে কোনো প্রশ্ন বা উদ্বেগ থাকলে আমাদের সাথে যোগাযোগ করুন:</Body>
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <ContactCard icon="✉️" label="ইমেইল" value="legal@bizilcore.com" />
                  <ContactCard icon="📞" label="ফোন" value="+880 1700-000000" />
                  <ContactCard icon="🏢" label="ঠিকানা" value="ঢাকা, বাংলাদেশ" />
                  <ContactCard icon="⏰" label="সাপোর্ট সময়" value="শনি–বৃহস্পতি, সকাল ৯টা – রাত ৯টা" />
                </div>
              </section>

            </div>

            {/* Bottom Links */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
              <p className="text-sm" style={{ color: "#9A9A92" }}>
                আরও জানুন:{" "}
                <Link href="/privacy" className="font-medium hover:opacity-80 transition-opacity" style={{ color: "#0F6E56" }}>
                  গোপনীয়তা নীতি
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
      <span
        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
        style={{ backgroundColor: "#0F6E56" }}
      >
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

function ListItem({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "warning" }) {
  return (
    <li className="flex items-start gap-2.5 text-sm" style={{ color: "#5A5A56" }}>
      <span
        className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: variant === "warning" ? "#E24B4A" : "#0F6E56", marginTop: "6px" }}
      />
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

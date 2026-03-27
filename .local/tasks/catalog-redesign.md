# Catalog Settings Fix + Ecommerce Page Redesign

## Goal
1. Settings page catalog section এর link box responsive করা
2. Catalog tab কে শুধু Business plan users এর জন্য gate করা
3. /s/[slug] catalog page কে proper ecommerce website এর মতো redesign করা

## Files to Change
- `app/(app)/settings/page.tsx` — catalog section link box + Business plan gate
- `app/(catalog)/s/[slug]/CatalogPageClient.tsx` — full ecommerce redesign

---

## Part 1: Settings — Catalog Link Box Responsive Fix

**Problem:** URL text (`font-mono truncate`) mobile-এ ভালো দেখায় না। Buttons নিচে চলে যায়।

**Fix:**
- URL টেক্সট কে একটি styled pill box এ রাখা (background দিয়ে)
- Copy ও "দেখুন" button কে `w-full sm:w-auto` করা
- URL টেক্সট এ `break-all` যোগ করা যাতে wrap হয়
- Overall link box layout:
  ```
  [Globe icon] আপনার ক্যাটালগ লিঙ্ক
  [URL box — full width, break-all, monospace]
  [Copy button] [দেখুন button] — flex gap-2, full width on mobile
  ```

---

## Part 2: Settings — Business Plan Gate

**Problem:** Catalog tab সব user দেখতে পাচ্ছে।

**Fix:** Settings page এ `plan` variable থেকে plan check করে:
```tsx
{tab === "catalog" && (() => {
  if (plan !== "business") {
    return (
      <div className="rounded-2xl p-8 text-center border" style={{...}}>
        <Crown size={32} color="#EF9F27" className="mx-auto mb-3" />
        <h3 className="font-bold text-base">Business Plan প্রয়োজন</h3>
        <p className="text-sm mt-1">পাবলিক ক্যাটালগ শুধুমাত্র Business plan এ পাওয়া যায়।</p>
        <Link href="/checkout?plan=business" ...>Business-এ Upgrade করুন</Link>
      </div>
    );
  }
  // ... existing catalog UI
```

---

## Part 3: CatalogPageClient.tsx — Ecommerce Redesign

**Current issues:**
- Header too simple (green bar, basic)
- 2-column grid only (cramped on desktop)
- Product cards too simple (no hover, no shadow gradient)
- Product modal basic

**New Design:**

### Header (sticky)
- Gradient background (#0F6E56 → #0A5240)
- Logo (if exists) with fallback initial circle
- Shop name + category badge
- WhatsApp button (green pill)
- Phone call button
- Tagline below shop name

### Hero Banner Section (below header)
- Wave separator or smooth gradient
- Shop stats row: total products, in-stock count, categories
- Search bar with icon (wider, more prominent)

### Category Pills
- Horizontal scroll, styled with active/inactive states
- Count badge on each category

### Product Grid
- `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` (responsive columns)
- Cards: rounded-2xl, shadow, hover scale + shadow increase
- Image: aspect-[3/4] for portrait products
- "New" badge for recently added (if createdAt available)
- Stock badge overlaid on image
- Price prominent with BDT symbol
- "অর্ডার করুন" CTA button on card

### Product Modal (bottom sheet on mobile, centered on desktop)
- Full product image (aspect-square)
- Shop info chip (shop name + phone)
- Price large and bold
- Description with proper line height
- "অর্ডার করুন" (WhatsApp) + "কল করুন" buttons (both styled)
- Share button

### Footer
- BizilCore branding (subtle)
- Shop contact info
- Copyright

### Color System
- Primary: #0F6E56
- Accent: #25D366 (WhatsApp green)
- Background: #F8F8F6 (warm white)
- Card: white
- Text: #1A1A1A
- Muted: #6B7280

## Acceptance Criteria
- [ ] Settings catalog link displays correctly on mobile (buttons wrap properly)
- [ ] Non-business users see upgrade prompt when clicking catalog tab
- [ ] Catalog page looks like a professional ecommerce website
- [ ] Product grid is responsive (2 → 3 → 4 columns)
- [ ] Product cards have hover effects
- [ ] Product modal has proper ordering UI
- [ ] WhatsApp order integration working
- [ ] Search and category filter working

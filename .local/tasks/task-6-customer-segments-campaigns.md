# Customer Segments & Smart Campaigns

## What & Why
Sellers know their customers exist but can't act on data — they have no way to identify who the top buyers are, who hasn't ordered in 60 days, or who placed their first order recently. This feature adds automatic customer segmentation with one-click targeted WhatsApp/SMS campaigns, turning customer data into revenue.

## Done looks like
- The existing Customers page gets a new "সেগমেন্ট" tab alongside the customer list.
- **Auto-segments** (computed from order history, updated on page load):
  - **VIP** — placed 5+ orders OR total spend > ৳10,000
  - **নতুন** (New) — first order within last 30 days
  - **ঝুঁকিতে** (At-Risk) — ordered before, but no order in last 45–90 days
  - **নিষ্ক্রিয়** (Dormant) — no order in 90+ days
  - **সক্রিয়** (Active) — ordered in last 30 days, not VIP
- Each segment card shows: segment name, customer count, and an actionable button "ক্যাম্পেইন পাঠান".
- Clicking "ক্যাম্পেইন পাঠান" opens a campaign modal with:
  - Pre-filled template message (editable) using the shop's WhatsApp templates
  - Customer count in segment with phone number availability count
  - Channel selector: WhatsApp or SMS
  - "পাঠান" button sends bulk messages to all customers in the segment with a phone number
- Campaign history: a simple log table showing date, segment targeted, channel, message sent, and delivery count.
- In customer detail page (`/customers/[id]`), a badge shows which segment the customer belongs to.
- Segment thresholds are computed in the API, not stored — no new DB columns needed (derived from existing Order/Customer data).

## Out of scope
- Custom segment builder with arbitrary filters (future)
- Email campaigns (future)
- A/B testing (future)
- Campaign scheduling (future)

## Tasks
1. **Segment computation API** — Create `GET /api/customers/segments` that reads all customers + their orders and computes segment membership (VIP/New/Active/At-Risk/Dormant) with counts and customer lists. No new DB columns needed.

2. **Campaign send API** — Create `POST /api/campaigns` that accepts segment ID, channel (whatsapp/sms), message text, and sends bulk messages to all segment members with a phone number. Store campaign log in a new `CampaignLog` DB model (shopId, segment, channel, message, recipientCount, sentAt).

3. **Segments tab UI** — Add a "সেগমেন্ট" tab to `app/(app)/customers/page.tsx` showing segment cards with counts, campaign modal, and campaign history table.

4. **Customer detail badge** — Add segment badge to `app/(app)/customers/[id]/page.tsx` by computing the customer's segment from their order history.

## Relevant files
- `prisma/schema.prisma`
- `app/(app)/customers/page.tsx`
- `app/(app)/customers/[id]/page.tsx`
- `app/api/customers/route.ts`
- `app/(app)/communications/page.tsx`
- `lib/whatsapp.ts`

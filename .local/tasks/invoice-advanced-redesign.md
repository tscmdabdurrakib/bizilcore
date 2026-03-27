# Invoice Page — Advanced Redesign & Features

## What & Why
Redesign the invoice list UI and add high-value features: WhatsApp/SMS invoice sending, inline item preview, overdue detection, duplicate invoice, and a smarter create form — so sellers can bill customers faster and collect payments with less effort.

## Done looks like
- Invoice list uses a rich card-style row layout: customer avatar/initials, invoice number, amount, due date with a red "বকেয়া" indicator if overdue, and a "X দিন বাকি" countdown for upcoming due dates
- Clicking a chevron on any row expands it inline to show all items (description, qty, price, subtotal) without opening a modal
- Each "sent" or "overdue" invoice has a WhatsApp button (📱) that sends a formatted invoice summary to the customer's phone via the existing WhatsApp API (using customer.phone)
- Each "sent" or "overdue" invoice has an SMS button that sends a payment reminder via the existing SMS API
- On page load, invoices where dueDate < today and status is "sent" are auto-detected and a warning banner shows "X টি ইনভয়েস বকেয়া হয়েছে" with a one-click "সব বকেয়া চিহ্নিত করুন" action
- A "Duplicate" icon on each invoice creates a copy (same items, new invoice number, draft status) instantly — no re-typing needed
- A "Print" icon opens a clean print-friendly invoice view in a new window with shop name, customer info, items table, and total
- The "নতুন ইনভয়েস" create modal shows "সাম্প্রতিক পণ্য" quick-add chips when a customer is selected, based on their last 3 invoices' items — one click adds that item to the current form

## Out of scope
- PDF file export/download (print-to-PDF via browser is sufficient)
- Bulk WhatsApp/SMS to multiple invoices at once
- Invoice editing after creation
- Public shareable invoice links

## Tasks
1. **List UI redesign** — Replace the plain table rows with richly styled card rows: customer initials avatar, highlighted invoice number, large amount, due date with color-coded "X দিন বাকি" / "বকেয়া" badge, and a collapse/expand chevron button per row.

2. **Inline item accordion** — When the row chevron is clicked, expand a sub-section showing all invoice items as a mini table (description, qty × price = subtotal) and the discount/total summary. Close on second click.

3. **WhatsApp invoice sender** — Add a WhatsApp icon button per invoice (visible when customer has a phone number). Clicking it calls `POST /api/invoices/[id]/send-whatsapp` which composes a Bengali message with the invoice number, items summary, and total, then sends it via the existing `sendWhatsAppMessage` function. The page shows a toast on success/failure.

4. **SMS reminder button** — Add an SMS icon button (visible alongside WhatsApp). Clicking it calls `POST /api/invoices/[id]/send-sms` which sends a short Bengali payment reminder via the existing `sendSMS` function.

5. **Overdue auto-detection banner** — On load, count invoices where dueDate < today and status = "sent". If any found, show a dismissible warning banner at the top with count and a "বকেয়া চিহ্নিত করুন" button that bulk-PATCHes those invoices to status "overdue".

6. **Duplicate invoice action** — Add a copy icon per row. Clicking it POSTs to `/api/invoices` with the same items and discount (no customer or due date) creating a new draft invoice, then refreshes the list with a success toast.

7. **Print invoice view** — Add a print icon per row. Clicking it fetches the invoice details and opens a new window with a formatted, print-ready HTML invoice (shop name, customer, items table, total, footer). Uses `window.open` + `document.write` approach.

8. **Quick-add recent items in create modal** — When a customer is selected in the create modal, fetch their last 3 invoices' items via `GET /api/customers/[id]/recent-invoice-items` (new endpoint). Display them as clickable chips. Clicking a chip adds that item to the current form's item list.

## Relevant files
- `app/(app)/invoices/page.tsx`
- `app/api/invoices/route.ts`
- `app/api/invoices/[id]/route.ts`
- `app/api/communications/whatsapp/send/route.ts`
- `lib/sms.ts`
- `lib/whatsapp.ts`
- `prisma/schema.prisma:499-531`

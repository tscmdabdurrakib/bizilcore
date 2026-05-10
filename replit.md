# BizilCore

A SaaS web app for Bangladeshi Facebook sellers — stock management (with product variants/Size/Color), order tracking, customer management, financial reporting, courier integration (Pathao API, RedX API, eCourier API, Paperfly, Delivery Tiger — 5 total), SMS notifications, invoice PDF, barcode/SKU, CSV bulk import, staff management, Excel export, Facebook Page integration (multiple pages), comment-to-order suggestions, subscription/payment (bKash/Nagad), product image upload, in-app notification bell, account settings, super-admin panel, dark mode, activity log, bulk WhatsApp messaging, WhatsApp API (Meta Cloud API) with message history, delivery tracking, return management, supplier detail pages, sales target progress, expense tracker, **invoice management** (card-style list with inline accordion items table, WhatsApp & SMS sending, duplicate, print, overdue detection & bulk-mark, quick-add recent items in create modal, due-date countdown badge, toast notifications), purchase orders (PO), HR management (attendance, shifts), user feedback widget, **COD Reconciliation Dashboard** (courier-grouped COD tracking with remittance dates), **Customer Segments & Smart Campaigns** (auto VIP/New/Active/At-Risk/Dormant segmentation with WhatsApp/SMS bulk campaign send), **Product Profitability & Inventory Intelligence** (per-product margin/velocity/stockout forecasting with PO quick-link), **AI Features** (OpenRouter-powered: product description generation, pricing suggestion, inventory prediction with 6hr cache, sales insight with 1hr cache — all in Bangla, with plan-based daily limits), **Order Slip / Packing Slip Generator** (A5 print/PDF/share with live customization panel, QR code, barcode, shareable public link at `/slip/[orderId]`), **Combo Pack** (bundle multiple products into a combo, sell as one line item, auto-deduct component stock on order, availableStock = min(component stocks ÷ qty), full CRUD + inventory tab + combo picker in new order + all 6 order slip templates show 📦 badge + component sub-list). Full Bangla UI. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma 7, PostgreSQL, and NextAuth.js v5 beta.

## Catering Service Module (Complete)
- **Business Type**: `"catering"` — color #EA580C (orange), ChefHat icon
- **DB Models**: `CateringMenuTemplate` (shopId/name/type/perHeadPrice/items[]/isActive); `CateringTemplateItem` (templateId/itemName/category/perHeadCost/quantity); `CateringEvent` (shopId/bookingNumber@unique/clientId?/clientName/phone/address/eventType/eventDate/eventTime/venue/guestCount/mealTypes[]/templateId?/perHeadCost/totalCost/totalAmount/profit/advancePaid/dueAmount/staffNeeded/equipmentNote/status/shoppingList(Json)/checklist(Json)/notes); `CateringEventItem` (eventId/itemName/category/perHeadCost/quantity/subtotal); `CateringPayment` (eventId/amount/method/note/paidAt)
- **Shop config fields**: `cateringBookingPrefix` @default("CAT"), `cateringDefaultMargin` @default(30), `cateringMinAdvancePct` @default(40), `cateringAutoShoppingList` @default(true), `cateringStaffPer100` @default(10)
- **Customer relation**: `cateringEvents CateringEvent[]`
- **API Routes**: `/api/catering/dashboard` (4 stat cards + upcoming events + staff planning alert), `/api/catering/menus` (GET + POST), `/api/catering/menus/[id]` (PATCH/DELETE with active-event guard), `/api/catering/events` (GET with filter + POST auto CAT-YYYY-NNN + auto checklist), `/api/catering/events/[id]` (GET full detail + PATCH: add_payment/status_update/update_checklist/save_shopping_list/complete_event), `/api/catering/reports` (6-month monthly chart + event type pie + margin stats)
- **Pages**: `/catering/menus` (template cards with items list, add/edit modal with dynamic item rows, per-head auto-sum), `/catering/events` (filter tabs + 4-step create modal: event info → menu selection → planning → payment), `/catering/events/[id]` (detail with 4 tabs: Menu/Shopping List/Checklist/Payments; status flow; complete-event modal with actual guest count recalculation; printable shopping list)
- **Dashboard**: `DashboardCatering` — orange hero, 4 stat cards, staff planning alert banner, upcoming events timeline with 3-day "Preparation শুরু করুন" alert, quick action links
- **Event types**: wedding/birthday/aqiqa/corporate/mehndi/other
- **Event statuses**: enquiry → confirmed → advance_paid → preparation → completed / cancelled
- **Meal types**: breakfast/lunch/dinner/snacks
- **Item categories**: main/starter/drink/dessert/snack/side
- **Shopping list**: auto-generated from all items × guest count; printable via window.print()
- **Checklist**: auto-generated 6 items per event; interactive toggle with progress tracker
- **Post-event completion**: actual guest count recalculates totalAmount/totalCost/profit/dueAmount
- **Nav**: Dashboard → ইভেন্ট বুকিং (/catering/events) → Menu Templates (/catering/menus) → কাস্টমার → স্টাফ (/hr) → হিসাব → রিপোর্ট (/catering/reports) → সেটিংস

## Spa / Wellness Center Module (Complete)
- **Business Type**: `"spa"` — color #9333EA (purple), Sparkle icon
- **DB Models**: `TreatmentRoom` (shopId/name/type/capacity/amenities[]/rateExtra/isActive); Spa fields added to `Service` (`therapistGender`, `isCouple`, `requiresRoom`); Spa fields added to `Appointment` (`roomId`, `therapistGenderPref`, `persons`)
- **Shop config fields**: `treatmentRooms TreatmentRoom[]`, `spaBookingPrefix` @default("SPA"), `spaSlotDuration` @default(30), `spaCleaningBuffer` @default(15), `spaCoupleEnabled` @default(true), `spaGenderPrefEnabled` @default(true), `spaAdvanceBookingDays` @default(0), `spaOpenTime` @default("09:00"), `spaCloseTime` @default("21:00")
- **API Routes**: `/api/spa/dashboard` (4 stat cards + room status grid + today's timeline), `/api/spa/rooms` (GET list + POST create), `/api/spa/rooms/[id]` (PATCH/DELETE with active booking guard), `/api/spa/therapists` (GET with today schedule + session stats), `/api/spa/reports` (monthly revenue/sessions, top services pie, peak hours bar, room utilization, therapist performance)
- **Pages**: `/spa/rooms` (RoomsBoard — card grid with type badge, amenity chips, extra rate; add/edit modal with amenity checkboxes; delete guard), `/spa/therapists` (TherapistsBoard — status cards with monthly sessions/revenue/today's schedule; links to HR), `/spa/reports` (SpaReports — monthly bar chart, services pie, peak hours bar, room utilization table, therapist performance ranking)
- **Dashboard**: `DashboardSpa` — purple hero, 4 stat cards (today's appts/available therapists/room occupancy/month revenue), quick actions, room status grid (🟢 Available 🔵 In Session), today's appointment timeline
- **Room types**: standard/vip/couple/group
- **Amenities**: bath/shower/steam/jacuzzi/sauna/ac/music/tv
- **Service extras**: `therapistGender` (male/female/any), `isCouple`, `requiresRoom`
- **Appointment extras**: `roomId` (with conflict check), `therapistGenderPref`, `persons` (1 or 2 for couple)
- **Reuses**: `/appointments` page (salon appointment system), `/services` page (service catalog), `/hr` page (staff/therapist management)
- **Nav**: Dashboard → অ্যাপয়েন্টমেন্ট → সার্ভিস → ট্রিটমেন্ট রুম (/spa/rooms) → থেরাপিস্ট (/spa/therapists) → কাস্টমার → হিসাব → রিপোর্ট (/spa/reports) → সেটিংস

## Legal Services / Lawyer Chamber Module (Complete)
- **Business Type**: `"legal"` — color #1D4ED8 (blue), Scale icon
- **DB Models**: `LegalCase` (shopId/caseNumber@unique/clientId/title/caseType/court/caseRef/filingDate/opposingParty/opposingLawyer/assignedTo/status/verdict/verdictDate/totalFee/retainerFee/paidFee/dueFee/nextHearing/notes); `CaseHearing` (shopId/caseId/hearingDate/court/judgeRef/purpose/outcome/attended/nextDate/appearanceFee/note); `CaseDocument` (shopId/caseId/docName/docType/fileUrl/submittedAt/note); `CaseFeePayment` (shopId/caseId/amount/feeType/method/note/paidAt)
- **Shop config fields**: `legalCasePrefix` @default("CASE"), `legalBarCouncilNo`, `legalHearingReminderDays` @default(2), `legalAutoSmsClient` @default(true), `legalChamberName`
- **Customer relation**: `legalCases LegalCase[]`
- **API Routes**: `/api/legal/dashboard` (4 stat cards + today's hearings + upcoming week + overdue fees 30d), `/api/legal/cases` (GET with status/search filter + POST auto CASE-YYYY-NNN), `/api/legal/cases/[id]` (GET full detail + PATCH: add_hearing/mark_attended/add_document/add_payment/status update), `/api/legal/hearings` (GET filtered by today/week/month/upcoming), `/api/legal/reports` (cases by type pie, cases by status bar, monthly chart, pending fee list, hearing attendance rate)
- **Pages**: `/cases` (CasesBoard — card list with type/status badges, next hearing badge, due fee badge, modal: 3 sections case info+parties+fee), `/cases/[id]` (CaseDetail — summary card with fee progress bar, 3 tabs: hearing timeline/documents/fee payments, add hearing/doc/payment modals, status edit), `/hearings` (HearingsBoard — day-grouped timeline with today/week/month/upcoming views, mark attended), `/legal/reports` (LegalReports — monthly bar chart, type pie, status breakdown bars, pending fee list)
- **Dashboard**: `DashboardLegal` — blue hero, confidentiality notice banner, 4 stat cards, today's hearing list with "উপস্থিত হয়েছি" button, upcoming week list, overdue fees alert (30+ days), 6 quick action links
- **Case types**: civil/criminal/family/property/labor/business/constitutional/other
- **Case statuses**: active/hearing_pending/judgement_pending/decided/appealed/closed
- **Hearing purposes**: argument/witness/judgement/adjournment/order
- **Doc types**: petition/counter/deed/affidavit/order/other
- **Fee types**: retainer/appearance/filing/other
- **Confidentiality**: All pages show "এই তথ্য সম্পূর্ণ গোপনীয়।" notice banner
- **Nav**: Dashboard → মামলা (/cases) → শুনানি সূচি (/hearings) → ক্লায়েন্ট (/customers) → হিসাব → রিপোর্ট (/legal/reports) → সেটিংস

## Car Rental / Vehicle Hire Module (Complete)
- **Business Type**: `"carrental"` — color #DC2626 (red), Car icon
- **DB Models**: `RentalVehicle` (shopId/regNumber/type/brand/model/year/color/seats/fuelType/acAvailable/dailyRate/halfDayRate/hourlyRate/monthlyRate/defaultDriverId/status/nextService/imageUrl/notes, @@unique[shopId,regNumber]); `RentalDriver` (shopId/name/phone/licenseNo/licenseType/licenseExp/nid/address/salary/salaryType/perTripRate/status/photoUrl); `RentalBooking` (shopId/bookingNumber@unique/vehicleId/customerId/driverId/clientName/clientPhone/clientNID/purpose/startDateTime/endDateTime/pickupLocation/dropLocation/startKm/endKm/rateType/units/ratePerUnit/extraKmCharge/extraHrCharge/totalAmount/advancePaid/dueAmount/status/notes); `FuelLog` (shopId/vehicleId/liters/costPerL/totalCost/kmAtFill/station/fuelDate/note); `RentalPayment` (shopId/bookingId/amount/method/note/paidAt)
- **Shop config fields**: `carBookingPrefix` @default("CAR"), `carExtraKmRate` @default(5), `carExtraHrRate` @default(100), `carMinAdvancePct` @default(30), `carAutoSms` @default(true), `carServiceDays` @default(30)
- **Customer relation**: `rentalBookings RentalBooking[]`
- **API Routes**: `/api/carrental/dashboard` (fleet map + 4 stat cards + overdue alerts + recent bookings), `/api/carrental/vehicles` (GET list with status/type filter + POST create with @@unique check), `/api/carrental/vehicles/[id]` (GET/PATCH/DELETE with active booking guard), `/api/carrental/drivers` (GET/POST), `/api/carrental/drivers/[id]` (PATCH status/DELETE=terminate), `/api/carrental/bookings` (GET filtered + POST with double-booking prevention, auto CAR-YYYY-NNN number), `/api/carrental/bookings/[id]` (PATCH: start_trip/end_trip with km calc + extra charges/cancel/add_payment), `/api/carrental/fuel` (GET with monthly totals + POST), `/api/carrental/reports` (monthly revenue chart, vehicle breakdown, driver stats, fuel vs revenue)
- **Pages**: `/carrental/fleet` (FleetBoard — vehicle card grid, status badges, service alerts, add/edit modal with all rates), `/carrental/bookings` (BookingsBoard — 3-step form: date+vehicle availability check → customer info → payment; trip start/end with km, extra charges, final payment), `/carrental/drivers` (DriversBoard — license expiry alerts, status management), `/carrental/fuel` (FuelBoard — vehicle selector, auto-calc cost from liters×rate, monthly totals), `/carrental/reports` (CarRentalReports — recharts bar + vehicle utilization + driver performance)
- **Dashboard**: `DashboardCarRental` — red hero, fleet status grid (color-coded: green=available, blue=on_trip, yellow=maintenance), overdue return alerts with "Call করুন" tel: links, 4 stat cards, service reminders, recent bookings, 6 quick action links
- **Availability check**: Double-booking prevention — checks overlapping confirmed/on_trip bookings for same vehicle before confirming
- **Vehicle types**: car/microbus/bus/motorcycle/cng/pickup with Bangla emoji labels
- **Rate types**: hourly/half_day/daily/monthly — auto-calculates total from vehicle rates
- **Nav**: Dashboard → ফ্লিট → বুকিং → ড্রাইভার → জ্বালানি লগ → কাস্টমার → হিসাব → রিপোর্ট → সেটিংস

## Kindergarten / Play School Module (Complete)
- **Business Type**: `"kindergarten"` — color #F59E0B (amber), GraduationCap icon
- **DB Models**: `MealRecord` (shopId/studentId/date/mealType/status/note, unique[studentId,date,mealType]); `DailyReport` (shopId/studentId/reportDate/mood/activities[]/ate/napped/napDuration/teacherNote/sentToParent/sentAt, unique[studentId,reportDate]); `Student` extended with kindergarten extras (`section`, `foodAllergies`, `pickupPerson1/2`, `pickupPhone1/2`, `medicalNote`); `Shop` extended with `kgOpenTime`, `kgCloseTime`, `kgBreakfastTime`, `kgLunchTime`, `kgSnackTime`, `kgAbsentSms`, `kgDailyReportSms`, `kgReportSendTime`, `kgSections[]`
- **API Routes**: `/api/kindergarten/dashboard` (stats + allergy alerts for today's present children), `/api/kindergarten/children` (GET list with search/section filter + POST create with auto KG-YYYY-NNN reg number), `/api/kindergarten/children/[id]` (GET+PATCH), `/api/kindergarten/meals` (GET per day/mealType/section + POST upsert batch), `/api/kindergarten/daily-report` (GET with attendance-filtered list + POST upsert + bulk markSent), `/api/kindergarten/reports` (analytics: attendance trend, section breakdown, meal stats, fee stats)
- **Pages**: `/children` (ChildrenBoard — card list, food allergy badge in red, registration form with pickup persons + red-highlighted allergy field), `/meals` (MealsBoard — date/mealType/section tabs, per-child 4-button meal status, sticky save), `/daily-report` (DailyReportBoard — mood emojis, activity chips, ate/nap toggles, teacher note, bulk send), `/kindergarten/reports` (KindergartenReports — attendance line chart, section bar chart, meal pie chart)
- **Dashboard**: `DashboardKindergarten` — amber hero, 4 stat cards, **always-visible allergy alert banner** (safety critical, red), attendance summary, daily report progress, 6 quick action links
- **Reuses**: School module's `/school/batches`, `/school/attendance`, `/school/fees` APIs and pages
- **Nav**: Dashboard → শিশু তালিকা (/children) → ক্লাস/গ্রুপ (/school/batches) → উপস্থিতি (/school/attendance) → খাবার ট্র্যাকিং (/meals) → ডেইলি রিপোর্ট (/daily-report) → ফি (/school/fees) → হিসাব → রিপোর্ট (/kindergarten/reports) → সেটিংস

## Electronics Repair Module (Complete)
- **Business Type**: `"electronics"` — color #3B82F6 (blue), Smartphone icon
- **DB Models**: `Device` (type/brand/model/imei/imei2/serialNumber/color/storageGB/condition/accessories/notes); `JobCard` extended with `deviceId?`, `lockCode?`, `dataBackedUp`, `warrantyDays?`, `warrantyNote?`; `electronicsJobPrefix`, `electronicsAutoSmsReady`, `electronicsWarrantyDays` added to `Shop`
- **API Routes**: `/api/devices` (GET search/filter + POST create with auto-customer), `/api/devices/[id]` (GET/PATCH/DELETE), `/api/electronics/jobcards` (GET filtered + POST create with inline device creation), `/api/electronics/dashboard` (stats), `/api/electronics/reports` (monthly revenue/profit, device-type pie, top brands, top complaints)
- **Pages**: `/devices` (DevicesBoard — card grid with IMEI, service history, quick job card link), `/electronics/reports` (ElectronicsReports — recharts bar+pie, brand ranking, complaint top-10)
- **Dashboard**: `DashboardElectronics` — blue hero card, 4 stat cards, Ready-for-pickup list, recent jobs
- **Kanban**: `/jobcards` reused — `JobCardsBoard` now accepts `businessType` prop from server page; electronics mode uses `ELECTRONICS_STATUS_COLUMNS` ("ডিভাইস এসেছে"), blue primary color, `/api/electronics/jobcards` endpoint, device intake form (device type picker + IMEI + lockCode + dataBackedUp), electronics complaint shortcuts & service checklist
- **Job Card Detail**: `JobCardDetail` auto-detects electronics via `job.device` presence — shows device brand/model/IMEI/serial, customer, lockCode/warranty/dataBackedUp badges; `/api/jobcards/[id]` now includes `device` in response
- **Job number**: `ELC-YYYY-NNN` (prefix stored in `shop.electronicsJobPrefix`)
- **Nav**: Dashboard → জব কার্ড (/jobcards) → ডিভাইস তালিকা (/devices) → পার্টস স্টক → কাস্টমার → টেকনিশিয়ান/স্টাফ (/hr) → হিসাব → রিপোর্ট (/electronics/reports) → সেটিংস

## School / Coaching Center Module (Complete)
- **Business Type**: `"school"` — added to `BusinessType`, `BUSINESS_TYPES`, `BUSINESS_TYPE_META` (blue #2563EB), `BUSINESS_MODULES`, `NAV_BY_TYPE` in `lib/modules.ts`
- **DB Models**: `Student`, `Batch`, `FeeRecord`, `AttendanceRecord`, `ExamResult` in `prisma/schema.prisma`; relations added to `Shop` (students, batches, feeRecords, attendanceRecords, examResults + 8 school settings) and `StaffMember` (teachingBatches); pushed with `npx prisma db push`
- **API Routes**: `/api/school/dashboard-stats`, `/api/school/students`, `/api/school/students/[id]`, `/api/school/batches`, `/api/school/batches/[id]`, `/api/school/fees` (GET list + POST bulk generate), `/api/school/fees/[id]` (PATCH collect payment), `/api/school/attendance` (GET + POST upsert), `/api/school/exams` (GET grouped + POST bulk entry), `/api/school/reports`
- **Pages**: `/school/students` (list + Suspense + registration form with 5 sections), `/school/students/[id]` (profile with Fees/Attendance/Exam tabs, TC button), `/school/batches` (card grid with teacher assignment), `/school/fees` (monthly fee table, bulk generate, quick collect modal, progress bar), `/school/attendance` (quick mark view with present/absent/late/leave per student, save all at once), `/school/exams` (grouped result view by exam, inline mark entry with auto grade), `/school/reports` (dedicated analytics)
- **Dashboard**: `DashboardSchool` with 4 stat cards, fee alert banner, quick action grid, batch overview table
- **Features**: Auto reg number (STU-YYYY-NNN), auto receipt number, bulk monthly fee generation per batch, grade auto-calculation (A+/A/A-/B/C/D/F), attendance upsert (unique per student+batch+date), attendance % tracking, fee status (due/partial/paid), guardian info capture, TC (transfer certificate) flow
- **Nav**: Dashboard → শিক্ষার্থী → ব্যাচ → ফি ম্যানেজমেন্ট → উপস্থিতি → পরীক্ষার ফলাফল → শিক্ষক/স্টাফ (/hr) → হিসাব → রিপোর্ট (`/school/reports`)

## Convention Hall / Event Module (Complete)
- **Business Type**: `"convention"` — added to `BusinessType`, `BUSINESS_TYPES`, `BUSINESS_TYPE_META` (purple #7C3AED), `BUSINESS_MODULES`, `NAV_BY_TYPE` in `lib/modules.ts`
- **DB Models**: `Hall`, `EventPackage`, `HallEvent`, `EventVendor`, `EventPayment` in `prisma/schema.prisma`; relations added to `Shop` (halls, eventPackages, hallEvents) and `Customer` (hallEvents); pushed with `npx prisma db push`
- **API Routes**: `/api/convention/dashboard-stats`, `/api/convention/halls`, `/api/convention/halls/[id]`, `/api/convention/packages`, `/api/convention/packages/[id]`, `/api/convention/events`, `/api/convention/events/[id]`, `/api/convention/events/[id]/payments`, `/api/convention/events/[id]/vendors`, `/api/convention/reports`
- **Pages**: `/convention/halls` (hall management, capacity/amenities/pricing), `/convention/packages` (event package builder with items), `/convention/events` (calendar + list view, multi-step booking form), `/convention/events/[id]` (full detail: status, payments, vendors, auto-checklist), `/convention/reports` (dedicated analytics with monthly charts, hall utilization, event type breakdown, top clients)
- **Dashboard**: `DashboardConvention` component with 4 stat cards, today's events, upcoming bookings, hall availability quick view
- **Features**: Calendar-based booking with conflict detection, event type auto-checklist (wedding/birthday/aqiqa/corporate etc.), advance payment tracking with due calculation, vendor assignment, hall utilization analytics, Bangla UI throughout
- **Nav**: Dashboard → হলের ইভেন্ট (events) → হল ব্যবস্থাপনা (halls) → প্যাকেজ (packages) → কাস্টমার → হিসাব → রিপোর্ট (`/convention/reports`)

## Lab / Diagnostic Center Module (Complete)
- **Business Type**: `"lab"` — added to `BusinessType`, `BUSINESS_TYPES`, `BUSINESS_TYPE_META`, `BUSINESS_MODULES`, `NAV_BY_TYPE` in `lib/modules.ts`
- **DB Models**: `LabTest`, `TestPackage`, `TestPackageItem`, `TestOrder`, `TestOrderItem`, `TestResult` in `prisma/schema.prisma`; lab relations + settings (`labOrderPrefix`, `labAutoSmsReady`, `labPathologistName`, `labRegistrationNo`) added to `Shop`; `testOrders` relation added to `Customer`
- **API Routes**: `/api/lab/tests` (CRUD for test catalog), `/api/lab/packages` (CRUD for test packages), `/api/lab/orders` (create + list orders), `/api/lab/orders/[id]` (PATCH for sample collection, status updates), `/api/lab/results` (GET pending + POST save results + GET by orderNumber), `/api/lab/dashboard` (stats)
- **Pages**: `/lab/tests` (test catalog with category tabs + add test modal + package management), `/lab/testorders` (3-step registration: patient → tests → payment, with token slip print), `/lab/results` (result entry list with inline panel), `/lab/results/[orderNumber]` (printable report with flag coloring)
- **Dashboard**: `DashboardLab` component with 4 stat cards, today's queue table with sample collection actions, home collection list, quick navigation links
- **Features**: Auto-flag (normal/high/low/critical) based on value vs normal range, critical value alerts, auto order number (LAB-YYYY-NNN), home collection support, urgency (normal/urgent), package shortcuts in order form, patient search with new patient creation

## Gym / Fitness Center Module (Complete)
- **Business Type**: `"gym"` — added to `BusinessType`, `BUSINESS_TYPES`, `BUSINESS_TYPE_META` (violet #7C3AED, Dumbbell icon), `BUSINESS_MODULES` (9 modules), `NAV_BY_TYPE` in `lib/modules.ts`
- **DB Models**: `MembershipPlan`, `Member`, `GymTrainer`, `TrainingSession`, `GymAttendance`, `MemberPayment`, `BodyStat`, `Equipment` in `prisma/schema.prisma`; gym relations + config fields (`gymMemberPrefix`, `gymOpenTime`, `gymCloseTime`, `gymExpiryAlertDays`, `gymAutoSmsExpiry`) added to `Shop`; pushed with `npx prisma db push`
- **API Routes**: `/api/gym/stats` (dashboard), `/api/gym/members` (CRUD + list with search/filter), `/api/gym/members/[id]` (GET profile + PATCH with actions: renew/freeze/payment/body_stat), `/api/gym/memberships` (plan CRUD), `/api/gym/attendance` (GET today/currentlyIn + POST checkin/checkout), `/api/gym/trainers` (CRUD), `/api/gym/equipment` (CRUD)
- **Pages**: `/gym/members` (MembersBoard — search/filter tabs + 3-step registration with plan cards), `/gym/members/[id]` (MemberDetail — membership status bar with progress, tabs: body stats/attendance/payments/sessions, renew/freeze/payment modals), `/gym/memberships` (plan CRUD with feature checkboxes), `/gym/attendance` (real-time check-in/out, live member list, today's log), `/gym/trainers` (trainer profiles with session/member counts), `/gym/equipment` (CRUD with service alerts), `/gym/reports` (revenue chart + expiring list), `/gym/settings`
- **Dashboard**: `DashboardGym` with 4 stat cards, expiry alert banner, currently-in-gym live widget, expiring members list; wired into `app/(app)/dashboard/page.tsx`
- **Features**: Auto member ID (GYM-YYYY-NNN), BMI auto-calculation (weight/height²), membership expiry progress bar (green→amber→red), freeze extension, body stats tracking with weight line chart, real-time attendance (30s auto-refresh), service alerts for equipment due within 7 days, full Bangla UI
- **Nav**: Dashboard → সদস্য → মেম্বারশিপ প্ল্যান → উপস্থিতি → ট্রেইনার → সরঞ্জাম → হিসাব → রিপোর্ট → সেটিংস

## Travel Agency Module (Complete)
- **Business Type**: `"travel"` — added to `BusinessType`, `BUSINESS_TYPES`, `BUSINESS_TYPE_META` (cyan #0891B2, Plane icon), `BUSINESS_MODULES` (9 modules), `NAV_BY_TYPE` in `lib/modules.ts`
- **DB Models**: `TourPackage`, `TourBooking`, `TravelTicket`, `VisaRequest`, `TravelVendor`, `TravelPayment` in `prisma/schema.prisma`; travel relations + settings (`travelBookingPrefix`, `travelVisaPrefix`, `travelAutoSms`, `travelVendors`) added to `Shop`; `travelBookings`/`visaRequests` added to `Customer`; pushed with `npx prisma db push`
- **API Routes**: `/api/travel/stats` (dashboard stats), `/api/travel/packages` (CRUD tour packages), `/api/travel/bookings` (GET list + POST create + DELETE), `/api/travel/bookings/payment` (record payment), `/api/travel/visa` (CRUD visa requests + status update), `/api/travel/vendors` (CRUD with due tracking)
- **Pages**: `/travel/packages` (PackagesBoard — card grid CRUD), `/travel/bookings` (BookingsBoard — 3-step booking form with type tabs, detail panel, payment modal), `/travel/visa` (VisaBoard — status tabs, inline status update, creation modal), `/travel/vendors` (VendorsBoard — vendor CRUD with payment flow), `/travel/reports` (recharts bar chart + pending due table), `/travel/settings` (agency config + numbering + SMS toggle)
- **Dashboard**: `DashboardTravel` with 4 stat cards, upcoming travel list (7 days), booking type breakdown, quick action links; wired into `app/(app)/dashboard/page.tsx`
- **Features**: Auto-booking number (TRV-YYYY-NNN), auto-visa number (VISA-YYYY-NNN), booking types (package/ticket/hotel/hajj_umrah/visa/custom), visa status tracking (submitted/processing/approved/rejected/collected), vendor due tracking with partial payment flow, 7-day upcoming travel widget, full Bangla UI
- **Nav**: Dashboard → ট্যুর প্যাকেজ → বুকিং → ভিসা ট্র্যাকিং → Vendor → কাস্টমার → হিসাব → রিপোর্ট → সেটিংস

## Hospital / Clinic Module (Complete)
- **Business Type**: `"hospital"` — added to `BusinessType`, `BUSINESS_TYPES`, `BUSINESS_TYPE_META` (blue #378ADD, Stethoscope icon), `BUSINESS_MODULES`, `NAV_BY_TYPE` in `lib/modules.ts`
- **DB Models**: `Doctor`, `HospitalPatient`, `OPDVisit`, `OPDTestRequest`, `IPDAdmission`, `IPDCharge`, `IPDNote`, `Bed` in `prisma/schema.prisma`; hospital config fields added to `Shop` (`hospitalFacilityType`, `hospitalRegNumber`, `hospitalEmergencyPhone`, `hospitalTokenResetTime`, `hospitalAdmissionPrefix`, `hospitalOpdPrefix`, `hospitalPatientPrefix`, `hospitalShowVitals`, `hospitalAutoSms`); pushed with `npx prisma db push`
- **API Routes**: `/api/hospital/dashboard-stats`, `/api/hospital/doctors` (CRUD + `[id]`), `/api/hospital/patients` (CRUD + `[id]`), `/api/hospital/opd` (CRUD + `[id]`), `/api/hospital/ipd` (CRUD + `[id]` + charges/notes/discharge), `/api/hospital/beds` (CRUD + `[id]`), `/api/hospital/billing`, `/api/hospital/reports`, `/api/hospital/settings` (GET/PATCH)
- **Pages**: `/hospital/doctors` (DoctorsBoard), `/hospital/opd` (OPDBoard — 3-step token form + queue management), `/hospital/ipd` (IPDBoard — bed map + admission + charges/notes/discharge), `/hospital/patients` (PatientsBoard — visit history), `/hospital/billing` (BillingBoard), `/hospital/reports` (HospitalReports with recharts)
- **Dashboard**: `DashboardHospital` with 5 stat cards, today's OPD queue, bed occupancy, ward availability
- **Settings**: "হাসপাতাল কনফিগ" + "Bed ব্যবস্থাপনা" tabs added to `/settings` page (conditionally shown when businessType === "hospital")
- **Shared**: `components/hospital/HospitalDisclaimer.tsx` — medical disclaimer shown on all patient-facing pages
- **Nav**: Dashboard → ডাক্তার → OPD (বহির্বিভাগ) → IPD ভর্তি → রোগী → বিলিং → রিপোর্ট
- **Features**: Auto patient ID (PAT-YYYY-NNN), OPD token queue with 3-step flow (patient lookup → vitals → prescribe), IPD bed map with ward grouping, charge/note timeline, discharge summary, bed availability tracking

## Garage / Auto Service Center Module (Phase 6 — Complete)
- **DB Models**: `Vehicle`, `JobCard`, `JobCardPart`, `JobCardService` added to `prisma/schema.prisma`; `garageJobPrefix` added to `Shop`; `vehicles` relation added to `Customer`; `jobCardParts` added to `Product`
- **API Routes**: `/api/vehicles`, `/api/vehicles/[id]`, `/api/jobcards`, `/api/jobcards/[id]`, `/api/jobcards/[id]/parts`, `/api/jobcards/[id]/services`, `/api/jobcards/[id]/payment`, `/api/jobcards/[id]/deliver`, `/api/garage/dashboard`, `/api/garage/reports`
- **Pages**: `/dashboard` (DashboardGarage), `/jobcards` (kanban + list view, 3-step new job card modal), `/jobcards/[id]` (full detail: status, parts, services, billing, payment, delivery), `/vehicles` (vehicle list with search), `/vehicles/[id]` (vehicle profile + service history)
- **Kanban Board**: 6 columns — received → diagnosing → waiting_parts → repairing → quality_check → ready + delivered filter
- **Job Card Features**: auto job number, priority (normal/urgent/express), mechanic assignment, estimated delivery, complaint shortcuts, service checklist, parts from stock or manual, live bill calculation, advance tracking, payment collection, delivery with mileage out
- **lib/modules.ts**: garage added to all type maps, nav has dashboard/jobcards/vehicles/inventory/customers/hr/hisab/reports

## Restaurant Module (Task #5 — Complete)
- **DB Models**: `DiningTable`, `MenuItem`, `RestaurantOrder`, `RestaurantOrderItem` — all created and pushed
- **API Routes**: `/api/restaurant/tables`, `/api/restaurant/tables/[id]`, `/api/restaurant/menu-items`, `/api/restaurant/menu-items/[id]`, `/api/restaurant/orders`, `/api/restaurant/orders/[id]`
- **Pages**: `/tables` (floor map), `/menu` (menu management), `/kitchen` (KDS), `/orders` (restaurant-aware wrapper)
- **lib/modules.ts**: Added `/menu` nav item + `ScrollText` icon for restaurant type
- **Orders page**: Converted to server component that renders `RestaurantOrders` or `FCommerceOrders` based on `businessType`
- **Components**: `components/orders/FCommerceOrders.tsx` + `components/orders/RestaurantOrders.tsx`

## Sales Channel Feature (Complete)
- `salesChannel` field on Shop (`online` | `offline` | `both`)
- Onboarding step, settings modal, sidebar filtering all implemented
- `lib/modules.ts`: `SALES_CHANNEL_META`, `ONLINE_ONLY_MODULES`, `OFFLINE_ONLY_MODULES`, `isValidSalesChannel()`
- `/api/settings/sales-channel` PATCH route

## Stack
- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (custom tokens via `@theme` in globals.css)
- **Database**: PostgreSQL (Supabase hosted) + Prisma 7 ORM with `@prisma/adapter-pg`
- **Auth**: NextAuth.js v5 (beta) with CredentialsProvider (email + password + bcrypt)
- **Charts**: Recharts
- **Font**: Inter (Google Fonts)
- **Package manager**: npm

## Running the App
```
npm run dev   # starts on port 5000
```
The "Start application" workflow manages this automatically.

## Database (Supabase)
- **Runtime URL**: `SUPABASE_DATABASE_URL` (transaction pooler, port 6543, `pgbouncer=true`)
- **Migration URL**: `SUPABASE_DIRECT_URL` (session pooler, port 5432) — password has `[brackets]` auto-stripped
- Both secrets set in Replit environment. Fallback to local `DATABASE_URL` if Supabase secrets absent.
- Admin user: `mdabdurrakib806@gmail.com` (isAdmin=true)

## Prisma Quirk (v7)
- `url` is NOT in `prisma/schema.prisma` — it lives in `prisma.config.ts`
- `prisma.config.ts` auto-strips `[brackets]` from password in `SUPABASE_DIRECT_URL`
- Client uses `@prisma/adapter-pg` + `Pool`
- After schema changes: `npx prisma db push && npx prisma generate`

## Project Structure
```
app/
  (marketing)/          # Public pages (route group)
    page.tsx            # Home (8 sections: hero, features, trust, etc.)
    features/page.tsx   # Features page
    pricing/page.tsx    # Pricing page
    blog/page.tsx       # Blog listing
    about/page.tsx      # About page
    contact/page.tsx    # Contact page
  (auth)/               # Auth pages (route group)
    login/page.tsx      # /login
    signup/page.tsx     # /signup
    forgot-password/    # /forgot-password
  (app)/                # Authenticated app (route group)
    layout.tsx          # App shell: AppSidebar + AppTopbar
    dashboard/page.tsx  # Stats, bar chart, recent orders, low stock
    inventory/page.tsx  # Product list with search/filter/delete
    inventory/new/page.tsx # Add product form
    orders/page.tsx     # Order list with status filter tabs
    orders/new/page.tsx # Complex order form (customer + products + payment)
    orders/[id]/page.tsx # Order detail + status update + payment
    customers/page.tsx  # Customer list with search
    customers/new/page.tsx # Add customer form
    customers/[id]/page.tsx # Customer profile + order history
    hisab/page.tsx      # Transaction ledger + add income/expense modals
    reports/page.tsx    # Charts (trend, pie, top products) + monthly P&L
    settings/page.tsx   # Tabbed settings (shop profile, subscription, notifications)
  onboarding/page.tsx   # 3-step onboarding wizard
  api/
    auth/[...nextauth]/ # NextAuth handler
    register/           # POST — create user
    onboarding/         # PATCH — complete onboarding
    products/           # GET/POST
    products/[id]/      # PATCH/DELETE
    orders/             # GET/POST
    orders/[id]/        # GET/PATCH (status + payment)
    customers/          # GET/POST
    customers/[id]/     # GET/PATCH
    transactions/       # GET/POST/DELETE
    settings/           # GET/PATCH

lib/
  auth.ts               # NextAuth full config (with Prisma, server only)
  prisma.ts             # Prisma client singleton (adapter-pg)
  getShop.ts            # requireShop() — server-side auth + shop check
  utils.ts              # formatBDT, formatBanglaDate, formatRelativeDate, STATUS_MAP, cn()

components/
  AppSidebar.tsx        # Desktop sidebar + mobile bottom nav (client)
  AppTopbar.tsx         # Top bar with page title + new order button (client)
  SalesBarChart.tsx     # Recharts BarChart for 7-day sales (client)

auth.config.ts          # NextAuth lightweight config for proxy (no Prisma)
proxy.ts                # Route protection middleware (Next.js 16 convention)
prisma/schema.prisma    # 9 models: User, Shop, Product, Customer, Order, OrderItem, Transaction, StaffMember, ActivityLog, Subscription, Payment
```

## Auth Flow
- **Signup** → POST /api/register → auto sign-in → /onboarding
- **Login** → `user.onboarded === true` → /dashboard, else → /onboarding
- **Protected routes**: /dashboard, /inventory, /orders, /customers, /hisab, /reports, /settings, /onboarding

## Brand Logo
- Centralized component: `components/BrandLogo.tsx` — used everywhere. Props: `size` (xs/sm/md/lg/xl), `tone` (dark/light), `iconOnly`, `href`, `showTagline`.
- Icon: `public/brand-icon.png` (green rounded-square with stylized "B" symbol — original supplied by user, do not replace with old `/logo.svg`, `/logo-black.svg`, `/logo-white.svg`).
- Wordmark: "BizilCore" rendered in **Sora** font (loaded via `next/font/google` in `app/layout.tsx` as `--font-sora`). The "**C**" of "Core" is highlighted with a green gradient pill (`#0F6E56→#1BAA78` for dark tone, `#1BAA78→#5EECA0` for light tone) with white letter inside, soft glow, slight upward translate.
- Used in: Navbar, Footer, AppSidebar (collapsed = iconOnly), OnboardingWizard, not-found, login, signup, forgot-password. Old `/logo*.svg` images are NOT referenced in app code anymore (kept only for `/logo-email.png` mailer use).

## Design Tokens
- Primary: #0F6E56 | PrimaryLight: #E1F5EE
- Bg: #F7F6F2 | Surface: #FFFFFF | Border: #E8E6DF
- Text: #1A1A18 | Secondary: #5A5A56 | Muted: #A8A69E
- Error: #E24B4A | Warning: #EF9F27 | Info: #2B7CE9
- Input: 40px height, 8px border-radius, focus border #0F6E56

## Environment Variables
- `DATABASE_URL` — Replit managed PostgreSQL (auto-set)
- `AUTH_SECRET` — NextAuth JWT secret (set via Replit secrets)
- `NEXTAUTH_URL` — App URL (set to http://localhost:5000)
- `BKASH_BASE_URL`, `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD` — bKash sandbox/production
- `NAGAD_BASE_URL`, `NAGAD_MERCHANT_ID`, `NAGAD_MERCHANT_PRIVATE_KEY`, `NAGAD_PUBLIC_KEY` — Nagad sandbox/production
- `CRON_SECRET` — Authorization header for /api/cron/check-subscriptions

## Payment + Subscription (Phase 2 Step 4)
- `lib/features.ts` — PLAN_LIMITS map (free/pro/business), canAccessFeature(), isWithinLimit()
- `lib/bkash.ts` — createBkashPayment(), executeBkashPayment(); demo mode fallback when env vars missing
- `lib/nagad.ts` — createNagadPayment(), verifyNagadPayment(); demo mode fallback
- `hooks/useSubscription.ts` — React hook: subscription state, plan, daysLeft, canAccess(), isExpiringSoon
- `app/api/subscription/route.ts` — GET current subscription + payment history; auto-create free sub
- `app/api/payment/bkash/route.ts` — POST create payment + redirect URL
- `app/api/payment/bkash/callback/route.ts` — GET/POST handle bKash callback + activate subscription
- `app/api/payment/nagad/route.ts` — POST create Nagad payment
- `app/api/payment/nagad/callback/route.ts` — GET handle Nagad callback + activate subscription
- `app/api/cron/check-subscriptions/route.ts` — GET daily expiry check (Bearer CRON_SECRET)
- `app/payment/success/page.tsx` — Payment success page with plan details
- `app/payment/cancel/page.tsx` — Payment cancel page

## Upgrade Flow
1. Settings > Subscription tab → "আপগ্রেড করুন"
2. UpgradeModal: Step 1 (plan), Step 2 (duration 1/3/6 months with discounts), Step 3 (bKash/Nagad)
3. POST /api/payment/{method} → redirectUrl (demo) or gateway URL
4. Callback → activateSubscription() → upsert Subscription, complete Payment
5. Redirect to /payment/success?paymentId=...&demo=1 → activate via POST to callback
- In demo mode (no gateway keys): auto-activates subscription for testing

## Status Map (Order)
pending → confirmed → shipped → delivered | returned
All labels shown in Bangla UI via STATUS_MAP in lib/utils.ts

## Courier Integration (Phase 2 Step 1)
- `lib/pathao.ts` — Pathao Merchant API: bookPathaoDelivery(), getPathaoStatus(); token caching
- `lib/redx.ts` — RedX API: bookRedxDelivery(), getRedxStatus()
- `lib/steadfast.ts` — Steadfast Courier API: bookSteadfastDelivery(), getSteadfastStatus()
- `app/api/courier/route.ts` — POST (book courier → saves trackingId, sets status=shipped, codStatus=with_courier); GET (refresh status from provider)
- `app/api/webhooks/pathao/route.ts` — POST (receive Pathao status push, update DB)
- Active couriers: Pathao, RedX, Steadfast (eCourier removed)

## Task #10 — Store Foundation & Public Storefront (Complete)
- **Multi-tenant e-commerce storefront**: `/store/[slug]` — public, no auth required
- **Theme system**: Full layout-level theme system in `lib/themes/index.ts` with `ThemeConfig` type. 5 themes: bold, elegant, fresh, minimal, vibrant — each with distinct navStyle, heroStyle, productCardStyle, footerStyle, typography, colors, sectionOrder. `StoreThemeProvider` exposes `{ theme, primary, accent, defaults }` via `useStoreTheme()`.
- **Store pages**: home (hero/categories/featured/all), products list (search/filter/sort), product detail (variants/gallery/reviews), cart (qty/remove/coupon), checkout (name/address/district/payment), order-success, track
- **Dynamic store components**: `DynamicNav` (topbar_logo_left/topbar_centered/minimal_sticky), `DynamicHero` (fullwidth_image/split_text_image/banner_slider/text_only_centered), `DynamicProductCard` (image_overlay/borderless/shadow_card/outlined). Theme selector page at `app/(app)/store/theme/page.tsx` with SVG mockup previews.
- **Zustand cart**: `lib/store/cart.ts` — persisted, auto-clears on shop change
- **Bangladesh shipping**: `lib/store/bangladesh.ts` — Dhaka metro vs outside district logic
- **Public API routes**: `/api/store/[slug]`, `/api/store/[slug]/products`, `/api/store/[slug]/products/[id]`, `/api/store/orders` (POST, creates StoreOrder + SMS), `/api/store/validate-coupon` (POST), `/api/store/track` (GET)
- **DB models**: `StoreOrder`, `StoreOrderItem`, `StoreReview`, `Coupon` — all in schema + pushed
- **Shop store fields**: 22 fields added to Shop (storeSlug @unique, storeEnabled, storeTheme, storePrimaryColor, storeAccentColor, storeBannerUrl, storeTagline, storeAbout, storeShowReviews, storeShowStock, storeCODEnabled, storeBkashNumber, storeNagadNumber, storeMinOrder, storeFreeShipping, storeShippingFee, storeSocialFB, storeSocialIG, storeSocialWA)
- **Product store fields**: `storeVisible`, `storeFeatured` on Product model

### Courier settings (stored in DB per user):
- PathaoSettings: clientId, clientSecret, username, password, storeId, sandboxMode
- RedxSettings: apiKey
- SteadfastSettings: apiKey, secretKey

### Order model courier fields:
courierName (pathao|redx|steadfast), courierTrackId, courierStatus (booked/picked/transit/delivered/returned), courierBookedAt
codStatus (with_courier/collected/returned) — driven by courier booking

## Phase 6 — Hotel/Guesthouse Module (Complete)
- **DB models**: `Room`, `Booking`, `RoomServiceOrder`, `HousekeepingLog` + Shop hotel config (checkInTime, checkOutTime, lateFee, earlyFee, minAdvancePct, autoHousekeeping)
- **Booking number**: `BK-YYYY-NNN` per shop, generated **inside** `prisma.$transaction` with `@@unique([shopId, bookingNumber])` and P2002 retry (max 5)
- **APIs (all tenant-scoped, all `logActivity`-audited)**:
  - Rooms: `/api/rooms` GET/POST, `/api/rooms/[id]` GET/PATCH/DELETE (delete blocked when active booking)
  - Bookings: `/api/bookings` GET/POST (with conflict re-check inside transaction → 409), `/api/bookings/[id]` GET/PATCH (cancel)
  - Booking actions: `/api/bookings/[id]/check-in|check-out|payment|services` — check-out clamps NaN/negatives, payment blocks on cancelled
  - Hotel: `/api/hotel/availability` GET, `/api/hotel/dashboard-stats` GET
  - Housekeeping: `/api/housekeeping` GET/POST (tenant-scoped staffId), `/api/housekeeping/[id]` PATCH with strict state machine (`pending→in_progress→done`; cancel from pending/in_progress only)
- **Pages**: `/rooms` (grid), `/bookings` (status tabs + 3-step new modal), `/bookings/[id]` (detail with all actions + room service + payment), `/housekeeping` (3-column kanban)
- **Dashboard**: `components/dashboards/DashboardHotel.tsx` — 4 stat cards, room occupancy mini-grid, today activity feed; wired into `app/(app)/dashboard/page.tsx` via `businessType === "hotel"` branch
- **Modules registry**: `hotel` BusinessType added with Bed icon (green), navigation groups, full module list
- **Migrations applied**: `20260426160000_add_hotel_module`, `20260426170000_booking_number_per_shop_unique`
- **Architect-reviewed**: 5 initial findings + 3 follow-ups all resolved (cross-tenant customerId, atomic conflict check, services status guard, NaN/negative input rejection, housekeeping state machine, per-shop bookingNumber uniqueness with race retry)

## Phase 7 — Review & Testimonial System (Growth Feature 5) (Complete)
- **DB models**: `AppReview` (one per user via `userId @unique`, with `improvementNote` for low ratings), `NPSSurvey`
- **Review prompt eligibility** (server + client checks): account >30 days old, totalOrders >= 10, no existing review; localStorage `review_dismissed_until` snoozes 30 days; sessionStorage prevents repeat in-session
- **Review modal**: 5-star with hover/select labels, free-text body, branches on rating — `>=4` shows Play Store CTA, `<=3` shows improvement note prompt
- **NPS banner** (in-page, dismissible): every 90 days from last survey or signup; 0–10 buttons color-coded (red/amber/green); detractor/passive/promoter follow-ups; promoter routes to `/affiliate`
- **APIs**:
  - `/api/reviews` POST (eligibility + race-safe insert via `P2002` → 409), PATCH (improvement note)
  - `/api/reviews/eligibility` GET
  - `/api/nps` POST (90-day cooldown enforced server-side, 429 if too recent), PATCH (reason)
  - `/api/nps/eligibility` GET
  - `/api/admin/reviews` GET (filter: all|pending|approved|onsite), `/api/admin/reviews/[id]` PATCH/DELETE — `isAdmin` guarded
  - `/api/public/testimonials` GET — masked names (first + last initial), max 6, body truncated to 150 chars
- **Pages**:
  - `/admin/reviews` — approve / show-on-site toggle / un-approve / delete with filter tabs (added to admin nav)
  - Marketing landing — `<TestimonialsSection />` RSC inserted before FAQ; auto-hides if zero approved+visible reviews
- **App-shell wiring**: `components/growth/GrowthPrompts.tsx` mounted in `app/(app)/layout.tsx` — defers eligibility checks 1.5s post-mount, renders modal/banner conditionally
- **Migrations**: `20260426180000_add_review_nps`, `20260426190000_app_review_user_unique`
- **Architect-reviewed (PASS)**: server-side eligibility on review submit, server-side NPS cooldown, DB-level uniqueness on AppReview.userId — all critical findings addressed

## Phase 7.1 — Admin "Request Review" feature (Complete)
- **Problem solved**: organic eligibility (30-day account + 10 orders) makes the review modal hard to test/trigger. Admins now have a manual override.
- **DB**: added `User.reviewRequestedAt: DateTime?` (migration `20260426200000_add_review_requested_at`).
- **APIs**:
  - `POST /api/admin/users/[id]/request-review` — atomic `updateMany` with `appReviews: { none: {} }` predicate (no TOCTOU, returns 409 if already reviewed); refuses admin targets
  - `DELETE /api/admin/users/[id]/request-review` — cancel pending request; validates target exists/non-admin
  - `GET /api/admin/users` — now includes `reviewRequestedAt` and `appReviews[0]` (rating, id) per user
- **Eligibility bypass**:
  - `/api/reviews/eligibility` — if `reviewRequestedAt` set + no existing review → eligible (bypasses age/order checks)
  - `POST /api/reviews` — same bypass; on successful submit, clears `reviewRequestedAt` unconditionally inside the same `prisma.$transaction` as the create (race-safe vs concurrent admin requests)
- **UI** (`/admin/users` page):
  - "Request Review" button (blue) on each active user with no review and no pending request
  - "Cancel" button when a request is pending
  - Status badges: "Review request pending" (blue) and "★ Submitted" (yellow) with the submitted star count
- **Architect-PASS** after 2 rounds: all race conditions (admin flag re-targeting reviewed user, transaction atomicity, target validation on DELETE) resolved.

## Photography / Videography Module (Complete)
- **Business Type**: `"photography"` — added to `BusinessType`, `BUSINESS_TYPES`, `BUSINESS_TYPE_META` (pink #DB2777, Camera icon), `BUSINESS_MODULES` (9 modules), `NAV_BY_TYPE` in `lib/modules.ts`
- **DB Models**: `PhotoPackage`, `PhotoBooking`, `BookingTeamMember`, `BookingEquipmentItem`, `PhotoEquipment`, `PhotoPayment` in `prisma/schema.prisma`; photo relations + config fields (`photoBookingPrefix`, `photoAutoSms`, `photoStudioName`) added to `Shop`; `photoBookings` relation added to `Customer`; pushed with `npx prisma db push`
- **API Routes**: `/api/photography/bookings` (GET list + POST create), `/api/photography/bookings/[id]` (GET + PATCH status/checklist/team/equipment + DELETE), `/api/photography/packages` (GET + POST), `/api/photography/packages/[id]` (PATCH + DELETE), `/api/photography/equipment` (GET + POST), `/api/photography/equipment/[id]` (PATCH + DELETE), `/api/photography/payments` (POST — records payment, updates booking amounts), `/api/photography/stats` (dashboard stats)
- **Pages**: `/photography/bookings` (Kanban + List view, 3-step booking form), `/photography/bookings/[id]` (full detail: status actions, checklist, team, equipment, payments, portfolio toggle, delivery form), `/photography/packages` (package cards with chip inputs for includes/deliverables), `/photography/equipment` (equipment tracker with insurance expiry alerts, "currently booked" badge), `/photography/portfolio` (toggle portfolio visibility per delivered booking), `/photography/reports` (monthly revenue chart, event type pie chart, avg delivery time, pending deliveries list), `/photography/settings`
- **Dashboard**: `DashboardPhotography` component with 4 stat cards (monthly bookings, upcoming shoots 7 days, editing pending, monthly revenue), editing alert banner, upcoming shoots list, editing pipeline with overdue detection; wired into `app/(app)/dashboard/page.tsx`
- **Features**: Auto booking number (PHO-YYYY-NNN), Kanban pipeline (Enquiry→Confirmed→Advance Paid→Shoot Done→Editing→Delivered), pre-shoot checklist (6 items with JSON persistence), delivery via Google Drive / WeTransfer link with copy button, team member assignment with roles, equipment checklist per booking, portfolio visibility toggle (privacy-preserving — no client names), event type icons (Wedding/Birthday/Corporate/Portrait/Product/Other), editing overdue detection (days since shoot vs package editingDays), delivery date auto-calculation from eventDate + editingDays, full Bangla UI
- **Onboarding**: Automatically appears in business type selector (uses BUSINESS_TYPES + BUSINESS_TYPE_META)
- **Nav**: Dashboard → বুকিং (Kanban) → প্যাকেজ → পোর্টফোলিও → সরঞ্জাম → ক্লায়েন্ট → হিসাব → রিপোর্ট → সেটিংস

## Laundry / Dry Cleaning Module (Complete)
- **Business Type**: `"laundry"` — added to `BusinessType`, `BUSINESS_TYPES`, `BUSINESS_TYPE_META` (blue #0284C7, Droplets icon), `BUSINESS_MODULES` (8 modules), `NAV_BY_TYPE` in `lib/modules.ts`
- **DB Models**: `LaundryService`, `LaundryOrder`, `LaundryOrderItem`, `LaundryPayment` — appended to `prisma/schema.prisma`; created in DB via psql directly (no prisma generate due to memory/shadow DB constraints); all queries use `$queryRaw`/`$executeRaw`
- **API Routes**: `/api/laundry/services` (GET list, POST create, PATCH update, DELETE), `/api/laundry/orders` (GET list with status/search/today filters + POST create with items + payment), `/api/laundry/orders/[id]` (GET detail, PATCH status + payment collection)
- **Components**: `components/dashboards/DashboardLaundry.tsx` (stat cards, status pipeline, ready orders list, quick links), `components/orders/LaundryOrders.tsx` (3-step new order form: client info → items → payment; status update; collect payment modal; status tabs; search), `components/services/LaundryServices.tsx` (service pricing CRUD by category with toggle active, express price), `components/delivery/LaundryDelivery.tsx` (Ready/Out-for-delivery dual-column layout with action buttons)
- **Pages**: `app/(app)/orders/page.tsx` → `LaundryOrders`, `app/(app)/services/page.tsx` → `LaundryServices` (refactored to server router; existing salon code moved to `components/services/SalonServices.tsx`), `app/(app)/delivery/page.tsx` → `LaundryDelivery`, `app/(app)/dashboard/page.tsx` → `DashboardLaundry`
- **Features**: Order number format LDR-YYYY-NNN, 6 statuses (received/in_process/ready/out_for_delivery/delivered/cancelled), Express service flag with delivery date auto-calc, Drop-in vs Pickup & Delivery order types, tag number per item, item condition notes, advance/due payment tracking, service pricing by category (Wash & Iron / Dry Clean / Wash Only / Iron Only / Special), quick-add item chips (Shirt/Pant/Saree etc.), service catalog with express pricing, full Bangla UI
- **Nav**: Dashboard → অর্ডার → সার্ভিস প্রাইসিং | কাস্টমার → ডেলিভারি | হিসাব → রিপোর্ট | সেটিংস

## Gamification & Loyalty Module — Phase 2 Upgrade (Complete)
Built on top of the existing basic gamification skeleton (which had `streak`, `lastLoginDate`, `badges String[]`, a simple `GamificationWidget`, and `/api/gamification`).

**What was upgraded/added:**
- **DB**: Added `xpPoints Int @default(0)` and `level String @default("নতুন বিক্রেতা")` to User; added `UserBadge` model (userId, badgeKey, earnedAt, unique constraint); pushed via raw SQL `ALTER TABLE IF NOT EXISTS` + `prisma generate`
- **`lib/badges.ts`** (full rewrite): 14-badge `BADGES` array (first_login, profile_complete, first_product, first_sale, orders_10, orders_100, orders_1000, revenue_50k, revenue_1lakh, streak_7, streak_30, first_referral, referrals_5, pro_upgrade) with XP values; `getLevelFromXp(xp)` with 5 level thresholds; `getNextLevelXp(xp)`; `checkAndAwardBadges(userId, trigger)` using `UserBadge` model (upsert + XP award + level update in transaction); `updateLoginStreak` unchanged
- **`/api/gamification/route.ts`** (full rewrite): Returns `streak, xp, level, nextLevelXp, earnedBadges (with earnedAt), allBadges (with earned status), weeklyRank, topThree, category`; weekly rank uses order count comparison across same-category shops
- **Badge hooks added**: `order_created` trigger in `/api/orders/route.ts`; `profile_complete` trigger in `/api/settings/route.ts` (on shop PATCH); `product_added` trigger in `/api/products/route.ts` (on POST); `login` trigger already in `lib/auth.ts` via `updateLoginStreak`
- **`components/GamificationWidget.tsx`** (full rewrite): Compact row (🔥 streak + level pill + XP progress bar → links to achievements page); weekly leaderboard card (rank badge + top-3 anonymized + link to /community)
- **`components/BadgeToast.tsx`** (new): Polls `/api/gamification` on mount + every 60s; compares to `localStorage("gam_earned_badges_v1")`; shows animated slide-up green toast (5s auto-dismiss, dismissible X, progress bar shrink animation) with confetti via `canvas-confetti` CDN lazy-load; click → `/settings/achievements`; wired into `app/(app)/layout.tsx`
- **`app/(app)/settings/achievements/`** (new page): Level badge header with XP bar and all 5 level steps shown; login streak display; 2-col (mobile) / 4-col (desktop) badge grid — earned cards show icon/title/desc/XP/earnedAt date with ✓ badge; locked cards show 🔒 with hover hint tooltip
- **Settings page**: Added `Trophy` icon import + `{ key: "achievements", label: "পদক ও অর্জন", href: "/settings/achievements" }` to TABS "আমার" group; both mobile grid and desktop sidebar now render `<Link>` for tabs with `href`, `<button>` for regular tabs
- **Level thresholds**: নতুন বিক্রেতা (0-99) → সক্রিয় বিক্রেতা (100-299) → দক্ষ বিক্রেতা (300-699) → অভিজ্ঞ বিক্রেতা (700-1499) → শীর্ষ বিক্রেতা (1500+)

## In-App Notification System (Growth Feature 4) (Complete)

**Foundation (already existed):**
- `Notification` model in schema (fields: `userId`, `type`, `title`, `body String?`, `link String?`, `read Boolean @default(false)`, `createdAt`)
- `/api/notifications/route.ts` — GET (returns notifications + unread count + lowStockProducts + suggestedOrders), PATCH (mark read / mark all read), DELETE (clear read)
- `components/AppTopbar.tsx` — Bell icon with unread badge, dropdown panel with sections (low stock / suggested orders / system notifications), mark-all-read, clear-read, timeAgo formatting

**New additions:**

**DB:**
- `NotificationPreference` model added via raw SQL + schema append: fields `lowStock`, `pendingOrders`, `planExpiry`, `achievements`, `referralUpdates`, `weeklyTips`, `promotions`; `notificationPreferences NotificationPreference?` relation added to User

**`lib/notifications.ts`** (new):
- `createNotification(userId, type, title, body, link?)` — creates a Notification row safely (try/catch)
- `getNotifPrefs(userId)` / `updateNotifPrefs(userId, prefs)` — raw SQL upsert (Prisma client not regenerated due to memory limits)
- `getWeeklyTip(weekNumber)` — 7-tip rotating array with Bangla titles/bodies/links
- NotifType union: achievement | referral | plan_expiry | weekly_tip | low_stock | order | promotion | system

**API Routes (new):**
- `/api/notifications/count` (GET) — returns `{ unread: number }` for fast polling
- `/api/notifications/preferences` (GET/PUT) — reads/writes NotificationPreference via raw SQL
- `/api/notifications/weekly-tip` (POST) — checks weeklyTips pref, creates weekly tip notification (week-number-indexed)
- `/api/notifications/plan-expiry` (POST) — checks planExpiry pref, creates notification if ≤7 days left (3 severity levels: ≤0, ≤3, ≤7 days)

**Notification triggers:**
- Badge award → `lib/badges.ts` now calls `createNotification(userId, "achievement", icon + title, desc + XP, "/settings/achievements")` for every new badge earned
- New user registration → `app/api/register/route.ts` sends welcome notification after user creation
- Referral success → register route sends referral notification to referrer when someone uses their code
- Products already had `checkAndAwardBadges` (which now auto-triggers achievement notifications)
- Plan expiry → checked once per 6 hours via AppTopbar useEffect (localStorage gating)
- Weekly tips → checked once per calendar week via AppTopbar useEffect (localStorage gating)

**`app/(app)/notifications/page.tsx`** (new full page):
- Filter tabs: সব | অপঠিত | অর্জন | রেফারেল | টিপস | প্ল্যান | সিস্টেম
- Notification cards with: type-colored icon (Trophy/Gift/Bell/Lightbulb/Package/ShoppingBag/Star), unread green left-border highlight, timeAgo timestamp, type chip badge, "দেখুন →" link indicator
- Mark individual read (on click), mark-all-read, clear-read buttons
- Empty state per filter
- Skeleton loading state

**Settings — Notifications tab:**
- Added `InAppNotifPrefs` component (inline function) — 6 toggle rows (achievements, referralUpdates, weeklyTips, planExpiry, pendingOrders, promotions) with Bengali labels and hints; auto-saves on toggle via PUT /api/notifications/preferences

**AppTopbar updates:**
- Now fetches unread count from `/api/notifications/count` (fast, lightweight)
- Session-gated plan-expiry + weekly-tip checks (once per 6 hours, weekly tip once per calendar week, via localStorage)
- Dropdown footer now links to `/notifications` ("সব নোটিফিকেশন দেখুন →") instead of activity-log

**Sidebar navigation:**
- `Bell` icon imported; `/notifications` → "নোটিফিকেশন" added to both desktop and mobile (more menu) nav groups
- Page title map in AppTopbar: `/notifications` → "নোটিফিকেশন"

---

## Onboarding Optimization (Growth Feature — Complete)

**DB columns** (added via raw psql, reflected in schema.prisma):
- `User.setupProgress JSONB` — stores per-task completion + snooze/dismiss state
- `User.smsDripSentDays INTEGER[]` — tracks which drip days (1/3/7/30) have been sent
- `Product.isDemoData BOOLEAN @default(false)`, `Order.isDemoData`, `Customer.isDemoData`

**`lib/setupProgress.ts`:**
- `SETUP_TASKS` — 6 tasks: profile_complete, first_product, first_customer, first_order, first_transaction, invite_team (each with XP, title, description, link)
- `getSetupProgress(userId)` / `markSetupTask(userId, taskId)` / `updateSetupProgress(userId, update)` / `calcPercent(progress)` — all use `$queryRaw/$executeRaw`

**API Routes:**
- `/api/onboarding/progress` (GET/PATCH) — returns tasks array + percent + dismissed/snoozed state; PATCH handles `{ task }`, `{ dismiss: true }`, `{ snooze: true }`
- `/api/demo-data` (GET/POST/DELETE) — GET checks isDemoData, POST creates 5 sample products + 3 customers, DELETE removes all isDemoData rows
- `/api/cron/sms-drip` (POST) — checks days since signup, sends day-1/3/7/30 drip SMS via Twilio if not already sent (tracks via `smsDripSentDays` array_append)

**Task completion triggers** wired into existing API routes:
- `products/route.ts` → `markSetupTask(userId, "first_product")`
- `customers/route.ts` → `markSetupTask(userId, "first_customer")`
- `orders/route.ts` → `markSetupTask(userId, "first_order")`
- `transactions/route.ts` → `markSetupTask(userId, "first_transaction")`
- `settings/route.ts` → `markSetupTask(userId, "profile_complete")` on name/phone update

**`components/SetupChecklist.tsx`** (client component, wired into dashboard):
- Fetches progress from `/api/onboarding/progress`
- Progress bar with percentage + XP earned
- Each task row: checkbox, title, description, XP badge, "করুন →" button
- Confetti on 100% completion (canvas-confetti CDN)
- Snooze 24h button, dismiss at 70%+ (once dismissed, no longer shows)
- Mounted in `app/(app)/dashboard/page.tsx` at top of fcommerce dashboard

**`components/PageHint.tsx`** (client component):
- localStorage-gated per-page hint (key: `bizil_hints_seen`)
- Shows once per page, dismissed with "বুঝেছি" or ✕
- Added to: inventory, orders (FCommerceOrders), customers, hisab, reports pages with page-specific Bangla hint text
- Animated slide-in, green left-border design

**`components/DemoDataBanner.tsx`** (client component):
- Checks `/api/demo-data` GET, shows yellow warning banner when demo data exists
- "সব Demo Data মুছুন" button calls DELETE `/api/demo-data`
- Fires `demo-data-deleted` CustomEvent on deletion
- Mounted in dashboard (top) and inventory page

**Empty state upgrade** (`app/(app)/inventory/page.tsx`):
- When `products.length === 0`, empty state shows both "পণ্য যোগ করুন" + "Demo data দিয়ে দেখুন" buttons
- Demo button POSTs to `/api/demo-data` then reloads page

**SMS Drip trigger:**
- `AppTopbar.tsx` fires `POST /api/cron/sms-drip` inside the 6-hour session-gated block (alongside plan-expiry)

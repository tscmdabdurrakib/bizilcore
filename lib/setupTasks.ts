export const SETUP_TASKS = [
  { key: "account_created",    label: "অ্যাকাউন্ট তৈরি করেছেন",         xp: 10,  link: null,               always: true },
  { key: "profile_complete",   label: "দোকানের প্রোফাইল সম্পূর্ণ করুন",  xp: 20,  link: "/settings",         always: false },
  { key: "first_product",      label: "প্রথম পণ্য যোগ করুন",          xp: 30,  link: "/inventory/new",    always: false },
  { key: "first_customer",     label: "প্রথম গ্রাহক যোগ করুন",      xp: 20,  link: "/customers/new",    always: false },
  { key: "first_order",        label: "প্রথম অর্ডার তৈরি করুন",       xp: 50,  link: "/orders/new",       always: false },
  { key: "first_transaction",  label: "প্রথম হিসাব এন্ট্রি করুন",    xp: 20,  link: "/accounting",            always: false },
] as const;

export type SetupTaskKey = typeof SETUP_TASKS[number]["key"];

export interface SetupProgress {
  account_created: boolean;
  profile_complete: boolean;
  first_product: boolean;
  first_customer: boolean;
  first_order: boolean;
  first_transaction: boolean;
  dismissed: boolean;
  dismissedAt?: string;
  snoozedUntil?: string;
}

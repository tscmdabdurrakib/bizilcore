export interface StaffMember {
  id: string;
  role: string;
  salary: number | null;
  jobTitle: string | null;
  phone: string | null;
  isActive: boolean;
  inviteToken: string | null;
  joinedAt: string | null;
  branchId?: string | null;
  branch?: { id: string; name: string } | null;
  user: { name: string; email: string };
}

export interface Attendance {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  notes: string | null;
  staffId?: string;
  staff: StaffMember;
}

export interface ShiftAssignment {
  id: string;
  staff: { id: string; user: { name: string } };
}

export interface Shift {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  days: string[];
  color: string;
  shiftAssignments: ShiftAssignment[];
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string | null;
  status: string;
  reviewedAt: string | null;
  staff: { id: string; user: { name: string } };
}

export interface LeaveBalance {
  id: string;
  staffId: string;
  year: number;
  casual: number;
  sick: number;
  usedCasual: number;
  usedSick: number;
  staff: { id: string; user: { name: string } };
}

export interface PayrollItem {
  id: string;
  staffId: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  advance: number;
  netPay: number;
  paidAmount: number;
  status: string;
  notes: string | null;
  staff: { id: string; user: { name: string }; jobTitle: string | null };
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  items: PayrollItem[];
}

export interface StaffAdvance {
  id: string;
  staffId: string;
  amount: number;
  date: string;
  reason: string | null;
  settled: number;
  staff: { id: string; user: { name: string } };
}

export interface CommissionEntry {
  staffId: string;
  staffName: string;
  totalRevenue: number;
  totalCommission: number;
  paidCommission: number;
  services: { apptId: string; date: string; serviceName: string; revenue: number; commission: number; paid: boolean }[];
}

export type HRTab = "team" | "attendance" | "shifts" | "leave" | "payroll" | "reports" | "commission";

export const ROLE_LABEL: Record<string, string> = { manager: "ম্যানেজার", staff: "স্টাফ" };

export const ROLE_COLOR: Record<string, { bg: string; text: string }> = {
  manager: { bg: "#DCFCE7", text: "#16A34A" },
  staff: { bg: "#EDE9FE", text: "#7C3AED" },
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  present: { label: "উপস্থিত", color: "#10B981", bg: "#ECFDF5" },
  absent: { label: "অনুপস্থিত", color: "#EF4444", bg: "#FEF2F2" },
  late: { label: "দেরিতে", color: "#F59E0B", bg: "#FFFBEB" },
  "half-day": { label: "অর্ধদিন", color: "#8B5CF6", bg: "#F5F3FF" },
  leave: { label: "ছুটি", color: "#3B82F6", bg: "#EFF6FF" },
};

export const LEAVE_TYPE_LABEL: Record<string, string> = {
  casual: "নৈমিত্তিক",
  sick: "অসুস্থতা",
  unpaid: "অবৈতনিক",
  other: "অন্যান্য",
};

export const MONTH_NAMES = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

export const SHIFT_DAYS = [
  { key: "sun", label: "রবি" },
  { key: "mon", label: "সোম" },
  { key: "tue", label: "মঙ্গল" },
  { key: "wed", label: "বুধ" },
  { key: "thu", label: "বৃহঃ" },
  { key: "fri", label: "শুক্র" },
  { key: "sat", label: "শনি" },
];

export const SHIFT_COLORS = [
  "#0F6E56", "#3B82F6", "#8B5CF6", "#EC4899",
  "#F59E0B", "#EF4444", "#14B8A6", "#6366F1",
];

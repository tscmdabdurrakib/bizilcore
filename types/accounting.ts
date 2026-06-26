export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type NormalBalance = "debit" | "credit";
export type JournalStatus = "draft" | "posted" | "reversed";
export type BankAccountType = "cash" | "bank" | "mobile_banking";
export type MobileBankingType = "bkash" | "nagad" | "rocket" | "upay";
export type BankTransactionType = "deposit" | "withdrawal" | "transfer";
export type VatMethod = "inclusive" | "exclusive";

export interface AccountWithBalance {
  id: string;
  shopId: string;
  categoryId: string;
  code: string;
  name: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  isSystem: boolean;
  isActive: boolean;
  description: string | null;
  parentAccountId: string | null;
  balance: number;
  category?: { id: string; name: string; type: AccountType };
}

export interface JournalLineInput {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
}

export interface ManualJournalInput {
  entryDate: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  lines: JournalLineInput[];
  post?: boolean;
}

export interface JournalEntryWithLines {
  id: string;
  entryNumber: string;
  entryDate: string;
  referenceType: string | null;
  referenceId: string | null;
  description: string;
  status: JournalStatus;
  postedAt: string | null;
  createdAt: string;
  debitTotal: number;
  creditTotal: number;
  lines: Array<{
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    debitAmount: number;
    creditAmount: number;
    description: string | null;
    lineOrder: number;
  }>;
}

export interface BankAccountSummary {
  id: string;
  name: string;
  accountType: BankAccountType;
  mobileBankingType: MobileBankingType | null;
  accountNumber: string | null;
  openingBalance: number;
  currentBalance: number;
  lastTransactionDate: string | null;
  isActive: boolean;
  account: { id: string; code: string; name: string };
}

export interface ProfitLossReport {
  revenue: Array<{ code: string; name: string; amount: number }>;
  totalRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  expenses: Array<{ code: string; name: string; amount: number }>;
  totalExpenses: number;
  netProfit: number;
  monthlyTrend: Array<{ month: string; revenue: number; expense: number }>;
}

export interface BalanceSheetReport {
  assets: Array<{ code: string; name: string; amount: number }>;
  totalAssets: number;
  liabilities: Array<{ code: string; name: string; amount: number }>;
  totalLiabilities: number;
  equity: Array<{ code: string; name: string; amount: number }>;
  totalEquity: number;
  isBalanced: boolean;
}

export interface TrialBalanceRow {
  code: string;
  name: string;
  accountType: AccountType;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface GeneralLedgerRow {
  date: string;
  entryNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface VatSettings {
  vatEnabled: boolean;
  vatRate: number;
  vatBin: string | null;
  vatMethod: VatMethod;
}

export function isJournalBalanced(lines: JournalLineInput[]): boolean {
  const debit = lines.reduce((s, l) => s + (l.debitAmount || 0), 0);
  const credit = lines.reduce((s, l) => s + (l.creditAmount || 0), 0);
  return Math.abs(debit - credit) < 0.01;
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

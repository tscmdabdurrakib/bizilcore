export interface OrgOverview {
  org: {
    mainShopName: string;
    totalLocations: number;
    childShopCount: number;
    accessibleShopCount: number;
  };
  inventory: {
    mainStockQty: number;
    mainStockValue: number;
    branchStockQty: number;
    branchStockValue: number;
    combinedValue: number;
  };
  branches: BranchOverviewRow[];
  childShops: { id: string; name: string; logoUrl: string | null }[];
  lowStockAlerts: LowStockAlert[];
  recentTransfers: { id: string; productName: string; quantity: number; direction: string | null; createdAt: string }[];
}

export interface BranchOverviewRow {
  id: string;
  name: string;
  isActive: boolean;
  linkedShopId: string | null;
  productCount: number;
  totalQty: number;
  totalValue: number;
  lowStockCount: number;
  transfers7d: number;
  sales7d: number;
  revenue7d: number;
  topProducts: { name: string; qty: number }[];
}

export interface LowStockAlert {
  scope: "main" | "branch";
  branchId?: string;
  branchName: string;
  productName: string;
  quantity: number;
  threshold: number;
}

export interface ReorderSuggestion {
  branchId: string;
  branchName: string;
  productId: string;
  productName: string;
  sku: string | null;
  branchQty: number;
  threshold: number;
  mainQty: number;
  suggestedQty: number;
}

export interface TransferPreset {
  id: string;
  name: string;
  direction: "main_to_branch" | "branch_to_main" | "branch_to_branch";
  branchId?: string;
  fromBranchId?: string;
  toBranchId?: string;
  items: { productId: string; productName: string; quantity: number }[];
  note?: string;
  savedAt: string;
}

export type TransferDirection = "main_to_branch" | "branch_to_main" | "branch_to_branch";

export const TRANSFER_PRESETS_KEY = "bizilcore_transfer_presets";

export function loadTransferPresets(): TransferPreset[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TRANSFER_PRESETS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveTransferPreset(preset: Omit<TransferPreset, "id" | "savedAt">) {
  const list = loadTransferPresets();
  const entry: TransferPreset = {
    ...preset,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(TRANSFER_PRESETS_KEY, JSON.stringify([entry, ...list].slice(0, 10)));
  return entry;
}

export function deleteTransferPreset(id: string) {
  const list = loadTransferPresets().filter(p => p.id !== id);
  localStorage.setItem(TRANSFER_PRESETS_KEY, JSON.stringify(list));
}

/**
 * Branch → child Shop migration (Phase 2).
 * Run via POST /api/shops/migrate-branches (Business plan owner).
 *
 * Strategy:
 * 1. Ensure Organization exists for primary shop owner
 * 2. For each ShopBranch without linkedShopId:
 *    - Create child Shop with parentShopId + copied metadata
 *    - Copy BranchStock quantities into child Shop products (match by SKU/name)
 *    - Link branch.linkedShopId → child shop
 * 3. StockMovement history preserved on primary user account
 *
 * After migration, use ShopSwitcher to operate child shops as isolated units.
 */

export const MIGRATION_NOTES = {
  phase1: "ShopBranch + BranchStock — lightweight branch labels with inventory",
  phase2: "Child Shop entities — full isolation (products, FB, settings per shop)",
  api: "/api/shops/migrate-branches",
} as const;

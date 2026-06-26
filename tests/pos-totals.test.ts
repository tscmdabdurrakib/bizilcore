import { describe, it, expect } from "vitest";
import { computeRetailSaleTotals } from "@/lib/pos/totals";

describe("computeRetailSaleTotals (money path)", () => {
  it("sums line items", () => {
    const t = computeRetailSaleTotals([
      { quantity: 2, unitPrice: 100 },
      { quantity: 1, unitPrice: 50 },
    ]);
    expect(t.subTotal).toBe(250);
    expect(t.grandTotal).toBe(250);
  });

  it("applies VAT per line", () => {
    const t = computeRetailSaleTotals([{ quantity: 1, unitPrice: 100, vatRate: 0.075 }]);
    expect(t.vatTotal).toBeCloseTo(7.5, 5);
    expect(t.grandTotal).toBeCloseTo(107.5, 5);
  });

  it("applies a flat discount", () => {
    const t = computeRetailSaleTotals([{ quantity: 1, unitPrice: 100 }], 30);
    expect(t.discount).toBe(30);
    expect(t.grandTotal).toBe(70);
  });

  it("never produces a negative total when discount exceeds amount", () => {
    const t = computeRetailSaleTotals([{ quantity: 1, unitPrice: 100 }], 9999);
    expect(t.grandTotal).toBe(0);
    expect(t.discount).toBe(100);
  });

  it("ignores negative discount input", () => {
    const t = computeRetailSaleTotals([{ quantity: 1, unitPrice: 100 }], -50);
    expect(t.discount).toBe(0);
    expect(t.grandTotal).toBe(100);
  });
});

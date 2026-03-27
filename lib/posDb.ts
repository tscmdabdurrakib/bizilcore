import Dexie, { type Table } from "dexie";

export interface PosProduct {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  imageUrl: string | null;
  sellPrice: number;
  buyPrice: number;
  stockQty: number;
  hasVariants: boolean;
}

export interface PosSaleQueue {
  id?: number;
  payload: string;
  createdAt: number;
}

class PosDatabase extends Dexie {
  products!: Table<PosProduct>;
  saleQueue!: Table<PosSaleQueue>;

  constructor() {
    super("BizilCorePOS");
    this.version(1).stores({
      products: "id, name, category",
      saleQueue: "++id, createdAt",
    });
  }
}

export const posDb = new PosDatabase();

export async function syncProductsToIndexedDB(products: PosProduct[]) {
  await posDb.products.clear();
  await posDb.products.bulkPut(products);
}

export async function getOfflineProducts(search = "", category = ""): Promise<PosProduct[]> {
  let collection = posDb.products.toCollection();
  const rows = await collection.toArray();
  return rows.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || p.category === category;
    return matchSearch && matchCat;
  });
}

export async function enqueueSale(payload: object) {
  await posDb.saleQueue.add({ payload: JSON.stringify(payload), createdAt: Date.now() });
}

export async function flushSaleQueue(): Promise<{ flushed: number; failed: number }> {
  const queue = await posDb.saleQueue.orderBy("createdAt").toArray();
  let flushed = 0;
  let failed = 0;
  for (const item of queue) {
    try {
      const res = await fetch("/api/pos/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: item.payload,
      });
      if (res.ok) {
        await posDb.saleQueue.delete(item.id!);
        flushed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { flushed, failed };
}

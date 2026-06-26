import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getApiShop } from "@/lib/shops/api-shop";
import { revalidateProducts } from "@/lib/cache/revalidate";

function parseCsv(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map(line => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { cells.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getApiShop();
  if ("error" in shopCtx) return shopCtx.error;
  const shopId = shopCtx.activeShop.id;

  const { csv } = await req.json();
  if (!csv || typeof csv !== "string") {
    return NextResponse.json({ error: "CSV text required" }, { status: 400 });
  }

  const rows = parseCsv(csv);
  if (rows.length < 2) {
    return NextResponse.json({ error: "Header + at least one row required" }, { status: 400 });
  }

  const header = rows[0].map(h => h.toLowerCase());
  const nameIdx = header.findIndex(h => h.includes("name") || h === "পণ্য");
  const priceIdx = header.findIndex(h => h.includes("price") || h.includes("sell") || h === "দাম");
  const stockIdx = header.findIndex(h => h.includes("stock") || h === "স্টক");
  const catIdx = header.findIndex(h => h.includes("category") || h === "ক্যাটাগরি");

  if (nameIdx < 0 || priceIdx < 0) {
    return NextResponse.json({ error: "CSV must have name and price columns" }, { status: 400 });
  }

  let created = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameIdx]?.trim();
    const sellPrice = parseFloat(row[priceIdx]);
    if (!name || !Number.isFinite(sellPrice)) {
      errors.push(`Row ${i + 1}: invalid name or price`);
      continue;
    }
    const stockQty = stockIdx >= 0 ? parseInt(row[stockIdx], 10) || 0 : 0;
    const category = catIdx >= 0 ? row[catIdx]?.trim() || null : null;

    try {
      await prisma.product.create({
        data: {
          shopId,
          name,
          sellPrice,
          buyPrice: sellPrice * 0.7,
          stockQty,
          category,
          storeVisible: true,
        },
      });
      created++;
    } catch {
      errors.push(`Row ${i + 1}: failed to create`);
    }
  }

  revalidateProducts(shopId);
  return NextResponse.json({ created, errors: errors.slice(0, 10) });
}

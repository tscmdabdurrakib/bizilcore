import "dotenv/config";
import { defineConfig } from "prisma/config";

// Primary Supabase database — kept in source so it survives project remixes.
const SUPABASE_URL =
  "postgresql://postgres.qoliepmmquycarvospag:XM4PecUuPiaGBPOI@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

function fixBracketPassword(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace(/(:\/\/[^:]+:)\[([^\]]+)\](@)/, "$1$2$3");
}

const supabaseUrl = process.env["SUPABASE_DATABASE_URL"];
const directUrl = process.env["SUPABASE_DIRECT_URL"];

const dbUrl =
  supabaseUrl ||
  fixBracketPassword(directUrl) ||
  SUPABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl,
  },
});

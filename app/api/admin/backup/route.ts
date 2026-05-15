import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(process.cwd(), "backups");
const MAX_BACKUPS = 7;

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getBackupList() {
  ensureBackupDir();
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort()
    .reverse()
    .map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        filename: f,
        size: (stat.size / 1024 / 1024).toFixed(2) + " MB",
        createdAt: stat.birthtime.toISOString(),
      };
    });
}

async function createBackup(): Promise<string> {
  ensureBackupDir();

  const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString: dbUrl });

  const date = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `backup-${date}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  const lines: string[] = [];
  lines.push(`-- BizilCore Database Backup`);
  lines.push(`-- Created: ${new Date().toISOString()}`);
  lines.push(`-- Database: Supabase\n`);

  const tablesRes = await pool.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`
  );

  for (const { table_name } of tablesRes.rows) {
    try {
      const dataRes = await pool.query(`SELECT * FROM "${table_name}" LIMIT 10000`);
      if (dataRes.rows.length === 0) continue;

      lines.push(`\n-- Table: ${table_name} (${dataRes.rows.length} rows)`);
      lines.push(`TRUNCATE TABLE "${table_name}" CASCADE;`);

      for (const row of dataRes.rows) {
        const keys = Object.keys(row).map(k => `"${k}"`).join(", ");
        const vals = Object.values(row).map(v => {
          if (v === null) return "NULL";
          if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
          if (typeof v === "number") return String(v);
          if (v instanceof Date) return `'${v.toISOString()}'`;
          return `'${String(v).replace(/'/g, "''")}'`;
        }).join(", ");
        lines.push(`INSERT INTO "${table_name}" (${keys}) VALUES (${vals});`);
      }
    } catch {
      lines.push(`-- Skipped: ${table_name}`);
    }
  }

  await pool.end();
  fs.writeFileSync(filepath, lines.join("\n"), "utf8");

  const allBackups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort();
  while (allBackups.length > MAX_BACKUPS) {
    fs.unlinkSync(path.join(BACKUP_DIR, allBackups.shift()!));
  }

  return filename;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const backups = getBackupList();
  return NextResponse.json({ backups });
}

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("Authorization");
  const session = await auth();

  const isCron = cronSecret === `Bearer ${process.env.CRON_SECRET ?? "bizilcore-cron"}`;
  const isAdmin = session?.user;

  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filename = await createBackup();
    return NextResponse.json({ success: true, filename, message: "Backup created successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

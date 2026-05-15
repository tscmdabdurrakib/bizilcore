import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import fs from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("file");

  if (!filename || !filename.endsWith(".sql") || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filepath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }

  const content = fs.readFileSync(filepath);
  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

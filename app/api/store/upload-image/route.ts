import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImageToCloudinary, MAX_IMAGE_SIZE, ALLOWED_TYPES } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: "File too large" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImageToCloudinary(buffer, `bizilcore/store/${session.user.id}`);

  return NextResponse.json({ url: result.url, publicId: result.publicId });
}

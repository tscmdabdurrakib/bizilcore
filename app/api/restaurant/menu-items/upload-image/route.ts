import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary, MAX_IMAGE_SIZE, ALLOWED_TYPES } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "ফাইল পাওয়া যায়নি" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "শুধু JPG, PNG, WEBP ছবি আপলোড করুন" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "ছবির সাইজ ৮০০KB এর বেশি হওয়া যাবে না" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const { url } = await uploadToCloudinary(buffer, session.user.id, file.type);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "আপলোড ব্যর্থ হয়েছে" }, { status: 500 });
  }
}

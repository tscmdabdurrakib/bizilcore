import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImageToCloudinary, ALLOWED_TYPES, MAX_IMAGE_SIZE } from "@/lib/cloudinary";
import { getShopForUser } from "@/lib/expenses/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "কোনো ফাইল পাওয়া যায়নি।" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "শুধু JPG, PNG বা WEBP ছবি আপলোড করুন।" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে।" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = `bizilcore/receipts/${shop.id}`;

  try {
    const { url } = await uploadImageToCloudinary(buffer, folder);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Receipt upload error:", err);
    return NextResponse.json({ error: "রসিদ আপলোড ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

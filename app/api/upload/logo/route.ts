import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImageToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

const MAX_LOGO_SIZE = 300 * 1024; // 300 KB
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "কোনো ফাইল পাওয়া যায়নি।" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "শুধু JPG, PNG বা WEBP ছবি আপলোড করুন।" }, { status: 400 });
  if (file.size > MAX_LOGO_SIZE) return NextResponse.json({ error: "ছবির সাইজ সর্বোচ্চ ৩০০KB হতে পারবে।" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = `bizilcore/logos/${session.user.id}`;

  try {
    // Delete old logo from Cloudinary if exists
    const shop = await prisma.shop.findUnique({
      where: { userId: session.user.id },
      select: { logoPublicId: true },
    });
    if (shop?.logoPublicId) {
      await deleteFromCloudinary(shop.logoPublicId);
    }

    const { url, publicId } = await uploadImageToCloudinary(buffer, folder);

    // Save to DB
    await prisma.shop.update({
      where: { userId: session.user.id },
      data: { logoUrl: url, logoPublicId: publicId },
    });

    return NextResponse.json({ url, publicId });
  } catch (err) {
    console.error("Logo upload error:", err);
    return NextResponse.json({ error: "লোগো আপলোড ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { logoPublicId: true },
  });

  if (shop?.logoPublicId) {
    await deleteFromCloudinary(shop.logoPublicId);
  }

  await prisma.shop.update({
    where: { userId: session.user.id },
    data: { logoUrl: null, logoPublicId: null },
  });

  return NextResponse.json({ success: true });
}

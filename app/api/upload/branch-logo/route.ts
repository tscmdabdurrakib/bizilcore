import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImageToCloudinary, deleteFromCloudinary, ALLOWED_TYPES } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { getPrimaryShop } from "@/lib/shops/access";

const MAX_LOGO_SIZE = 300 * 1024;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const branchId = formData.get("branchId") as string | null;

  if (!file) return NextResponse.json({ error: "কোনো ফাইল পাওয়া যায়নি।" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "শুধু JPG, PNG বা WEBP ছবি।" }, { status: 400 });
  if (file.size > MAX_LOGO_SIZE) return NextResponse.json({ error: "সর্বোচ্চ ৩০০KB।" }, { status: 400 });

  const mainShop = await getPrimaryShop(session.user.id);
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  if (branchId) {
    const branch = await prisma.shopBranch.findFirst({ where: { id: branchId, shopId: mainShop.id } });
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = `bizilcore/branch-logos/${mainShop.id}`;

    if (branch.logoPublicId) await deleteFromCloudinary(branch.logoPublicId).catch(() => {});

    const { url, publicId } = await uploadImageToCloudinary(buffer, folder);
    await prisma.shopBranch.update({
      where: { id: branchId },
      data: { logoUrl: url, logoPublicId: publicId },
    });
    return NextResponse.json({ url, publicId, branchId });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = `bizilcore/branch-logos/${mainShop.id}/temp`;
  const { url, publicId } = await uploadImageToCloudinary(buffer, folder);
  return NextResponse.json({ url, publicId });
}

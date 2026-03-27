import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  cloudinary,
  uploadToCloudinary,
  MAX_IMAGE_SIZE,
  ALLOWED_TYPES,
  ProductImage,
} from "@/lib/cloudinary";

async function getUserPlan(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return sub?.plan ?? "free";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const plan = await getUserPlan(userId);

  if (plan === "free") {
    return NextResponse.json(
      { error: "ফ্রি প্ল্যানে সরাসরি ছবি আপলোড করা যাবে না। ছবির লিংক ব্যবহার করুন।" },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;

  if (!file) return NextResponse.json({ error: "ফাইল পাওয়া যায়নি" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "শুধু JPG, PNG, WEBP ছবি আপলোড করুন।" },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "ছবির সাইজ ৮০০KB এর বেশি হওয়া যাবে না। অনুগ্রহ করে ছোট সাইজের ছবি দিন।" },
      { status: 400 }
    );
  }

  // Check existing upload count for this product
  if (productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { images: true },
    });
    const images: ProductImage[] = (product?.images as unknown as ProductImage[]) ?? [];
    const uploadCount = images.filter((img) => img.type === "upload").length;
    const totalCount = images.length;

    if (plan === "pro" && uploadCount >= 1) {
      return NextResponse.json(
        { error: "প্রো প্ল্যানে মাত্র ১টি ছবি আপলোড করা যাবে।" },
        { status: 403 }
      );
    }
    if (totalCount >= 5) {
      return NextResponse.json(
        { error: "সর্বোচ্চ ৫টি ছবি যোগ করা যাবে।" },
        { status: 403 }
      );
    }
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const { url, publicId } = await uploadToCloudinary(buffer, userId, file.type);

    console.log(`[ImageUpload] userId:${userId} plan:${plan} productId:${productId ?? "new"} size:${file.size}`);

    return NextResponse.json({ url, publicId });
  } catch (err) {
    console.error("[ImageUpload] Cloudinary error:", err);
    return NextResponse.json({ error: "আপলোড ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

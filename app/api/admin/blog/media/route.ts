import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { BLOG_MEDIA_FOLDER } from "@/lib/blog-editor/api-helpers";

export async function GET(req: NextRequest) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  const media = await prisma.blogMedia.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(q
        ? {
            OR: [
              { alt: { contains: q, mode: "insensitive" } },
              { caption: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(media);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const alt = (formData.get("alt") as string) || null;
  const caption = (formData.get("caption") as string) || null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  const isVideo = mime.startsWith("video/");
  const isImage = mime.startsWith("image/");

  let url: string;
  let publicId: string | undefined;

  if (isImage || isVideo) {
    const result = await uploadImageToCloudinary(buffer, BLOG_MEDIA_FOLDER);
    url = result.url;
    publicId = result.publicId;
  } else {
    url = `data:${mime};base64,${buffer.toString("base64")}`;
  }

  const media = await prisma.blogMedia.create({
    data: {
      url,
      publicId: publicId ?? null,
      type: isVideo ? "video" : isImage ? "image" : "file",
      alt,
      caption,
      uploadedById: auth.user.id,
      meta: { fileName: file.name, size: file.size, mime },
    },
  });

  return NextResponse.json(media, { status: 201 });
}

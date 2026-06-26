import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BlogEditor } from "@/components/blog-editor/BlogEditor";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditBlogPostPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } })
    : null;

  return <BlogEditor postId={id} adminName={user?.name} />;
}

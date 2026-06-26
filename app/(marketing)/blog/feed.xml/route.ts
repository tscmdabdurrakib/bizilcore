import { prisma } from "@/lib/prisma";

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "published", visibility: "public" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: { title: true, slug: true, excerpt: true, publishedAt: true },
  });

  const items = posts
    .map(
      p => `<item>
        <title><![CDATA[${p.title}]]></title>
        <link>${process.env.NEXT_PUBLIC_APP_URL ?? ""}/blog/${p.slug}</link>
        <description><![CDATA[${p.excerpt ?? ""}]]></description>
        <pubDate>${p.publishedAt?.toUTCString() ?? ""}</pubDate>
      </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BizilCore Blog</title>
    <link>${process.env.NEXT_PUBLIC_APP_URL ?? ""}/blog</link>
    <description>Facebook seller tips, guides and success stories</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}

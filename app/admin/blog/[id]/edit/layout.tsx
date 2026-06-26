import { BlogEditorProvider } from "@/components/blog-editor/BlogEditorProvider";

export default function BlogEditLayout({ children }: { children: React.ReactNode }) {
  return <BlogEditorProvider>{children}</BlogEditorProvider>;
}

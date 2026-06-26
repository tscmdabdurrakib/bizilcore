import { cn } from "@/lib/utils";
import PageHeader from "./PageHeader";

interface PageShellProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  stats?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function PageShell({
  title,
  subtitle,
  breadcrumbs,
  actions,
  stats,
  children,
  className,
  noPadding,
}: PageShellProps) {
  return (
    <div className={cn("max-w-[1400px] mx-auto", !noPadding && "space-y-5", className)}>
      <PageHeader title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} actions={actions} />
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats}
        </div>
      )}
      {children}
    </div>
  );
}

import { redirect } from "next/navigation";

export default function InvoicesNewPage() {
  redirect("/invoices?create=1");
}

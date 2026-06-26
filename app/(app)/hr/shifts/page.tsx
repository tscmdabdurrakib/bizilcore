import { redirect } from "next/navigation";

export default function ShiftsRedirect() {
  redirect("/hr?tab=shifts");
}

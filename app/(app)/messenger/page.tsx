import { redirect } from "next/navigation";

export default function MessengerRedirect() {
  redirect("/fb-orders?view=messenger");
}

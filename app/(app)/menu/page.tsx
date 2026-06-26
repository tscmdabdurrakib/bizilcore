import { redirect } from "next/navigation";

/** Legacy path — restaurant menu (with coupon tab) lives under /restaurant/menu */
export default function MenuPage() {
  redirect("/restaurant/menu");
}

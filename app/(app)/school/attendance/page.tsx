import { requireShop } from "@/lib/getShop";
import AttendanceBoard from "./AttendanceBoard";

export default async function AttendancePage() {
  await requireShop();
  return <AttendanceBoard />;
}

import { revalidateTag } from "next/cache";

export function revalidateProducts(shopId: string) {
  revalidateTag(`products-${shopId}`);
}

export function revalidateCategories(shopId: string) {
  revalidateTag(`categories-${shopId}`);
}

export function revalidateCustomers(shopId: string) {
  revalidateTag(`customers-${shopId}`);
}

export function revalidateSmsCredits(userId: string) {
  revalidateTag(`sms-credits-${userId}`);
}

export function revalidateFbPages(shopId: string) {
  revalidateTag(`fb-pages-${shopId}`);
}

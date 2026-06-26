export function calculateEarnedPoints(subtotal: number, earnRate: number): number {
  if (subtotal <= 0 || earnRate <= 0) return 0;
  return Math.floor((subtotal / 100) * earnRate);
}

export function calculateRedeemValue(points: number, redeemRate: number): number {
  if (points <= 0 || redeemRate <= 0) return 0;
  return Math.round(points * redeemRate * 100) / 100;
}

export function maxRedeemablePoints(
  availablePoints: number,
  subtotal: number,
  redeemRate: number,
): number {
  if (redeemRate <= 0) return 0;
  const maxBySubtotal = Math.floor(subtotal / redeemRate);
  return Math.min(availablePoints, maxBySubtotal);
}

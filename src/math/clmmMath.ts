export function sqrtPriceX64ToPrice(
  sqrtPriceX64: bigint,
  baseDecimals: number,
  quoteDecimals: number
): number {
  if (sqrtPriceX64 === 0n) return 0;
  const Q64 = 2n ** 64n;
  const ratio = Number(sqrtPriceX64) / Number(Q64);
  return (ratio ** 2) * 10 ** (baseDecimals - quoteDecimals);
}

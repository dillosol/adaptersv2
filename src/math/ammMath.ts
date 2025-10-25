/**
 * Calculate the human price (quote per 1 base) for a standard AMM pool.
 * 
 * @param baseReserve   raw base token reserve (BigInt from account)
 * @param quoteReserve  raw quote token reserve (BigInt from account)
 * @param baseDecimals  decimals of the base token (e.g. 9 for SOL)
 * @param quoteDecimals decimals of the quote token (e.g. 6 for USDC)
 * @returns number      price in quote tokens per 1 base token
 */
export function getPriceFromReserves(
  baseReserve: bigint,
  quoteReserve: bigint,
  baseDecimals: number,
  quoteDecimals: number
): number {
  if (baseReserve === 0n || quoteReserve === 0n) return 0;

  const base = Number(baseReserve) / 10 ** baseDecimals;
  const quote = Number(quoteReserve) / 10 ** quoteDecimals;

  return quote / base;
}



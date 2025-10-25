/**
 * Pool Normalizer
 * ------------------------------------------------------------
 * Converts adapter-specific pool updates into a standardized format.
 * The state manager and arb engine can rely on this consistent shape.
 */

export interface NormalizedPoolData {
  source: string;              // e.g. "PUMPFUN", "RAYDIUMCLMM"
  poolAddress: string;
  slot: number;
  timestamp: number;

  // pricing inputs (one or the other depending on pool type)
  baseReserve?: bigint;
  quoteReserve?: bigint;
  sqrtPriceX64?: bigint;

  // metadata for normalization
  baseDecimals: number;
  quoteDecimals: number;

  // optional: full raw object for execution layer
  raw: any;
}

/* ─────────────────────────────── AMM Pools ─────────────────────────────── */
export function normalizeAmmPool(update: any, source: string): NormalizedPoolData {
  const baseReserve = update.baseVault?.amount ?? 0n;
  const quoteReserve = update.quoteVault?.amount ?? 0n;

  return {
    source,
    poolAddress: update.lpMeta?.lp_mint?.toString() ?? "unknown",
    slot: update.slot,
    timestamp: update.timestamp,

    baseReserve,
    quoteReserve,

    baseDecimals: update.baseDecimals ?? 9,
    quoteDecimals: update.quoteDecimals ?? 6,

    raw: update,
  };
}


/* ─────────────────────────────── CLMM Pools ─────────────────────────────── */
export function normalizeClmmPool(update: any, source: string): NormalizedPoolData {
  let sqrtPriceX64: bigint;

  switch (source) {
    case "RAYDIUMCLMM":
      sqrtPriceX64 = BigInt(update.sqrtPriceX64 ?? update.poolState?.sqrtPriceX64 ?? 0);
      break;

    case "METEORA":
      sqrtPriceX64 = BigInt(update.poolInfo?.sqrt_price_x64 ?? 0);
      break;

    case "ORCA":
      sqrtPriceX64 = BigInt(  update.sqrtPrice ??   0);
      break;

    case "DAMMV2":
      sqrtPriceX64 = BigInt(update.sqrt_price ?? 0);             // ← your decoder’s field
      break;
      default:
      sqrtPriceX64 = 0n;
  }

  return {
    source,
    poolAddress: update.poolAddress ?? "unknown",
    slot: update.slot,
    timestamp: update.timestamp,

    sqrtPriceX64,
    baseDecimals: update.baseDecimals ?? 9,
    quoteDecimals: update.quoteDecimals ?? 6,

    raw: update,
  };
}

/* ─────────────────────────────── Dispatcher ─────────────────────────────── */
/**
 * Automatically routes the update to the proper normalizer
 * based on source and/or data shape.
 */
export function normalizePoolUpdate(update: any): NormalizedPoolData {
  const source = update.source?.toUpperCase?.() ?? "UNKNOWN";

  if (["RAYDIUMCLMM", "ORCA", "METEORA", "DAMMV2"].includes(source)) {
    return normalizeClmmPool(update, source);
  }

  if (["PUMPFUN", "AMM"].includes(source)) {
    return normalizeAmmPool(update, source);
  }

  return {
    source,
    poolAddress: update.poolAddress ?? "unknown",
    slot: update.slot ?? 0,
    timestamp: update.timestamp ?? Date.now(),
    baseDecimals: update.baseDecimals ?? 9,
    quoteDecimals: update.quoteDecimals ?? 6,
    raw: update,
  };
}

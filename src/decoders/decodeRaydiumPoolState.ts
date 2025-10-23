import { PublicKey } from "@solana/web3.js";

/* ------------------------- Low-level readers ------------------------- */
function readU8(a: Uint8Array, o: number): number { return a[o]; }

function readU16LE(a: Uint8Array, o: number): number {
  return a[o] | (a[o + 1] << 8);
}

function readI32LE(a: Uint8Array, o: number): number {
  const v = (a[o] | (a[o + 1] << 8) | (a[o + 2] << 16) | (a[o + 3] << 24)) >> 0;
  return v;
}

function readU64LE(a: Uint8Array, o: number): bigint {
  let v = 0n;
  for (let i = 0; i < 8; i++) v |= BigInt(a[o + i]) << (8n * BigInt(i));
  return v;
}

function readU128LE(a: Uint8Array, o: number): bigint {
  let v = 0n;
  for (let i = 0; i < 16; i++) v |= BigInt(a[o + i]) << (8n * BigInt(i));
  return v;
}

function readPubkey(a: Uint8Array, o: number): string {
  return new PublicKey(a.slice(o, o + 32)).toBase58();
}

/* ---------------------------- Types ---------------------------- */
export interface RaydiumRewardInfo {
  // Default 128-byte layout (adjust by providing a custom parser if yours differs)
  mint: string;
  vault: string;
  authority: string;
  emissionsPerSecondX64: bigint;
  growthGlobalX64: bigint;
}

export interface RaydiumPoolState {
  bump: number;
  ammConfig: string;
  owner: string;

  tokenMint0: string;
  tokenMint1: string;

  tokenVault0: string;
  tokenVault1: string;

  observationKey: string;

  mintDecimals0: number;
  mintDecimals1: number;

  tickSpacing: number;
  liquidity: bigint;
  sqrtPriceX64: bigint;
  tickCurrent: number;

  padding3: number;
  padding4: number;

  feeGrowthGlobal0X64: bigint;
  feeGrowthGlobal1X64: bigint;

  protocolFeesToken0: bigint;
  protocolFeesToken1: bigint;

  swapInAmountToken0: bigint;
  swapOutAmountToken1: bigint;
  swapInAmountToken1: bigint;
  swapOutAmountToken0: bigint;

  status: number;
  padding: Uint8Array; // 7 bytes

  rewardInfos: RaydiumRewardInfo[]; // parsed with provided or default parser

  tickArrayBitmap: bigint[]; // 16 * u64

  totalFeesToken0: bigint;
  totalFeesClaimedToken0: bigint;
  totalFeesToken1: bigint;
  totalFeesClaimedToken1: bigint;

  fundFeesToken0: bigint;
  fundFeesToken1: bigint;

  openTime: bigint;
  recentEpoch: bigint;

  padding1: bigint[]; // 24 * u64
  padding2: bigint[]; // 32 * u64
}

/* -------- Default RewardInfo parser (128 bytes each, 3 entries) --------
   Layout (common pattern used by CLMMs; replace if your RewardInfo differs):
   - mint:        32
   - vault:       32
   - authority:   32
   - emissionsX64:16 (u128)
   - growthX64:   16 (u128)
   Total:        128
-------------------------------------------------------------------------- */
export interface RewardParserOptions {
  rewardNum?: number;           // default 3
  entrySize?: number;           // default 128
  parseOne?: (a: Uint8Array, o: number) => RaydiumRewardInfo; // default impl
}

const defaultParseOne = (a: Uint8Array, o: number): RaydiumRewardInfo => {
  const mint = readPubkey(a, o); o += 32;
  const vault = readPubkey(a, o); o += 32;
  const authority = readPubkey(a, o); o += 32;
  const emissionsPerSecondX64 = readU128LE(a, o); o += 16;
  const growthGlobalX64 = readU128LE(a, o); o += 16;
  return { mint, vault, authority, emissionsPerSecondX64, growthGlobalX64 };
};

/* ----------------------------- Decoder ----------------------------- */
export function decodeRaydiumPoolState(
  data: Buffer | Uint8Array,
  opts: RewardParserOptions = {}
): RaydiumPoolState {
  const a = Uint8Array.from(data);
  let o = 8;

  // Prefix (fixed)
  const bump = readU8(a, o); o += 1;
  const ammConfig = readPubkey(a, o); o += 32;
  const owner = readPubkey(a, o); o += 32;

  const tokenMint0 = readPubkey(a, o); o += 32;
  const tokenMint1 = readPubkey(a, o); o += 32;

  const tokenVault0 = readPubkey(a, o); o += 32;
  const tokenVault1 = readPubkey(a, o); o += 32;

  const observationKey = readPubkey(a, o); o += 32;

  const mintDecimals0 = readU8(a, o); o += 1;
  const mintDecimals1 = readU8(a, o); o += 1;

  const tickSpacing = readU16LE(a, o); o += 2;
  const liquidity = readU128LE(a, o); o += 16;
  const sqrtPriceX64 = readU128LE(a, o); o += 16;
  const tickCurrent = readI32LE(a, o); o += 4;

  const padding3 = readU16LE(a, o); o += 2;
  const padding4 = readU16LE(a, o); o += 2;

  const feeGrowthGlobal0X64 = readU128LE(a, o); o += 16;
  const feeGrowthGlobal1X64 = readU128LE(a, o); o += 16;

  const protocolFeesToken0 = readU64LE(a, o); o += 8;
  const protocolFeesToken1 = readU64LE(a, o); o += 8;

  const swapInAmountToken0  = readU128LE(a, o); o += 16;
  const swapOutAmountToken1 = readU128LE(a, o); o += 16;
  const swapInAmountToken1  = readU128LE(a, o); o += 16;
  const swapOutAmountToken0 = readU128LE(a, o); o += 16;

  const status = readU8(a, o); o += 1;
  const padding = a.slice(o, o + 7); o += 7;

// Reward infos (configurable)
// Reward infos (configurable)
const rewardNum  = opts.rewardNum  ?? 3;      // this pool has 2 rewards
const entrySize  = opts.entrySize  ?? 169;    // 169 bytes rounded up to 176

const parseOne = (a: Uint8Array, start: number): RaydiumRewardInfo => {
  let o = start;

  const rewardState           = a[o];                 o += 1;
  const openTime              = readU64LE(a, o);      o += 8;
  const endTime               = readU64LE(a, o);      o += 8;
  const lastUpdateTime        = readU64LE(a, o);      o += 8;

  const emissionsPerSecondX64 = readU128LE(a, o);     o += 16;   // u128
  const rewardTotalEmissioned = readU64LE(a, o);      o += 8;    // u64
  const rewardClaimed         = readU64LE(a, o);      o += 8;    // u64

  // pubkeys BEFORE growth (your required order)
  const tokenMint             = readPubkey(a, o);     o += 32;
  const tokenVault            = readPubkey(a, o);     o += 32;
  const authority             = readPubkey(a, o);     o += 32;

  const rewardGrowthGlobalX64 = readU128LE(a, o);     o += 16;   // u128

  // align to fixed entry size to prevent drift
  const consumed = o - start;
  if (entrySize > consumed) o += (entrySize - consumed);

  return {
    rewardState,
    openTime,
    endTime,
    lastUpdateTime,
    emissionsPerSecondX64,
    rewardTotalEmissioned,
    rewardClaimed,
    tokenMint,
    tokenVault,
    authority,
    rewardGrowthGlobalX64,
  };
};

// parse all reward slots (start at 0)
const rewardInfos: RaydiumRewardInfo[] = [];
for (let i = 0; i < rewardNum; i++) {
  const entry = parseOne(a, o);
  rewardInfos.push(entry);
  o += entrySize;
}

  // tick_array_bitmap: [u64; 16] (128 bytes)
  const tickArrayBitmap: bigint[] = [];
  for (let i = 0; i < 16; i++) {
    tickArrayBitmap.push(readU64LE(a, o)); o += 8;
  }

  // totals/claims (6 * u64)
  const totalFeesToken0         = readU64LE(a, o); o += 8;
  const totalFeesClaimedToken0  = readU64LE(a, o); o += 8;
  const totalFeesToken1         = readU64LE(a, o); o += 8;
  const totalFeesClaimedToken1  = readU64LE(a, o); o += 8;

  const fundFeesToken0          = readU64LE(a, o); o += 8;
  const fundFeesToken1          = readU64LE(a, o); o += 8;

  const openTime                = readU64LE(a, o); o += 8;
  const recentEpoch             = readU64LE(a, o); o += 8;

  // padding1: [u64; 24]  (192 bytes)
  const padding1: bigint[] = [];
  for (let i = 0; i < 24; i++) { padding1.push(readU64LE(a, o)); o += 8; }

  // padding2: [u64; 32]  (256 bytes)
  const padding2: bigint[] = [];
  for (let i = 0; i < 32; i++) { padding2.push(readU64LE(a, o)); o += 8; }

  return {  
    bump,
    ammConfig,
    owner,

    tokenMint0,
    tokenMint1,

    tokenVault0,
    tokenVault1,

    observationKey,

    mintDecimals0,
    mintDecimals1,

    tickSpacing,
    liquidity,
    sqrtPriceX64,
    tickCurrent,

    padding3,
    padding4,

    feeGrowthGlobal0X64,
    feeGrowthGlobal1X64,

    protocolFeesToken0,
    protocolFeesToken1,

    swapInAmountToken0,
    swapOutAmountToken1,
    swapInAmountToken1,
    swapOutAmountToken0,

    status,
    padding,

    rewardInfos,

    tickArrayBitmap,

    totalFeesToken0,
    totalFeesClaimedToken0,
    totalFeesToken1,
    totalFeesClaimedToken1,

    fundFeesToken0,
    fundFeesToken1,

    openTime,
    recentEpoch,

    padding1,
    padding2,
  };
}

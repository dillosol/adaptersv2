import { PublicKey } from "@solana/web3.js";

// ─────────────────────────────── HELPERS ───────────────────────────────
function readU8(data: Uint8Array, offset: number): number {
  return data[offset];
}

function readU16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function readI32LE(data: Uint8Array, offset: number): number {
  const val =
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24);
  return val >> 0; // force signed
}

function readU64LE(data: Uint8Array, offset: number): bigint {
  let v = 0n;
  for (let i = 0; i < 8; i++) v |= BigInt(data[offset + i]) << (8n * BigInt(i));
  return v;
}

function readU128LE(data: Uint8Array, offset: number): bigint {
  let v = 0n;
  for (let i = 0; i < 16; i++) v |= BigInt(data[offset + i]) << (8n * BigInt(i));
  return v;
}

function readPubkey(data: Uint8Array, offset: number): string {
  return new PublicKey(data.slice(offset, offset + 32)).toBase58();
}

// ─────────────────────────────── TYPES ───────────────────────────────
export interface DecodedRewardInfo {
  mint: string;
  vault: string;
  authority: string;
  emissionsPerSecondX64: bigint;
  growthGlobalX64: bigint;
}

export interface DecodedWhirlpool {
  whirlpoolsConfig: string;
  whirlpoolBump: number;
  tickSpacing: number;
  feeTierIndexSeed: number;
  feeRate: number;
  protocolFeeRate: number;
  liquidity: bigint;
  sqrtPrice: bigint;
  tickCurrentIndex: number;
  protocolFeeOwedA: bigint;
  protocolFeeOwedB: bigint;
  tokenMintA: string;
  tokenVaultA: string;
  feeGrowthGlobalA: bigint;
  tokenMintB: string;
  tokenVaultB: string;
  feeGrowthGlobalB: bigint;
  rewardLastUpdatedTimestamp: bigint;
  rewardInfos: DecodedRewardInfo[];
}

// ─────────────────────────────── DECODER ───────────────────────────────
export function decodeWhirlpoolAccount(data: Buffer | Uint8Array): DecodedWhirlpool {
  const bytes = Uint8Array.from(data);
  let offset = 8;

  const whirlpoolsConfig = readPubkey(bytes, offset); offset += 32;
  const whirlpoolBump = readU8(bytes, offset); offset += 1;
  const tickSpacing = readU16LE(bytes, offset); offset += 2;
  const feeTierIndexSeed = readU16LE(bytes, offset); offset += 2;
  const feeRate = readU16LE(bytes, offset); offset += 2;
  const protocolFeeRate = readU16LE(bytes, offset); offset += 2;
  const liquidity = readU128LE(bytes, offset); offset += 16;
  const sqrtPrice = readU128LE(bytes, offset); offset += 16;
  const tickCurrentIndex = readI32LE(bytes, offset); offset += 4;
  const protocolFeeOwedA = readU64LE(bytes, offset); offset += 8;
  const protocolFeeOwedB = readU64LE(bytes, offset); offset += 8;
  const tokenMintA = readPubkey(bytes, offset); offset += 32;
  const tokenVaultA = readPubkey(bytes, offset); offset += 32;
  const feeGrowthGlobalA = readU128LE(bytes, offset); offset += 16;
  const tokenMintB = readPubkey(bytes, offset); offset += 32;
  const tokenVaultB = readPubkey(bytes, offset); offset += 32;
  const feeGrowthGlobalB = readU128LE(bytes, offset); offset += 16;
  const rewardLastUpdatedTimestamp = readU64LE(bytes, offset); offset += 8;

  // decode rewardInfos (3 * 128 bytes = 384)
  const rewardInfos: DecodedRewardInfo[] = [];
  for (let i = 0; i < 3; i++) {
    const mint = readPubkey(bytes, offset); offset += 32;
    const vault = readPubkey(bytes, offset); offset += 32;
    const authority = readPubkey(bytes, offset); offset += 32;
    const emissionsPerSecondX64 = readU128LE(bytes, offset); offset += 16;
    const growthGlobalX64 = readU128LE(bytes, offset); offset += 16;
    rewardInfos.push({ mint, vault, authority, emissionsPerSecondX64, growthGlobalX64 });
  }

  return {
    whirlpoolsConfig,
    whirlpoolBump,
    tickSpacing,
    feeTierIndexSeed,
    feeRate,
    protocolFeeRate,
    liquidity,
    sqrtPrice,
    tickCurrentIndex,
    protocolFeeOwedA,
    protocolFeeOwedB,
    tokenMintA,
    tokenVaultA,
    feeGrowthGlobalA,
    tokenMintB,
    tokenVaultB,
    feeGrowthGlobalB,
    rewardLastUpdatedTimestamp,
    rewardInfos,
  };
}

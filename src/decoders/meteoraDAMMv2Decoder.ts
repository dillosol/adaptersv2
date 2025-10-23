import { PublicKey } from "@solana/web3.js";

const SKIP_DISCRIMINATOR = true;
const NUM_REWARDS = 2;
const REWARD_PER_TOKEN_STORED_LEN = 32;

/* ---------- helpers ---------- */
function b(a: Uint8Array, o: number, n: number) {
  if (o + n > a.length) throw new Error(`OOB @${o}`);
}
function u8(a: Uint8Array, o: number) { return a[o]; }
function u16(a: Uint8Array, o: number) { return a[o] | (a[o + 1] << 8); }
function u32(a: Uint8Array, o: number) { return (a[o] | (a[o + 1] << 8) | (a[o + 2] << 16) | (a[o + 3] << 24)) >>> 0; }
function u64(a: Uint8Array, o: number) { let v = 0n; for (let i = 0; i < 8; i++) v |= BigInt(a[o + i]) << (8n * BigInt(i)); return v; }
function u128(a: Uint8Array, o: number) { let v = 0n; for (let i = 0; i < 16; i++) v |= BigInt(a[o + i]) << (8n * BigInt(i)); return v; }
function pk(a: Uint8Array, o: number) { return new PublicKey(a.slice(o, o + 32)).toBase58(); }

/* ---------- nested structs ---------- */
function baseFee(a: Uint8Array, o: number) {
  const cliff_fee_numerator = u64(a, o); o += 8;
  const base_fee_mode = u8(a, o); o += 6 + 2; // skip pad5 + first_factor
  o += 8; // second_factor
  const third_factor = u64(a, o); o += 8;
  o += 8; // padding_1
  return { size: 40, cliff_fee_numerator, base_fee_mode, third_factor };
}

function dynamicFee(a: Uint8Array, o: number) {
  const initialized = u8(a, o); o += 1 + 7;
  const max_volatility_accumulator = u32(a, o); o += 4;
  const variable_fee_control = u32(a, o); o += 4;
  const bin_step = u16(a, o); o += 2;
  const filter_period = u16(a, o); o += 2;
  const decay_period = u16(a, o); o += 2;
  const reduction_factor = u16(a, o); o += 2;
  const last_update_timestamp = u64(a, o); o += 8;
  const bin_step_u128 = u128(a, o); o += 16;
  const sqrt_price_reference = u128(a, o); o += 16;
  const volatility_accumulator = u128(a, o); o += 16;
  const volatility_reference = u128(a, o); o += 16;
  return {
    size: 96,
    initialized,
    max_volatility_accumulator,
    variable_fee_control,
    bin_step,
    filter_period,
    decay_period,
    reduction_factor,
    last_update_timestamp,
    bin_step_u128,
    sqrt_price_reference,
    volatility_accumulator,
    volatility_reference,
  };
}

function poolFees(a: Uint8Array, o: number) {
  const base_fee = baseFee(a, o); o += base_fee.size;
  const protocol_fee_percent = u8(a, o++);
  const partner_fee_percent = u8(a, o++);
  const referral_fee_percent = u8(a, o++);
  o += 5; // padding_0[5]
  const dyn = dynamicFee(a, o); o += dyn.size;
  o += 16; // padding_1 [u64;2]
  return {
    size: 160,
    base_fee,
    protocol_fee_percent,
    partner_fee_percent,
    referral_fee_percent,
    dynamic_fee: dyn,
  };
}

function metrics(a: Uint8Array, o: number) {
  const total_lp_a_fee = u128(a, o); o += 16;
  const total_lp_b_fee = u128(a, o); o += 16;
  const total_protocol_a_fee = u64(a, o); o += 8;
  const total_protocol_b_fee = u64(a, o); o += 8;
  const total_partner_a_fee = u64(a, o); o += 8;
  const total_partner_b_fee = u64(a, o); o += 8;
  const total_position = u64(a, o); o += 8;
  o += 8;
  return {
    size: 80,
    total_lp_a_fee,
    total_lp_b_fee,
    total_protocol_a_fee,
    total_protocol_b_fee,
    total_partner_a_fee,
    total_partner_b_fee,
    total_position,
  };
}

function rewardInfo(a: Uint8Array, o: number) {
  const initialized = u8(a, o); o += 1;
  const reward_token_flag = u8(a, o); o += 1 + 6 + 8;
  const mint = pk(a, o); o += 32;
  const vault = pk(a, o); o += 32;
  const funder = pk(a, o); o += 32;
  const reward_duration = u64(a, o); o += 8;
  const reward_duration_end = u64(a, o); o += 8;
  const reward_rate = u128(a, o); o += 16;
  o += REWARD_PER_TOKEN_STORED_LEN;
  const last_update_time = u64(a, o); o += 8;
  const cumulative_seconds_with_empty_liquidity_reward = u64(a, o); o += 8;
  return {
    size: 192,
    initialized,
    reward_token_flag,
    mint,
    vault,
    funder,
    reward_duration,
    reward_duration_end,
    reward_rate,
    last_update_time,
    cumulative_seconds_with_empty_liquidity_reward,
  };
}

/* ---------- main ---------- */
export function decodeDammV2Pool(data: Buffer | Uint8Array) {
  const a = Uint8Array.from(data);
  let o = SKIP_DISCRIMINATOR ? 8 : 0;

  const pool_fees = poolFees(a, o); o += pool_fees.size;

  const token_a_mint = pk(a, o); o += 32;
  const token_b_mint = pk(a, o); o += 32;
  const token_a_vault = pk(a, o); o += 32;
  const token_b_vault = pk(a, o); o += 32;
  const whitelisted_vault = pk(a, o); o += 32;
  const partner = pk(a, o); o += 32;

  const liquidity = u128(a, o); o += 16;
  const _padding = u128(a, o); o += 16;
  const protocol_a_fee = u64(a, o); o += 8;
  const protocol_b_fee = u64(a, o); o += 8;
  const partner_a_fee = u64(a, o); o += 8;
  const partner_b_fee = u64(a, o); o += 8;

  const sqrt_min_price = u128(a, o); o += 16;
  const sqrt_max_price = u128(a, o); o += 16;
  const sqrt_price = u128(a, o); o += 16;

  const activation_point = u64(a, o); o += 8;
  const activation_type = u8(a, o); o += 1;
  const pool_status = u8(a, o); o += 1;
  const token_a_flag = u8(a, o); o += 1;
  const token_b_flag = u8(a, o); o += 1;
  const collect_fee_mode = u8(a, o); o += 1;
  const pool_type = u8(a, o); o += 1;
  const version = u8(a, o); o += 1;
  o += 1; // _padding_0

  o += 32 + 32; // fee_a_per_liquidity, fee_b_per_liquidity
  const permanent_lock_liquidity = u128(a, o); o += 16;

  const m = metrics(a, o); o += m.size;
  const creator = pk(a, o); o += 32;
  o += 8 * 6; // _padding_1 [u64;6]

  const reward_infos = [];
  for (let i = 0; i < NUM_REWARDS; i++) {
    const r = rewardInfo(a, o);
    reward_infos.push(r);
    o += r.size;
  }

  return {
    pool_fees, // <── fully included here
    token_a_mint, token_b_mint,
    token_a_vault, token_b_vault,
    whitelisted_vault, partner,
    liquidity, _padding,
    protocol_a_fee, protocol_b_fee, partner_a_fee, partner_b_fee,
    sqrt_min_price, sqrt_max_price, sqrt_price,
    activation_point, activation_type, pool_status,
    token_a_flag, token_b_flag, collect_fee_mode, pool_type, version,
    permanent_lock_liquidity,
    creator,
    metrics: m,
    reward_infos,
  };
}

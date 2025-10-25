import { Connection, PublicKey } from "@solana/web3.js";
import config from "../config.json" with { type: "json" };
import { getPriceFromReserves } from "./ammMath.ts";

/* ─────────────────────────────── Helper ─────────────────────────────── */
/** Read a little-endian u64 from a Buffer */
function readU64LE(buf: Buffer, offset: number): bigint {
  let v = 0n;
  for (let i = 0; i < 8; i++) v |= BigInt(buf[offset + i]) << (8n * BigInt(i));
  return v;
}

/* ─────────────────────────────── Main Test ─────────────────────────────── */
async function main() {
  const connection = new Connection(config.rpc, "processed");
  const baseVault = new PublicKey(config.pfamm.baseVault);
  const quoteVault = new PublicKey(config.pfamm.quoteVault);

  console.log("🔗 RPC:", config.rpc);
  console.log("🎯 Base Vault:", baseVault.toBase58());
  console.log("🎯 Quote Vault:", quoteVault.toBase58());

  // Fetch both token accounts
  const [baseAcc, quoteAcc] = await Promise.all([
    connection.getAccountInfo(baseVault),
    connection.getAccountInfo(quoteVault),
  ]);

  if (!baseAcc?.data || !quoteAcc?.data) {
    console.error("⚠️ Could not fetch one or both vaults.");
    return;
  }

  // Decode SPL Token balances
  const baseAmount = readU64LE(baseAcc.data, 64);
  const quoteAmount = readU64LE(quoteAcc.data, 64);

  console.log("📊 Base reserve (raw):", baseAmount.toString());
  console.log("📊 Quote reserve (raw):", quoteAmount.toString());

  // Calculate the AMM price
  const price = getPriceFromReserves(
    baseAmount,
    quoteAmount,
    config.pfamm.baseDecimals,
    config.pfamm.quoteDecimals
  );

  console.log("💰 Normalized price (quote per base):", price);
}

main().catch((err) => console.error("❌ Error:", err));

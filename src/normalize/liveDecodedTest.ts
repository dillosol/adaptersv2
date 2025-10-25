import { Connection, PublicKey } from "@solana/web3.js";
import config from "../config.json" with { type: "json" };
import { normalizePoolUpdate } from "./poolNormalizer.ts";

import { decodePumpfunPool } from "../decoders/pfAmmDecoder.ts";
import { decodeDammV2Pool } from "../decoders/meteoraDAMMv2Decoder.ts";
import { decodeRaydiumPoolState } from "../decoders/decodeRaydiumPoolState.js";
import { decodeWhirlpoolAccount } from "../decoders/orcaDecoder.ts";

/* ───────────── helper: read u64 from token account buffer ───────────── */
function readU64LE(buf: Buffer, offset: number): bigint {
  let v = 0n;
  for (let i = 0; i < 8; i++) v |= BigInt(buf[offset + i]) << (8n * BigInt(i));
  return v;
}

async function fetchAccount(connection: Connection, address: string) {
  const pubkey = new PublicKey(address);
  const acc = await connection.getAccountInfo(pubkey, "processed");
  return { pubkey, acc };
}

async function fetchTokenAmount(connection: Connection, vault: PublicKey) {
  const acc = await connection.getAccountInfo(vault, "processed");
  if (!acc?.data) return 0n;
  return readU64LE(acc.data, 64); // amount offset in SPL Token account
}

/* ─────────────────────────────────────────────── */
async function main() {
  const connection = new Connection(config.rpc, "processed");
  console.log("🌐 RPC:", config.rpc);

  const [pf, dm, rd, or] = await Promise.all([
    fetchAccount(connection, config.pfamm.lpAddress),
    fetchAccount(connection, config.dammv2.lpAccount),
    fetchAccount(connection, config.raydiumClmm.lpAccount),
    fetchAccount(connection, config.orca.lpAccount),
  ]);

  const pools = [
    { source: "PUMPFUN", account: pf },
    { source: "DAMMV2", account: dm },
    { source: "RAYDIUMCLMM", account: rd },
    { source: "ORCA", account: or },
  ];

  for (const p of pools) {
    const acc = p.account.acc;
    console.log("──────────────────────────────────────────────");
    console.log(`🔹 Source: ${p.source}`);

    if (!acc?.data) {
      console.log("⚠️ Account not found or no data.");
      continue;
    }

    let decoded: any = {};
    try {
      switch (p.source) {
        case "PUMPFUN":
          decoded = decodePumpfunPool(acc.data as Buffer);

          // fetch the vault token accounts and decode balances
          const baseVaultPk = new PublicKey(decoded.pool_base_token_account);
          const quoteVaultPk = new PublicKey(decoded.pool_quote_token_account);
          const [baseAmt, quoteAmt] = await Promise.all([
            fetchTokenAmount(connection, baseVaultPk),
            fetchTokenAmount(connection, quoteVaultPk),
          ]);

          decoded.baseVault = {
            pubkey: baseVaultPk.toBase58(),
            amount: baseAmt,
          };
          decoded.quoteVault = {
            pubkey: quoteVaultPk.toBase58(),
            amount: quoteAmt,
          };
          break;

        case "DAMMV2":
          decoded = decodeDammV2Pool(acc.data as Buffer);
          break;

        case "RAYDIUMCLMM":
          decoded = decodeRaydiumPoolState(acc.data as Buffer);
          break;

        case "ORCA":
          decoded = decodeWhirlpoolAccount(acc.data as Buffer);
          break;
      }
    } catch (err) {
      console.error("❌ Decode error:", err);
      continue;
    }

    console.log("📦 Decoded pool object:\n", decoded);

    // build update for normalizer
    const update = {
      source: p.source,
      poolAddress: p.account.pubkey.toBase58(),
      slot: 0,
      timestamp: Date.now(),
      baseDecimals: config[p.source.toLowerCase()]?.baseDecimals ?? 9,
      quoteDecimals: config[p.source.toLowerCase()]?.quoteDecimals ?? 6,
      ...decoded,
    };

    const normalized = normalizePoolUpdate(update);
    console.log("📘 Normalized object:\n", normalized);
  }

  console.log("✅ Live decode + normalize test complete.");
}

main().catch((err) => console.error("❌ Error:", err));

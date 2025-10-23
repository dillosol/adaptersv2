# 🧠 adaptersv2

**AdaptersV2** is a fast, low-level decoding module for **Solana DAMM / AMM pools**, optimized for speed and accuracy.  
It’s designed to plug directly into high-performance bots, analyzers, or WebSocket listeners.

---

## ⚡ Features

- **Zero-dependency decoding** — raw bytes in, structured data out  
- **Full alignment** with on-chain `Pool`, `PoolFeesStruct`, `DynamicFeeStruct`, and `RewardInfo` layouts  
- **TypeScript-first design** (works seamlessly with `tsx` / `bun` / `node`)  
- **Optimized for live pipelines** — no console noise, no unnecessary allocations  
- **Supports multi-reward pools** (dynamic `NUM_REWARDS` logic)

---

## 🧩 Example Usage

```ts
import { decodeDammV2Pool } from "./meteoraDAMMv2Decoder";
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const poolPubkey = new PublicKey("YOUR_POOL_PUBKEY_HERE");

const accountInfo = await connection.getAccountInfo(poolPubkey);
if (accountInfo?.data) {
  const pool = decodeDammV2Pool(accountInfo.data);
  console.log("Pool liquidity:", pool.liquidity.toString());
  console.log("Dynamic fee sqrt ref:", pool.pool_fees.dynamic_fee.sqrt_price_reference.toString());
}

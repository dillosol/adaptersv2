import config from "../src/config.json" with { type: "json" };
import { Connection, PublicKey } from "@solana/web3.js";
import { decodeRaydiumPoolState } from "./decoders/decodeRaydiumPoolState";

const connection = new Connection(config.rpc, "confirmed");
const RAYDIUM_LP = new PublicKey(config.raydiumClmm.lpAccount);

(async () => {
  console.log("🔍 Fetching Raydium CLMM account...");
  const info = await connection.getAccountInfo(RAYDIUM_LP);
  if (!info?.data) throw new Error("No account data returned");
  console.log("✅ Account data length:", info.data.length);

  const decoded = decodeRaydiumPoolState(info.data);

  console.log("\n================= FULL DECODE =================");
  for (const [key, val] of Object.entries(decoded)) {
    if (typeof val === "bigint") {
      console.log(`${key.padEnd(30)}: ${val.toString()}`);
    } else if (Array.isArray(val)) {
      console.log(`${key.padEnd(30)}: [${val.length} entries]`);
      if (val.length && typeof val[0] === "object") {
        val.forEach((r, i) => {
          console.log(`  Reward[${i}]:`);
          for (const [rk, rv] of Object.entries(r)) {
            console.log(`    ${rk.padEnd(25)}: ${rv.toString()}`);
          }
        });
      } else if (val.length && typeof val[0] === "bigint") {
        console.log("  " + val.map(v => v.toString()).join(", "));
      }
    } else {
      console.log(`${key.padEnd(30)}: ${val}`);
    }
  }

  console.log("================================================\n");
})();

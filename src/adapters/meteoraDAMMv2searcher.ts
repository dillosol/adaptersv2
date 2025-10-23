import { Connection, PublicKey } from "@solana/web3.js";
import config from "../config.json" with { type: "json" };
import { decodeDammV2Pool } from "../decoders/meteoraDAMMv2Decoder";


const connection = new Connection(config.rpc, "processed");
const DAMMV2_POOL = new PublicKey(config.dammv2.lpAccount);

/**
 * Subscribe to a Raydium CLMM pool and stream decoded updates.
 * @param onUpdate - callback to receive the decoded pool object each time data changes
 */
export function subscribeMeteoraDAMMv2(onUpdate: (decoded: any) => void) {
  console.log("🔗 Subscribing to Raydium CLMM pool...");

  const subscriptionId = connection.onAccountChange(
    DAMMV2_POOL,
    (accountInfo, ctx) => {
      try {
        if (!accountInfo?.data) return;

        const decoded = decodeDammV2Pool(accountInfo.data);
        const update = {
          source: "DAMMV2",
          slot: ctx.slot,
          timestamp: Date.now(),
          ...decoded,
        };

        onUpdate(update);
      } catch (err) {
        console.error("⚠️ Raydium decode error:", err);
      }
    },
    "processed"
  );

  console.log("✅ Raydium subscription active, ID:", subscriptionId);
  return subscriptionId;
}

/**
 * Optional helper to unsubscribe later if needed
 */
export async function unsubscribeMeteoraDAMMv2(id: number) {
  await connection.removeAccountChangeListener(id);
  console.log("🛑 Unsubscribed from Meteora DAMMv2");
}

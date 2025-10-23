import { Connection, PublicKey } from "@solana/web3.js";
import config from "../config.json" with { type: "json" };
import { decodeRaydiumPoolState } from "../decoders/decodeRaydiumPoolState.js";

const WSS_URL = config.rpc.replace("https", "wss");
const connection = new Connection(WSS_URL, "processed");
const RAYDIUM_POOL = new PublicKey(config.raydiumClmm.lpAccount);

/**
 * Subscribe to a Raydium CLMM pool and stream decoded updates.
 * @param onUpdate - callback to receive the decoded pool object each time data changes
 */
export function subscribeRaydiumCLMM(onUpdate: (decoded: any) => void) {
  console.log("🔗 Subscribing to Raydium CLMM pool...");

  const subscriptionId = connection.onAccountChange(
    RAYDIUM_POOL,
    (accountInfo, ctx) => {
      try {
        if (!accountInfo?.data) return;

        const decoded = decodeRaydiumPoolState(accountInfo.data);
        const update = {
          source: "RAYDIUMCLMM",
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
export async function unsubscribeRaydiumCLMM(id: number) {
  await connection.removeAccountChangeListener(id);
  console.log("🛑 Unsubscribed from Raydium CLMM");
}

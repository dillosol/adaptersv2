import config from "../config.json" with { type: "json" };
import { Connection, PublicKey } from "@solana/web3.js";
import { decodeWhirlpoolAccount } from "../decoders/orcaDecoder.js"; // compiled version of your TS file


const connection = new Connection(config.rpc, "processed");
const ORCA_LP_ACCOUNT = new PublicKey(config.orca.lpAccount);

/**
 * Subscribe to Orca Whirlpool account updates and decode in real time.
 * @param onUpdate callback fired whenever decoded data changes
 */
export function subscribeOrcaWhirlpool(onUpdate: (decoded: any) => void) {
  console.log("🔗 Subscribing to Orca Whirlpool account...");

  const subscriptionId = connection.onAccountChange(
    ORCA_LP_ACCOUNT,
    (accountInfo, ctx) => {
      if (!accountInfo?.data) return;
      try {
        const decoded = decodeWhirlpoolAccount(accountInfo.data);
        decoded.slot = ctx.slot;
        decoded.timestamp = Date.now();
        onUpdate(decoded);
      } catch (err) {
        console.error("Decode error:", err);
      }
    },
    "processed"
  );

  console.log("✅ Subscription active, ID:", subscriptionId);

  return subscriptionId;
}

/**
 * Optionally provide a clean-up method so you can unsubscribe when shutting down.
 */
export async function unsubscribeOrcaWhirlpool(id: number) {
  await connection.removeAccountChangeListener(id);
  console.log("🛑 Unsubscribed from Orca Whirlpool account");
}

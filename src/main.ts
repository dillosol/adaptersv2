import { Connection } from "@solana/web3.js";
import config from "./config.json" with { type: "json" };
import { subscribePumpfun, unsubscribePumpfun } from "./adapters/pfAmmSearcher.ts";
import { getPriceFromReserves } from "./math/ammMath.ts";

/**
 * Live test:
 *  - Opens WSS connection
 *  - Subscribes to Pumpfun pool
 *  - Runs AMM math on each update to calculate live price
 */
async function main() {
  const connection = new Connection(config.rpc, "processed");

  console.log("🌐 RPC:", config.rpc);
  console.log("🎯 LP:", config.pfamm.lpAddress);
  console.log("🧮 Watching Pumpfun pool...");

  // start live subscription
  const ids = await subscribePumpfun((update) => {
    try {
      const base = update.baseVault?.amount;
      const quote = update.quoteVault?.amount;
      if (!base || !quote) return;

      const price = getPriceFromReserves(
        quote,
        base,
        config.pfamm.baseDecimals,
        config.pfamm.quoteDecimals
      );

      console.log(
        `💰 [slot ${update.slot}] ${price.toFixed(6)} ${update.lpMeta.quote_mint.toString().slice(0,4)} per ${update.lpMeta.base_mint.toString().slice(0,4)}`
      );
    } catch (err) {
      console.error("⚠️ Math error:", err);
    }
  });

  console.log("✅ WebSocket live — waiting for updates...");
  console.log("Press Ctrl+C to stop.");

  // graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Closing subscription...");
    await unsubscribePumpfun(ids);
    process.exit(0);
  });
}

main().catch((err) => console.error("❌ Main error:", err));

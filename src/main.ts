import { subscribePumpfun, unsubscribePumpfun } from "./adapters/pfAmmSearcher";
import config from "./config.json" with { type: "json" };

async function main() {
  console.log("🌐 RPC Endpoint:", config.rpc);
  console.log("🎯 LP Address:", config.pfamm.lpAddress);

  // Start the Pumpfun subscription
  const ids = await subscribePumpfun((update) => {
    console.log("📡 Pumpfun Update @ Slot:", update.slot);
    console.dir(update, { depth: null });
  });

  console.log("✅ Pumpfun subscription active — waiting for updates...");

  // Graceful shutdown on Ctrl + C
  process.on("SIGINT", async () => {
    console.log("\n🛑 Stopping Pumpfun subscription...");
    await unsubscribePumpfun(ids);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("❌ Error starting Pumpfun test:", err);
});

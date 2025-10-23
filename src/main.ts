import { subscribeRaydiumCLMM } from "./adapters/raydiumCLMMsearcher";

console.log("🚀 Starting Raydium CLMM listener...");

let latestRaydium: any = null;

subscribeRaydiumCLMM((decoded) => {
  latestRaydium = decoded;
  console.clear();

  console.log("🧩 Raydium CLMM Update ----------------------");
  console.log(`Slot: ${decoded.slot}`);
  console.log(`Timestamp: ${new Date(decoded.timestamp).toLocaleTimeString()}`);
  console.log(`Liquidity: ${decoded.liquidity.toString()}`);
  console.log(`sqrtPriceX64: ${decoded.sqrtPriceX64.toString()}`);
  console.log(`tickCurrent: ${decoded.tickCurrent}`);
  console.log(`Total Fees Token0: ${decoded.totalFeesToken0.toString()}`);
  console.log(`Total Fees Token1: ${decoded.totalFeesToken1.toString()}`);
  console.log("---------------------------------------------\n");
});

process.stdin.resume(); // keep the process alive

import { subscribeMeteoraDAMMv2 } from "./adapters/meteoraDAMMv2searcher";

function handleUpdate(update: any) {
  console.log("📡 Meteora DAMM update:");
  console.dir(update, { depth: null });
}

subscribeMeteoraDAMMv2(handleUpdate);

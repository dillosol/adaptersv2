import { Connection, PublicKey } from "@solana/web3.js";
import config from "../config.json" with { type: "json" };
import { decodePumpfunPool } from "../decoders/pfAmmDecoder";

/* fast token-account parser */
function readU64LE(buf: Buffer, offset: number): bigint {
  let v = 0n; for (let i = 0; i < 8; i++) v |= BigInt(buf[offset + i]) << (8n * BigInt(i)); return v;
}
function decodeTokenAccountFast(data: Buffer) {
  const mint = new PublicKey(data.subarray(0, 32));
  const owner = new PublicKey(data.subarray(32, 64));
  const amount = readU64LE(data, 64);
  return { mint: mint.toBase58(), owner: owner.toBase58(), amount };
}


const connection = new Connection(config.rpc, "processed");
const LP_ACCOUNT = new PublicKey(config.pfamm.lpAddress);

export async function subscribePumpfun(onUpdate: (decoded: any) => void) {
  console.log("🔗 Subscribing to Pumpfun pool...");

  // one-time LP fetch
  const lpInfo = await connection.getAccountInfo(LP_ACCOUNT);
  if (!lpInfo?.data) throw new Error("LP account not found");
  const lpMeta = decodePumpfunPool(lpInfo.data);
  const baseVault = new PublicKey(lpMeta.pool_base_token_account);
  const quoteVault = new PublicKey(lpMeta.pool_quote_token_account);

  const state = { lpMeta, base: null as any, quote: null as any };
  let timer: NodeJS.Timeout | null = null;

  const emit = (slot: number) => {
    onUpdate({
      source: "PUMPFUN",
      slot,
      timestamp: Date.now(),
      lpMeta,
      baseVault: state.base,
      quoteVault: state.quote,
    });
  };

  const maybeEmit = () => {
    if (state.base && state.quote && state.base.slot === state.quote.slot) {
      if (timer) clearTimeout(timer); emit(state.base.slot);
    } else {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const slot = Math.max(state.base?.slot ?? 0, state.quote?.slot ?? 0);
        emit(slot);
      }, 25);
    }
  };

  const baseId = connection.onAccountChange(
    baseVault,
    (acc, ctx) => { const t = decodeTokenAccountFast(acc.data as Buffer); state.base = { ...t, slot: ctx.slot }; maybeEmit(); },
    "processed"
  );

  const quoteId = connection.onAccountChange(
    quoteVault,
    (acc, ctx) => { const t = decodeTokenAccountFast(acc.data as Buffer); state.quote = { ...t, slot: ctx.slot }; maybeEmit(); },
    "processed"
  );

  console.log("✅ Pumpfun subscription active");
  console.log("Base Vault:", baseVault.toBase58());
  console.log("Quote Vault:", quoteVault.toBase58());
  console.log("LP Creator:", lpMeta.creator.toBase58());

  return { baseId, quoteId };
}

export async function unsubscribePumpfun(ids: { baseId: number; quoteId: number }) {
  await Promise.all([
    connection.removeAccountChangeListener(ids.baseId),
    connection.removeAccountChangeListener(ids.quoteId),
  ]);
  console.log("🛑 Unsubscribed from Pumpfun pool");
}

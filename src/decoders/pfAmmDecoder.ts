import { PublicKey } from "@solana/web3.js";

export function decodePumpfunPool(buffer: Buffer) {
  let offset = 8; // skip the 8-byte discriminator

  const pool_bump = buffer.readUInt8(offset); offset += 1;
  const index = buffer.readUInt16LE(offset); offset += 2;
  const creator = new PublicKey(buffer.slice(offset, offset + 32)); offset += 32;
  const base_mint = new PublicKey(buffer.slice(offset, offset + 32)); offset += 32;
  const quote_mint = new PublicKey(buffer.slice(offset, offset + 32)); offset += 32;
  const lp_mint = new PublicKey(buffer.slice(offset, offset + 32)); offset += 32;
  const pool_base_token_account = new PublicKey(buffer.slice(offset, offset + 32)); offset += 32;
  const pool_quote_token_account = new PublicKey(buffer.slice(offset, offset + 32)); offset += 32;
  const lp_supply = buffer.readBigUInt64LE(offset); offset += 8;
  const coin_creator = new PublicKey(buffer.slice(offset, offset + 32)); offset += 32;

  return {
    pool_bump,
    index,
    creator,
    base_mint,
    quote_mint,
    lp_mint,
    pool_base_token_account,
    pool_quote_token_account,
    lp_supply,
    coin_creator,
  };
}

import { Connection, PublicKey } from "@solana/web3.js";
import { decodeDammV2Pool } from "./meteoraDAMMv2Decoder.js";
import { decodeRaydiumPoolState } from "./decodeRaydiumPoolState.js";
import {decodeWhirlpoolAccount}from "./orcaDecoder.js"
import config from "../config.json" with { type: "json" };

const connection = new Connection(config.rpc, "confirmed");
const poolKey = new PublicKey(config.raydiumClmm.lpAccount);
async function test() {
    const info = await connection.getAccountInfo(poolKey);
console.log(decodeRaydiumPoolState(info!.data));

}

test()
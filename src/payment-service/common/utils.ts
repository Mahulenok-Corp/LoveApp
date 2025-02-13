import { Address, fromNano } from "@ton/core";
import { Event } from "tonapi-sdk-js";
import { client } from "../settings/client.js";

export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
export function gramsToTON(grams: number) {
  return fromNano(grams);
}

export async function parseEvent(event: Event) {
  const type = event.actions[0].type;
  const sender = Address.parse(
    Address.parseRaw(event.actions[0][type].sender.address).toString()
  ).toString();

  const destination = Address.parse(
    Address.parseRaw(event.actions[0][type].recipient.address).toString()
  ).toString();

  const payload: string = event.actions[0][type].comment ?? "";

  const amount: number = event.actions[0][type].amount ?? 0;
  const amountPretty = gramsToTON(amount);

  const nftItem = event.actions[0][type].nft ?? null;

  let nftCollection = null;
  let nftData = null;
  if (type === "NftItemTransfer") {
    const result = await client.nft.getNftItemByAddress(nftItem);
    nftCollection = result.collection.address;
    nftData = await client.nft.getNftItemByAddress(nftItem);
  }

  return { sender, destination, type, payload, amount, amountPretty, nftItem, nftCollection, nftData };
}

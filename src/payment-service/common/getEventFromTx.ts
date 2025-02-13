import { logger } from "../../shared/logger/logger.js";
import { getEventFromEventHash, _getEventFromEventHash } from "./getTxFromHash.js";
import { delay } from "./utils.js";

const MAX_RETRIES = 10;
const RETRY_DELAY = 2000;

export async function getEventFromTx(accountHex: string, txHash: string, retries = 0) {
  try {
    const event = await _getEventFromEventHash(txHash);
    getEventFromEventHash(accountHex, event.event_id, "WS");
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await delay(RETRY_DELAY);
      await getEventFromTx(accountHex, txHash, retries + 1);
    } else {
      logger.error({ message: "Error in getEventFromTx", error });
    }
  }
}

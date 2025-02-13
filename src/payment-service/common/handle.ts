import { Event, Transaction } from "tonapi-sdk-js";
import ApiError from "../../shared/errors/api-error.js";
import { logger } from "../../shared/logger/logger.js";
import { saveEvent, Status } from "./saveEvent.js";
import { parseEvent } from "./utils.js";
import { validateEvent } from "./validate.js";

export async function handleEvent(accountHex: string, event: Event, tx: Transaction, from: string) {
  try {
    if (event.in_progress) {
      logger.error(`Tx ${event.event_id} still in progress`);
      throw new ApiError(500, `Tx ${event.event_id} still in progress`);
    }

    // try catch func, if error - save as with error, else save as open
    let { success, status } = validateEvent(accountHex, event);
    if (!success) {
      await saveEvent({
        event,
        status,
        accountHex,
        from,
      });
      return;
    } else {
      const { sender, destination, payload, type, amount, amountPretty, nftCollection, nftItem, nftData } = await parseEvent(event);

      if (type === "JettonTransfer") {
        if (payload.length === 66 && payload.substring(1, 2) === ":") {
        } else if (payload.length !== 36) {
          status = "err_invalid_payload_len";
        }
      }

      await saveEvent({
        event,
        sender,
        accountHex,
        from,
        destination,
        payload,
        type,
        amount,
        amountPretty,
        nftCollection,
        nftItem,
        nftData,
        status,
      });
    }
  } catch (error) {
    logger.error(`Handle Event: ${error}`);
    throw error;
  }
}

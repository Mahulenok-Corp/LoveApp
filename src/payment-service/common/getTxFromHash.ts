import { eventsRepository } from "../../database/repositories/EventsLog.js";
import { logger } from "../../shared/logger/logger.js";
import { client } from "../settings/client.js";
import { handleEvent } from "./handle.js";
import { delay } from "./utils.js";

// 5 * 6 min
const MAX_RETRIES = 60 * 6;
const RETRY_DELAY = 5000;

// Используется для того, чтобы не брать в обработку один ивент несколько раз
let hashStorage: { [key: string]: boolean } = {};

// todo
// Проблема что за один ивент может браться несколько getEventFromHash
// Попробую просто хранить в памяти
// Если будем поднимать несколько инстансов, нужен редис, но пока что будем хранить в оперативной памяти
export async function getEventFromEventHash(
  accountHex: string,
  eventHash: string,
  from: string,
  retries = 0
) {
  try {
    // logger.warn(`Prepare Event: ${eventHash}`);

    if (retries === 0) {
      if (hashStorage[eventHash] === true) {
        logger.warn(`Event taken: ${eventHash}`);
        return;
      }
      hashStorage[eventHash] = true;
    } else {
      await delay(RETRY_DELAY);
    }

    const eventExists = await eventsRepository.findOne({
      where: [{ event_id: eventHash }, { tx_hash: eventHash }],
    });
    if (eventExists) {
      delete hashStorage[eventHash];
      return;
    }

    const event = await _getEventFromEventHash(eventHash);
    const tx = await _getTxFromEventHash(eventHash);
    await handleEvent(accountHex, event, tx, from);
    delete hashStorage[eventHash];
  } catch (error) {
    logger.warn(`Retry event ${eventHash}: ${retries}`);
    if (retries < MAX_RETRIES) {
      await getEventFromEventHash(accountHex, eventHash, from, retries + 1);
    } else {
      logger.error(`Error in fetchTx: MaxRetries. Tx: ${eventHash}`);
    }
  }
}

export const _getEventFromEventHash = async (eventHash: string) => {
  try {
    const tx = await client.events.getEvent(eventHash);

    return tx;
  } catch (error) {
    logger.error({
      message: "Error in _getEventFromHash",
      error,
    });
  }
};

const _getTxFromEventHash = async (eventHash: string) => {
  try {
    const tx = await client.blockchain.getBlockchainTransaction(eventHash);

    return tx;
  } catch (error) {
    logger.error({
      message: "Error in _getTxFromHash",
      error,
    });
    throw new Error(`Failed to fetch transaction: ${error.message}`);
  }
};

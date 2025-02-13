import cron from "node-cron";
import { client } from "../settings/client.js";
import { getEventFromEventHash } from "../common/getTxFromHash.js";
import { logger } from "../../shared/logger/logger.js";
import { Event, AccountEvents } from "tonapi-sdk-js";
import { config } from "../../shared/config.js";
import storageService from "../../service/storage.js";
import { AvailableHandlers } from "../../shared/addresses.js";

interface RequestParams {
  startTimestamp: number;
  finishTimestamp: number;
}

/**
 *
 * @param accountHex Address to listen to
 * @param task
 */
export async function startBackrunner(accountHex: string, task?: AvailableHandlers) {
  logger.info("startBackrunner");
  cron.schedule(`*/${config.backrunnerTimeSeconds} * * * * *`, async () => {
    try {
      const { previousStartTimestamp } = await storageService.getBackrunnerStartTimestamp(accountHex);
      let result = await getAccountEvents(accountHex, previousStartTimestamp);
      const lastStartTimestamp = result.lastStartTimestamp === -1 ? previousStartTimestamp : result.lastStartTimestamp;

      await storageService.updateEventTimestamps(accountHex, lastStartTimestamp);
      if (result.eventData.length === 0) return;

      for (const eventHash of result.eventData) {
        getEventFromEventHash(accountHex, eventHash, "Backrunner");
      }
    } catch (error) {
      logger.error({ message: `Error Backrunner`, error });
    }
  });
}

async function getAccountEvents(accountHex: string, startTimestamp: number) {
  const start_date = startTimestamp - 10;
  const events = await client.accounts.getAccountEvents(accountHex, {
    limit: 100,
    start_date,
  });
  const res = parseAccountEvents(events);
  return res;
}

function parseAccountEvents(data: AccountEvents) {
  try {
    let lastStartTimestamp = -1;
    const eventData: string[] = data.events.map((item) => {
      if (!item) return;
      const event_id: string = item.event_id;
      const timestamp = item.timestamp;
      if (timestamp > lastStartTimestamp) {
        lastStartTimestamp = timestamp;
      }
      return event_id;
    });
    return { eventData, lastStartTimestamp };
  } catch (error) {
    logger.error(`parseTx: ${error}`);
  }
}

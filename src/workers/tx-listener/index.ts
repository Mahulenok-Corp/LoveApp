import { CronJob } from "cron";
import { Transactions } from "../../database/entities/Payment/Transactions.js";
import { eventsRepository } from "../../database/repositories/EventsLog.js";
import { txRepository } from "../../database/repositories/index.js";
import { Status } from "../../payment-service/common/saveEvent.js";
import { txService } from "../../service/transactions.js";
import { logger } from "../../shared/logger/logger.js";

export interface TxListenerResponse {
  id: number;
  accountHex: string;
  event_id: string;
  tx_hash: string;
  sender: string;
  destination: string;
  type: string;
  amount: string;
  amount_pretty: string;
  nft_collection: string | null;
  nft_item: string | null;
  nft_data: string | null;
  payload: string;
  status: Status;
  caught_by: string;
  creation_date: string;
}

//todo
const CANCELLATION_THRESHOLD_MS = 60 * 60 * 1000; // 60 minutes

async function processTransactions() {
  try {
    const now = new Date();
    const transactions = await txRepository.find({
      where: { status: "created" },
    });
    for (const tx of transactions) {
      const creationDate = new Date(tx.creationDate);
      const timeElapsed = now.getTime() - creationDate.getTime();

      // Cancel transactions that are older than X minutes
      if (timeElapsed > CANCELLATION_THRESHOLD_MS) {
        tx.status = "canceled";
        await txRepository.save(tx);
        continue;
      }

      sendTransaction(tx);
    }
  } catch (err) {
    logger.error({ message: `Error processing txs:`, err });
  }
}

//todo fix
async function sendTransaction(tx: Transactions) {
  try {
    const event = await eventsRepository.findOne({ where: { payload: tx.payload } });

    if (event) {
      console.log("FOUND EVENT");
      //@ts-ignore
      txService.tonValidateTx(tx, event);
    }
  } catch (err) {
    logger.error({ message: `Error processing tx ${tx.id}:`, err });
  }
}

// Start a cron job to run every 10 seconds
export const txListener = new CronJob("*/10 * * * * *", processTransactions);

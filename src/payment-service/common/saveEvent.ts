import { PostgresDataSource } from "../../database/db.js";
import { logger } from "../../shared/logger/logger.js";
import { Event, NftItem, Transaction } from "tonapi-sdk-js";
import { EventsLog } from "../../database/entities/Payment/EventsLog.js";

export type Status =
  | "commited"
  | "err_invalid_actions_len"
  | "err_invalid_account_hex"
  | "err_invalid_event_type"
  | "err_tx_failed"
  | "err_invalid_payload_len"
  | "err_no_base_tx"
  | "err_duplicate_unique"
  | "err_no_sender"
  | "err_no_recipient";

interface ISaveEvent {
  event: Event;
  status: Status;
  accountHex: string;
  from: string;
  sender?: string | null;
  destination?: string | null;
  payload?: string | null;
  type?: string | null;
  amount?: number | null;
  amountPretty?: string | null;
  nftCollection?: string | null;
  nftData?: NftItem;
  nftItem?: string | null;
}
export async function saveEvent({
  event,
  accountHex,
  from,
  status,
  sender,
  destination,
  payload,
  type,
  amount,
  amountPretty,
  nftCollection,
  nftData,
  nftItem,
}: ISaveEvent) {
  try {
    const queryRunner = PostgresDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("READ COMMITTED");
    try {
      // todo сделать c этим что то если ивент создаем раньше
      const savedEvent = await queryRunner.manager.findOne(EventsLog, {
        where: { event_id: event.event_id },
        lock: { mode: "pessimistic_write" },
      });
      if (savedEvent) {
        return;
      }

      const newEvent = new EventsLog();
      newEvent.event_id = event.event_id;
      // @ts-ignore
      newEvent.tx_hash = event.actions?.[0]?.base_transactions?.[0];
      newEvent.amount = amount?.toString();
      newEvent.amount_pretty = amountPretty;
      newEvent.payload = payload;
      newEvent.sender = sender;
      newEvent.destination = destination;
      newEvent.status = status;
      newEvent.accountHex = accountHex;
      newEvent.caught_by = from;
      newEvent.type = type ?? "Scam";
      newEvent.nft_collection = nftCollection;
      newEvent.nft_item = nftItem;
      newEvent.nft_data = JSON.stringify(nftData);

      await queryRunner.manager.save(newEvent);
      await queryRunner.commitTransaction();
      logger.info(`Saved event: ${event.event_id} with status: ${status}`);
    } catch (err) {
      logger.error(`Error in handleEvent: ${err}`);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  } catch (error: any) {
    if (error.toString().startsWith("QueryFailedError: duplicate key value violates unique constraint")) {
      await saveEvent({ event, accountHex, from, status: "err_duplicate_unique" });
    } else {
      throw error;
    }
  }
}

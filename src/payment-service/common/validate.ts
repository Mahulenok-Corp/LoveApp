import { logger } from "../../shared/logger/logger.js";
import { Event, Transaction } from "tonapi-sdk-js";
import { Status } from "./saveEvent.js";

// error - to retry, return - finish
export function validateEvent(accountHex: string, event: Event): { success: boolean; status: Status } {
  const type = event.actions[0].type;

  if (accountHex !== event.actions[0][type]?.recipient?.address) {
    logger.error(`Tx ${event.event_id}: Frontend sent invalid accountHex: ${accountHex}`);
    return { success: false, status: "err_invalid_account_hex" };
  }

  if (event.actions[0]?.status !== "ok") {
    logger.error(`Tx ${event.event_id} did not succeed`);
    return { success: false, status: "err_tx_failed" };
  }

  if (!event.actions[0][type].sender) {
    logger.error(`Tx ${event.event_id} has no sender`);
    return { success: false, status: "err_no_sender" };
  }

  if (!event.actions[0][type].recipient) {
    logger.error(`Tx ${event.event_id} has no sender`);
    return { success: false, status: "err_no_recipient" };
  }

  if (event.actions.length !== 1) {
    if (
      event.actions[1]?.type !== "ContractDeploy" ||
      event.actions[1]?.ContractDeploy?.address !== event.actions[0][type]?.sender?.address
    ) {
      logger.error(`Tx ${event.event_id} has many actions`);
      return { success: false, status: "err_invalid_actions_len" };
    }
  }

  if (event.actions[0]?.type !== "JettonTransfer") {
    logger.error(`Tx ${event.event_id} has invalid type`);
    return { success: false, status: "err_invalid_event_type" };
  }

  //@ts-ignore
  if (!event.actions?.[0]?.base_transactions?.[0]) {
    logger.error(`Tx ${event.event_id} has no base tx`);
    return { success: false, status: "err_no_base_tx" };
  }

  return { success: true, status: "commited" };
}

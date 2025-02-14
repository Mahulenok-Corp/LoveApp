import { Address } from "@ton/core";
import { randomUUID } from "node:crypto";
import { EntityManager } from "typeorm";
import { Transactions } from "../database/entities/Payment/Transactions.js";
import { Users } from "../database/entities/Users.js";
import { txRepository } from "../database/repositories/index.js";
import { TransactionManager } from "../database/utils/TransactionManager.js";
import ApiError from "../shared/errors/api-error.js";
import { logger } from "../shared/logger/logger.js";
import { TxListenerResponse } from "../workers/tx-listener/index.js";
import "dotenv/config";
import { Pairs } from "../database/entities/Pairs.js";

export const txService = {
  getTx: async (user_id: string, uuid: string) => {
    try {
      const tx = await txRepository.findOne({ where: { user_id, payload: uuid } });
      return tx;
    } catch (error) {
      logger.error({ message: "Error fetching activities:", err: error });
      throw error;
    }
  },

  tonValidateTx: async (tx: Transactions, data: TxListenerResponse) => {
    if (tx.status !== "created") {
      return;
    }

    await txService._buy(tx, data);
  },

  buy: async (user_id: string) => {
    return TransactionManager.executeTransaction(async (manager) => {
      const user = await manager.findOne(Users, { where: { id: user_id } });
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      const payload = randomUUID();
      const price = 100_000;
      const currencyAmount = price.toFixed(2);
      const tx = new Transactions();
      tx.user_id = user_id;
      tx.currency_amount = currencyAmount;
      tx.payload = payload;
      tx.ton_destination = process.env.ACCOUNT_HEX;
      tx.status = "created";
      await manager.save(tx);
      return payload;
    }).catch((error) => {
      logger.error({ message: "Error buy", err: error });
      throw error;
    });
  },

  //todo
  _buy: async (tx: Transactions, data: TxListenerResponse) => {
    return TransactionManager.executeTransaction(
      async (manager) => {
        try {
          const user = await manager.findOne(Users, { where: { id: tx.user_id } });

          if (!user) {
            throw new ApiError(404, "User not found");
          }

          tx.blockchain_event = data.event_id;

          if (data.status !== "commited") {
            throw new ApiError(500, `Invalid status: ${data.status}`);
          }

          if (data.type !== "JettonTransfer") {
            throw new ApiError(500, `Invalid type: ${data.type}, must be JettonTransfer`);
          }

          if (parseFloat(data.amount_pretty) < parseFloat(tx.currency_amount)) {
            throw new ApiError(500, `Invalid amount: ${data.amount_pretty}, must be ${tx.currency_amount}`);
          }

          if (data.accountHex !== tx.ton_destination) {
            throw new ApiError(500, `Invalid destination: ${data.accountHex}, must be ${tx.ton_destination}`);
          }

          await txService.fulfill(tx, manager);

          tx.status = "fulfilled";
          await manager.save(tx);
        } catch (err) {
          logger.error({ message: "Error in _buy", err });
          try {
            tx.status = "error_ton";
            tx.error_log = err;
            await manager.save(tx);
          } catch (error) {
            throw error;
          }
        }
      },
      { timeout: 500, retries: 3 }
    ).catch((error) => {
      logger.error({ message: "Error in _buy", err: error });
      throw error;
    });
  },

  fulfill: async (tx: Transactions, manager: EntityManager) => {
    console.log("BUY");
    const userId = tx.user_id;
    const pair = await manager.findOne(Pairs, {
      where: [
        { partner_referree: userId, is_divorced: false },
        { partner_referral: userId, is_divorced: false },
      ],
    });

    if (!pair) {
      throw new ApiError(404, "No active relationship found");
    }

    // Get user info before divorce
    const currentUser = await manager.findOne(Users, { where: { id: userId } });
    const partnerId = pair.partner_referree === userId ? pair.partner_referral : pair.partner_referree;
    const partner = await manager.findOne(Users, { where: { id: partnerId } });

    // Update pair status
    pair.is_divorced = true;
    pair.divorce_date = new Date();
    await manager.save(pair);

    return {
      success: true,
      message: "Successfully divorced",
      divorceDate: pair.divorce_date,
      divorcedPair: {
        myInfo: {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar,
        },
        partnerInfo: {
          id: partner.id,
          name: partner.name,
          username: partner.username,
          avatar: partner.avatar,
        },
      },
    };
  },
};

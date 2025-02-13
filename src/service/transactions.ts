import { Address } from "@ton/core";
import { EntityManager } from "typeorm";
import { Transactions } from "../database/entities/Payment/Transactions.js";
import { Users } from "../database/entities/Users.js";
import { txRepository } from "../database/repositories/index.js";
import { TransactionManager } from "../database/utils/TransactionManager.js";
import ApiError from "../shared/errors/api-error.js";
import { logger } from "../shared/logger/logger.js";
import { TxListenerResponse } from "../workers/tx-listener/index.js";

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

  buyTeaTon: async (user_id: string, amount: number) => {
    return TransactionManager.executeTransaction(async (manager) => {
      // const user = await manager.findOne(Users, { where: { id: user_id } });
      // if (!user) {
      //   throw new ApiError(404, "User not found");
      // }
      // const prices = await manager.findOne(Currency, {
      //   where: {
      //     teaCount: amount,
      //   },
      // });
      // if (!prices) {
      //   throw new ApiError(400, "Invalid tea amount");
      // }
      // const payload = randomUUID();
      // const currencyAmount = prices.ton.toFixed(2);
      // const tx = new Transactions();
      // tx.user_id = user_id;
      // tx.currency = "ton";
      // tx.currency_amount = currencyAmount;
      // //todo
      // tx.product = "tea";
      // tx.product_amount = amount;
      // tx.isMarket = true;
      // tx.payload = payload;
      // tx.ton_destination = config.TON_DESTINATION;
      // tx.status = "created";
      // await manager.save(tx);
      // return { ok: true, uuid: payload, amount: currencyAmount };
    }).catch((error) => {
      logger.error({ message: "Error buyTeaTon", err: error });
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

          const parsedSender = Address.parse(data?.sender).toString();
          if (user.wallet) {
            const parsedWallet = Address.parse(user?.wallet).toString();
            if (parsedSender !== parsedWallet) {
              tx.data = { suspicious: true, different_addresses: { wallet: parsedWallet, sender: parsedSender } };
            }
          } else {
            tx.data = { suspicious: true, different_addresses: { wallet: "empty", sender: parsedSender } };
          }

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
    let user = await manager.findOne(Users, { where: { id: tx.user_id } });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // if (tx.product === "special_offer") {
    //   const uso = await manager.findOne(UsersSpecialOffers, { where: { id: tx.product_id } });
    //   if (!uso) {
    //     throw new ApiError(404, "UsersSpecialOffers not found");
    //   }

    //   uso.bought_amount += tx.product_amount;

    //   await giveService.giveItemNoCommit(user, uso.source.product_id, manager, tx.product_amount);
    //   await manager.save([user, uso]);
    //   return;
    // }

    // if (tx.product === "nft_1") {
    //   user.nft_data.fresh_fish_1_burn = true;
    //   await giveService.giveItemNoCommit(user, "4c2215a9-2990-4785-83d9-d9d9cb09a001", manager);
    //   await manager.save(user);
    //   return;
    // }
  },
};

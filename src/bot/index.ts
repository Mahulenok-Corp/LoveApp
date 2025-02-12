import { Bot, InputFile } from "grammy";
import "dotenv/config";
import { logger } from "../shared/logger/logger.js";
import { messages } from "./texts/welcome.js";
import { getQueryRunnerConnected } from "../database/utils/queryRunner.js";
import { Transactions } from "../database/entities/Payment/Transactions.js";
import ApiError from "../shared/errors/api-error.js";
import { PostgresDataSource } from "../database/db.js";
import { Request } from "express";
import { sendMassMessage, SendMassMessageParams } from "./massSender.js";

export const bot = new Bot(process.env.BOT_API_KEY);
export const startBot = () => {
  try {
    bot.command("start", (ctx) => {
      return ctx.replyWithPhoto("https://media.not-gift.xyz/start.jpg", {
        caption: messages.welcome,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: messages.buttons.play,
                url: "https://t.me/glftnot_bot/notgift",
              },
            ],
            [
              {
                text: messages.buttons.subscribe,
                url: "https://t.me/notgift_channel",
              },
            ],
          ],
        },
      });
    });

    bot.start();
    logger.info("Bot instance started");
    bot.on("pre_checkout_query", async (ctx) => {
      try {
        const queryRunner = await getQueryRunnerConnected();
        await queryRunner.startTransaction("SERIALIZABLE");
        const payload = ctx?.update?.pre_checkout_query?.invoice_payload || "";
        const tx = await queryRunner.manager.findOne(Transactions, {
          where: {
            payload,
          },
        });

        try {
          if (!tx) {
            throw new ApiError(404, `Tx not found. Payload: ${payload}`);
          }
          if (tx.status !== "created") {
            throw new ApiError(404, `Invalid Tx status. Payload: ${payload}`);
          }

          if (tx.currency !== ctx?.update?.pre_checkout_query?.currency) {
            throw new ApiError(404, `Invalid currenct. Payload: ${payload}`);
          }

          if (tx.currency_amount != ctx?.update?.pre_checkout_query?.total_amount?.toString()) {
            throw new ApiError(404, `Invalid amount. Payload: ${payload}`);
          }
          tx.status = "pre_checkout_answered";
          tx.ctx = ctx;
          tx.stars_invoice_id = ctx?.update?.pre_checkout_query?.id;

          await queryRunner.manager.save(tx);
          await queryRunner.commitTransaction();
          return await ctx.answerPreCheckoutQuery(true);
        } catch (err) {
          logger.error({ message: "Error in answerPreCheckoutQuery", err: err.message ?? err });
          if (tx && tx.status === "fulfilled") {
            return await ctx.answerPreCheckoutQuery(false, {
              error_message: "Invoice already fulfilled. If you didn't receive your goods, please contact support",
            });
          }

          if (tx && tx.status !== "error") {
            tx.status = "error";
            tx.error_log = err;
            tx.ctx = ctx;
            await queryRunner.manager.save(tx);
          }
          try {
            await queryRunner.commitTransaction();
          } catch (error) {
            await queryRunner.rollbackTransaction();
          }
          return await ctx.answerPreCheckoutQuery(false, {
            error_message: "Can't proccess payment. Please retry with new invoice",
          });
        } finally {
          await queryRunner.release();
        }
      } catch (err) {
        logger.fatal({ message: "Impossible error in pre_checkout_query", err });
      }
    });

    bot.on("message:successful_payment", async (ctx) => {
      const payload = ctx?.update?.message?.successful_payment?.invoice_payload || "";

      // Базовые проверки до начала любых транзакций
      if (!ctx.message || !ctx.message.successful_payment) {
        logger.error({ message: `Invalid context. SP: Payload: ${payload}` });
        return;
      }

      try {
        // Находим и блокируем транзакцию
        let tx = await PostgresDataSource.createEntityManager().findOne(Transactions, {
          where: { payload },
          // lock: { mode: "pessimistic_write" },
        });

        if (!tx) {
          logger.error({ message: `Tx not found. SP: Payload: ${payload}` });
          throw new ApiError(404, `Tx not found with payload: ${payload}}`);
        }

        // Основная транзакция
        const queryRunner = await getQueryRunnerConnected();
        try {
          await queryRunner.startTransaction("READ COMMITTED");

          // Валидация данных до старта транзакции
          const validationError = validatePayment(tx, ctx);
          if (validationError) {
            logger.error({ message: validationError.message, payload });
            throw validationError;
          }

          // Помечаем как in_progress чтобы избежать дублирования
          tx.status = "processing";
          await queryRunner.manager.save(tx);

          //todo
          // await marketService.fulfill(tx, queryRunner.manager);

          tx.status = "fulfilled";
          tx.ctx = ctx;
          tx.telegram_payment_charge_id = ctx?.update?.message?.successful_payment?.telegram_payment_charge_id;

          await queryRunner.manager.save(tx);
          await queryRunner.commitTransaction();
        } catch (err) {
          logger.error({ message: "Error in successful_payment", err });
          await queryRunner.rollbackTransaction();
          await handlePaymentError(tx, err, ctx);
        } finally {
          await queryRunner.release();
        }
      } catch (err) {
        const userId = ctx?.update?.message?.from?.id;
        logger.fatal({
          message: "Critical error in successful_payment",
          err,
          payload,
          userId,
        });
        await sendPaymentErrorToTelegramChat(userId.toString(), payload, err);
      }
    });
  } catch (err) {
    logger.error({ err, message: "Error in bot" });
  }
};

function validatePayment(tx: Transactions, ctx: any): Error | null {
  if (tx.status !== "pre_checkout_answered") {
    return new ApiError(400, `Invalid Tx status. Status: ${tx.status}`);
  }

  if (tx.currency !== ctx?.update?.message?.successful_payment?.currency) {
    return new ApiError(400, `Invalid currency. Expected: ${tx.currency}`);
  }

  if (tx.currency_amount != ctx?.update?.message?.successful_payment?.total_amount?.toString()) {
    return new ApiError(400, `Invalid amount. Expected: ${tx.currency_amount}`);
  }

  return null;
}

async function handlePaymentError(tx: Transactions, error: Error, ctx: any) {
  return PostgresDataSource.transaction("READ COMMITTED", async (manager) => {
    try {
      // Сохраняем ошибку
      if (tx.status !== "error_sp") {
        tx.status = "error_sp";
        tx.error_log = error.stack;
        tx.ctx = ctx;
        tx = await manager.save(tx);
      }

      // Делаем возврат
      try {
        await ctx.api.refundStarPayment(
          ctx?.update?.message?.from?.id,
          ctx?.update?.message?.successful_payment?.telegram_payment_charge_id
        );
        tx.refunded = true;
        await manager.save(tx);
      } catch (refundError) {
        logger.error({
          message: "Refund failed",
          payload: tx.payload,
          error: refundError,
        });
        throw refundError;
      }
    } catch (err) {
      logger.error({
        message: "Error handling failed",
        payload: tx.payload,
        err,
      });
      throw err;
    }
  });
}

// todo use
export const sendPaymentErrorToTelegramChat = async (userId: string, payload: string, error: any) => {
  const ADMIN_CHAT_ID = -1002434543819;

  try {
    const stack = error.stack || error.toString();
    const msg = `⚠️ Payment Error Report ⚠️\n 
Env: ${process.env.NODE_ENV}
Date: ${new Date()}
User: \`${userId}\`

Payload: \`${payload}\`

Error Message: ${error.message}

Stack Trace:
\`\`\`${stack}\`\`\`
`;

    const formatted = formatMessage(msg);

    await bot.api.sendMessage(ADMIN_CHAT_ID, formatted, { parse_mode: "MarkdownV2" });
  } catch (err) {
    logger.error({ msg: "Failed to send error message to Telegram", err });
  }
};

export const sendErrorToTelegramChat = async (userId: string, req: Request, error: any) => {
  const ADMIN_CHAT_ID = -1002434543819;

  if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production") {
    try {
      const stack = error.stack || error.toString();
      const msg = `⚠️ Error Report ⚠️\n 
Env: ${process.env.NODE_ENV}
Date: ${new Date()}
User: \`${userId}\`

Url: \*${req?.url}\* \n

Query: \`${JSON.stringify(req?.query)}\` \n
Params: \`${JSON.stringify(req?.params)}\` \n
Body: \`${JSON.stringify(req?.body)}\`

Error Message: ${error.message}

Stack Trace:
\`\`\`${stack}\`\`\`
`;

      const formatted = formatMessage(msg);

      await bot.api.sendMessage(ADMIN_CHAT_ID, formatted, { parse_mode: "MarkdownV2" });
    } catch (err) {
      logger.error({ msg: "Failed to send error message to Telegram", err });
    }
  }
};

export const sendFrontendErrorToTelegramChat = async (userId: string, req: Request, text: any) => {
  const ADMIN_CHAT_ID = -4570879153;

  // if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production")
  try {
    const msg = `⚠️ Error Report ⚠️\n 
Env: ${process.env.NODE_ENV}
Date: ${new Date()}
User: ${userId}

Text:
${JSON.stringify(text)}
`;

    await bot.api.sendMessage(ADMIN_CHAT_ID, msg);
    return "ok";
  } catch (err) {
    logger.error({ msg: "Failed to send error frontend message to Telegram", err });
  }
};

const formatMessage = (msg: string) => {
  return (
    msg
      .replace(/\_/g, "\\_")
      // .replace(/\*/g, "\\*")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\~/g, "\\~")
      // .replace(/\`/g, "\\`")
      .replace(/\>/g, "\\>")
      .replace(/\#/g, "\\#")
      .replace(/\+/g, "\\+")
      .replace(/\-/g, "\\-")
      .replace(/\=/g, "\\=")
      .replace(/\|/g, "\\|")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/\./g, "\\.")
      .replace(/\!/g, "\\!")
  );
};

export const sendMassMessageBot = async (params: SendMassMessageParams) => {
  try {
    return await sendMassMessage(bot, params);
  } catch (error) {
    console.log("HERE ERROR");
    throw error;
  }
};

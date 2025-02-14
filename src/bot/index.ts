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
  } catch (err) {
    logger.error({ err, message: "Error in bot" });
  }
};

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

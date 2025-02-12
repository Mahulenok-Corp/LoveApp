import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram/tl/index.js";
import { PostgresDataSource } from "../../database/db.js";
import { Users } from "../../database/entities/Users.js";
import ApiError from "../../shared/errors/api-error.js";
import { logger } from "../../shared/logger/logger.js";

export class SuspiciousUserError extends ApiError {
  constructor(userId: number | string) {
    super(500, `User ${userId} needs to send message first`);
  }
}

const apiId = process.env.X_API_ID;
const apiHash = process.env.X_API_HASH;
const userSession = process.env.USER_SESSION_STRING;

let userClient: TelegramClient;

async function setupMessageLogger() {
  try {
    userClient.addEventHandler(async (event) => {
      if (event.className == "NewMessage" || event.className == "UpdateShortMessage") {
        try {
          const dialog = await userClient.getDialogs({
            offsetId: event.message.id + 1,
            ignorePinned: true,
            archived: false,
            limit: 1,
          });

          //@ts-ignore
          const userId = dialog[0].entity?.id?.value.toString();
          //@ts-ignore
          const accessHash = dialog[0].entity?.accessHash?.value.toString();

          if (userId && accessHash) {
            const res = await PostgresDataSource.createQueryBuilder()
              .update(Users)
              .set({ access_hash: accessHash })
              .where("id = :id AND access_hash IS NULL", { id: userId })
              .execute();
            if (res.affected === 0) {
              logger.warn(`ERR_CODE_1564: ${userId} ${accessHash} ${event.message}`);
            }
          } else {
            logger.warn(`ERR_CODE_1565: ${userId} ${accessHash}  ${event.message}`);
          }
        } catch (err) {
          logger.error({ message: "Error in message handler", err });
        }
      }
    });

    logger.info("Message logger setup completed");
  } catch (err) {
    logger.error({ message: "Error setting up message logger", err });
  }
}

// Модифицируем initTelegramClient
export async function initTelegramClient() {
  try {
    userClient = new TelegramClient(new StringSession(userSession), parseFloat(apiId), apiHash, {
      connectionRetries: 5,
    });
    await userClient.connect();
    await setupMessageLogger();
    logger.info("Telegram client connected and logger initialized");
  } catch (err) {
    logger.error({ message: "Failed to init telegram client", err });
    throw err;
  }
}

export async function getUserGifts(id: number, username: string) {
  try {
    let entity;
    // 1. Пробуем найти по username
    if (username && username.length > 0) {
      try {
        entity = await userClient.getEntity(`@${username}`);
      } catch (err) {
        logger.info("Failed to get entity by username");
      }
    }

    // 2. Если нет username или не нашли - ищем в БД
    if (!entity) {
      const user = await PostgresDataSource.createQueryBuilder()
        .select(["users.id", "users.username", "users.access_hash"])
        .from(Users, "users")
        .where("users.id = :id", { id: id.toString() })
        .andWhere("users.access_hash IS NOT NULL")
        .getOne();

      if (!user || !user.access_hash) {
        throw new SuspiciousUserError(id);
      }

      entity = {
        id: BigInt(user.id),
        accessHash: BigInt(user.access_hash),
      };
    }

    let totalPrice = 0;
    let offset = "";
    let count = 0;
    const CHUNK_SIZE = 100;

    while (true) {
      const result = await userClient.invoke(
        new Api.payments.GetUserStarGifts({
          userId: new Api.InputUser({
            userId: entity.id,
            accessHash: entity.accessHash,
          }),
          offset: offset,
          limit: CHUNK_SIZE,
        })
      );

      count += result.gifts.length;
      // Подсчитываем стоимость подарков в текущем чанке
      for (const gift of result.gifts) {
        totalPrice += parseFloat(gift.gift.stars.toString());
      }

      // Если получили меньше чем размер чанка - значит это последний чанк
      if (result.gifts.length < CHUNK_SIZE) {
        break;
      }

      // Обновляем offset для следующего чанка
      offset = result.nextOffset;
    }

    return {
      accessHash: entity.accessHash.toString(),
      count: count,
      totalPrices: totalPrice, // Если нужен подсчет
    };
  } catch (err) {
    if (err instanceof SuspiciousUserError) {
      throw err;
    }
    logger.error({ message: "Failed to get user gifts", err });
    throw err;
  }
}

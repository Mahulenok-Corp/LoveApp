import { Bot } from "grammy";
import { PostgresDataSource } from "../database/db.js";
import { logger } from "../shared/logger/logger.js";

export interface SendMassMessageParams {
  postId: string;
  message: string;
  userLimit: number;
  chunkSize: number;
  delayBetweenChunks: number;
  minCigAmonut: number;
  imageUrl?: string;
}

export async function sendMassMessage(bot: Bot, params: SendMassMessageParams) {
  const { postId, message, userLimit = 1000, chunkSize = 10, delayBetweenChunks = 1500, minCigAmonut = 0, imageUrl } = params;
  const manager = PostgresDataSource.createEntityManager();

  try {
    let processedCount = 0;
    let hasMoreUsers = true;

    while (hasMoreUsers) {
      const users = await manager
        .createQueryBuilder()
        .select("DISTINCT u.id", "id")
        .from("users", "u")
        .leftJoin("message_deliveries", "md", "u.id = md.user_id AND md.post_id = :postId", { postId })
        .where("md.id IS NULL")
        .andWhere("CAST(u.cig AS FLOAT) >= :cig", { cig: minCigAmonut }) //todo remove
        .limit(userLimit)
        .getRawMany();

      if (!users.length) {
        hasMoreUsers = false;
        break;
      }

      await manager
        .createQueryBuilder()
        .insert()
        .into("message_deliveries")
        .values(
          users.map((user) => ({
            id: () => "gen_random_uuid()",
            user_id: user.id,
            post_id: postId,
            delivered: false,
          }))
        )
        .execute();

      for (let i = 0; i < users.length; i += chunkSize) {
        const chunk = users.slice(i, i + chunkSize);

        await Promise.all(
          chunk.map(async (user) => {
            try {
              if (imageUrl) {
                // Send photo with caption
                await bot.api.sendPhoto(parseInt(user.id), imageUrl, {
                  caption: message,
                  parse_mode: "HTML",
                });
              } else {
                // Send text only
                await bot.api.sendMessage(parseInt(user.id), message, { parse_mode: "HTML" });
              }

              await manager
                .createQueryBuilder()
                .update("message_deliveries")
                .set({
                  delivered: true,
                  delivered_at: () => "CURRENT_TIMESTAMP",
                })
                .where("user_id = :userId AND post_id = :postId", {
                  userId: user.id,
                  postId,
                })
                .execute();
            } catch (err) {
              await manager
                .createQueryBuilder()
                .update("message_deliveries")
                .set({
                  delivered: false,
                  error_message: err.message,
                })
                .where("user_id = :userId AND post_id = :postId", {
                  userId: user.id,
                  postId,
                })
                .execute();
            }
          })
        );

        if (i + chunkSize < users.length) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenChunks));
        }
      }

      processedCount += users.length;
      logger.info(`Processed ${processedCount} users`);
    }

    const stats = await manager
      .createQueryBuilder("message_deliveries", "md")
      .select([
        "COUNT(*) as total",
        "COUNT(CASE WHEN delivered THEN 1 END) as succeeded",
        "COUNT(CASE WHEN NOT delivered THEN 1 END) as failed",
      ])
      .where("post_id = :postId", { postId })
      .getRawOne();

    return { success: true, stats };
  } catch (err) {
    logger.error({ message: `Failed to send mass message:`, err });
    return { success: false, error: err.message };
  }
}

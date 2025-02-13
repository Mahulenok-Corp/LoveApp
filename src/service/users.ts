import { Users } from "../database/entities/Users.js";
import ApiError from "../shared/errors/api-error.js";
import { logger } from "../shared/logger/logger.js";
import { TransactionManager } from "../database/utils/TransactionManager.js";
import { PostgresDataSource } from "../database/db.js";
import { Pairs } from "../database/entities/Pairs.js";

const generateRefCode = () => `LOVE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export const usersService = {
  get: async (id: string) => {
    const manager = PostgresDataSource.createEntityManager();
    const user = await manager.createQueryBuilder(Users, "user").where("user.id = :id", { id }).getOne();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const inviterPair = await manager.findOne(Pairs, {
      where: [{ is_divorced: false }],
    });

    if (!inviterPair) {
      return {
        user,
      };
    }

    let partnerInfo = await manager.findOne(Users, {
      where: [
        {
          id: inviterPair.partner_referree == id ? inviterPair.partner_referral : inviterPair.partner_referree,
        },
      ],
    });

    return {
      user,
      pair: {
        id: inviterPair.id,
        marriageDate: inviterPair.marriage_date,
        partnerInfo: {
          smth: inviterPair,
          id: partnerInfo.id,
          name: partnerInfo.name,
          username: partnerInfo.username,
          avatar: partnerInfo.avatar,
        },
      },
    };
  },

  updateRefCode: async (userId: string) => {
    return TransactionManager.executeTransaction(async (manager) => {
      try {
        const user = await manager.findOne(Users, { where: { id: userId } });

        if (!user) {
          throw new ApiError(404, "User not found");
        }

        user.ref_code = generateRefCode();

        await manager.save(user);

        return {
          success: true,
          new_ref_code: user.ref_code,
        };
      } catch (err) {
        logger.error({ message: "Error updating ref_code", err });
        throw err;
      }
    });
  },

  create: async ({ user_id, name, username, languageCode, avatar, ref_code }) => {
    return TransactionManager.executeTransaction(async (manager) => {
      try {
        const exist = await manager.findOne(Users, { where: { id: user_id } });

        if (exist) {
          return exist;
        }

        const newUser = manager.create(Users, {
          id: user_id,
          username,
          name,
          language_code: languageCode,
          avatar,
          ref_code: generateRefCode(),
        });

        await manager.save(newUser);

        if (ref_code) {
          const referree = await manager.findOne(Users, { where: { ref_code } });
          if (referree) {
            // Check if inviter is already in relationship
            const inviterPair = await manager.findOne(Pairs, {
              where: [{ is_divorced: false }],
            });

            if (inviterPair) {
              throw new ApiError(400, "This person is already in a relationship");
            }

            // Create new pair
            const pair = manager.create(Pairs, {
              partner_referree: referree.id,
              partner_referral: user_id,
              is_divorced: false,
            });

            await manager.save(pair);
          }
        }

        return newUser;
      } catch (err) {
        logger.error({ message: "Error in create user", err });
        throw err;
      }
    });
  },

  leaderboard: async (id: string) => {
    const manager = PostgresDataSource.createEntityManager();
    const leaderboard = await manager
      .createQueryBuilder(Users, "users")
      .select(["users.username", "users.avatar", "users.points", "users.creation_date", "users.name"])
      .orderBy("users.points", "DESC")
      .addOrderBy("users.creation_date", "DESC")
      .take(100)
      .getMany();

    const user = await manager.createQueryBuilder(Users, "user").where("user.id = :id", { id }).getOne();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    let userPosition = null;
    const position: number = await manager
      .createQueryBuilder(Users, "users")
      .andWhere("((users.points > :points) OR (users.points = :points AND users.creation_date < :creation_date))", {
        points: user.points,
        creation_date: user.creation_date,
      })
      .getCount();

    userPosition = position + 1;

    return {
      leaderboard,
      userPosition,
      userPoints: user.points,
    };
  },
};

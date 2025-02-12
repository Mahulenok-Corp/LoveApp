import { PostgresDataSource } from "../database/db.js";
import { Pairs } from "../database/entities/Pairs.js";
import { Users } from "../database/entities/Users.js";
import { TransactionManager } from "../database/utils/TransactionManager.js";
import ApiError from "../shared/errors/api-error.js";
import { logger } from "../shared/logger/logger.js";

export const pairsService = {
  getPairStatus: async (userId: string) => {
    try {
      // Найдем пару
      const pair = await PostgresDataSource.getRepository(Pairs)
        .createQueryBuilder("pairs")
        .where("(pairs.partner_referree = :userId OR pairs.partner_referral = :userId) AND pairs.is_divorced = false", {
          userId,
        })
        .getOne();

      if (!pair) {
        return {
          isMarried: false,
          myInfo: null,
          partnerInfo: null,
          marriageDate: null,
        };
      }

      // Получим информацию о текущем пользователе
      const currentUser = await PostgresDataSource.getRepository(Users)
        .createQueryBuilder("users")
        .where("users.id = :userId", { userId })
        .getOne();

      if (!currentUser) {
        throw new ApiError(404, "User not found");
      }

      // Получим информацию о партнере
      const partnerId = pair.partner_referree === userId ? pair.partner_referral : pair.partner_referree;
      const partner = await PostgresDataSource.getRepository(Users)
        .createQueryBuilder("users")
        .where("users.id = :partnerId", { partnerId })
        .getOne();

      if (!partner) {
        throw new ApiError(404, "Partner not found");
      }

      return {
        isMarried: true,
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
        marriageDate: pair.marriage_date,
      };
    } catch (err) {
      logger.error({ message: "Error getting pair status", err });
      throw err;
    }
  },

  acceptPairInvite: async (userId: string, inviteCode: string) => {
    return TransactionManager.executeTransaction(async (manager) => {
      // Check if user already in relationship
      const existingPair = await manager.findOne(Pairs, {
        where: [
          { partner_referree: userId, is_divorced: false },
          { partner_referral: userId, is_divorced: false },
        ],
      });

      if (existingPair) {
        throw new ApiError(400, "You are already in a relationship");
      }

      // Find inviter by their ref_code
      const inviter = await manager.findOne(Users, { where: { ref_code: inviteCode } });
      if (!inviter) {
        throw new ApiError(404, "Invalid invite code");
      }

      // Check if inviter is already in relationship
      const inviterPair = await manager.findOne(Pairs, {
        where: [
          { partner_referree: inviter.id, is_divorced: false },
          { partner_referral: inviter.id, is_divorced: false },
        ],
      });

      if (inviterPair) {
        throw new ApiError(400, "This person is already in a relationship");
      }

      // Get current user info
      const currentUser = await manager.findOne(Users, { where: { id: userId } });
      if (!currentUser) {
        throw new ApiError(404, "User not found");
      }

      // Create new pair
      const pair = manager.create(Pairs, {
        partner_referree: inviter.id,
        partner_referral: userId,
        is_divorced: false,
      });

      await manager.save(pair);

      return {
        success: true,
        pair: {
          id: pair.id,
          marriageDate: pair.marriage_date,
          myInfo: {
            id: currentUser.id,
            name: currentUser.name,
            username: currentUser.username,
            avatar: currentUser.avatar,
          },
          partnerInfo: {
            id: inviter.id,
            name: inviter.name,
            username: inviter.username,
            avatar: inviter.avatar,
          }
        }
      };
    });
  },

  divorce: async (userId: string) => {
    return TransactionManager.executeTransaction(async (manager) => {
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
          }
        }
      };
    });
  },
};

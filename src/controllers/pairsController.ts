import { Request, Response, NextFunction } from "express";
import { pairsService } from "../service/pairsService.js";
import { usersService } from "../service/users.js";

export default {
  getPairStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req["user"].id;
      const result = await pairsService.getPairStatus(userId);
      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  },

  getInviteCode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req["user"].id;
      const user = await usersService.get(userId);
      res.status(200).json({ inviteCode: user.user.ref_code });
    } catch (error: unknown) {
      next(error);
    }
  },

  divorce: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req["user"].id;
      const result = await pairsService.divorce(userId);
      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  },
};

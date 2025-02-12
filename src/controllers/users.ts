import { Request, Response, NextFunction } from "express";
import "dotenv/config";
import { usersService } from "../service/users.js";
import { validateNumNoError } from "../shared/utils/validate.js";

const usersController = {
  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req["user"].id;
      const result = await usersService.get(userId);

      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req["user"];
      const user_id = user.id;
      const name = `${user.firstName} ${user.lastName}`;
      const username = user.username ?? "";
      const languageCode = user.languageCode;

      let { avatar, referral_code: referralCode } = req.body;

      if (!avatar) avatar = "";

      if (!referralCode) referralCode = "";
      const result = await usersService.create({
        user_id,
        name,
        username,
        languageCode,
        avatar,
        ref_code: referralCode,
      });

      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  },

  update_refcode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req["user"].id;
      const result = await usersService.updateRefCode(userId);
      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  },
};

export default usersController;

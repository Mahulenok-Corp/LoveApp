import { txService } from "../service/transactions.js";
import ApiError from "../shared/errors/api-error.js";
import { Request, Response, NextFunction } from "express";

export const txController = {
  getTx: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req["user"].id;

      const { uuid } = req.body;

      if (!uuid) {
        throw new ApiError(400, "Invalid uuid");
      }

      const response = await txService.getTx(user_id, uuid);
      return res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  },

  buy: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req["user"].id;

      const response = await txService.buy(user_id);
      return res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  },
};

import { Request, Response, NextFunction } from "express";
import { tonService } from "../service/ton/ton.js";

export const tonController = {
  payload: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await tonService.generatePayload();
      res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  },

  verify: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req["user"].id;
      const proof = req.body;
      const response = await tonService.checkProof(user_id, proof);
      res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  },
};

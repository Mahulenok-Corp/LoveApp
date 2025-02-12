import { Request, Response, NextFunction } from "express";
import { sendMassMessageBot } from "../bot/index.js";

export const botController = {
  massSend: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId, message, userLimit, chunkSize, delayBetweenChunks, minCigAmonut, imageUrl } = req.body;

      const response = await sendMassMessageBot({ postId, message, userLimit, chunkSize, delayBetweenChunks, imageUrl, minCigAmonut });
      res.status(200).json({ status: "200", response });
    } catch (error: unknown) {
      next(error);
    }
  },
};

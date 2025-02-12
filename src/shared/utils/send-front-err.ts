import { Request, Response, NextFunction } from "express";
import { sendFrontendErrorToTelegramChat } from "../../bot/index.js";

export const sendFrontendError = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req["user"].id;
    const text = req.body;

    const result = await sendFrontendErrorToTelegramChat(userId, req, text);

    res.status(200).json({ message: result });
  } catch (error: unknown) {
    next(error);
  }
};

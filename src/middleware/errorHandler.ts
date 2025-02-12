import { NextFunction, Request, Response } from "express";
import ApiError from "../shared/errors/api-error.js";
import "dotenv/config";
import { sendErrorToTelegramChat } from "../bot/index.js";

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ApiError) {
    res.status(error.status).json(error.message);
  } else {
    const userId = req["user"]?.id || "No user";
    console.log(error);
    sendErrorToTelegramChat(userId, req, error);
    res.status(500).json("Internal server error");
  }

  next();
};

import { Request, Response, NextFunction } from "express";
import { validate, parse } from "@telegram-apps/init-data-node";
import { validateNum } from "../shared/utils/validate.js";
import ApiError from "../shared/errors/api-error.js";
import "dotenv/config";

export const initDataSym = Symbol("initData");
export const userSym = Symbol("user");

export const telegramAuthValidate = (req: Request, res: Response, next: NextFunction) => {
  console.log("AUTH");
  const apiKey = process.env.BOT_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key is not set" });
  }

  const tonConnectAuth = req.get("X-Telegram-InitData");
  if (!tonConnectAuth) {
    return res.status(401).json({ error: "Unauthorized:X-Telegram-InitData" });
  }
  try {
    if (process.env.NODE_ENV === "production") {
      validate(tonConnectAuth, apiKey, { expiresIn: 86400 * 365 * 100 });
    }
    const initData = parse(tonConnectAuth);
    req["initData"] = initData;
    validateNum(initData.user.id);
    req["user"] = initData.user;

    next();
  } catch (error: unknown) {
    console.log(error);
    if (error instanceof Error) {
      return res.status(400).json({
        error: "Invalid X-Telegram-InitData header",
      });
    }
    if (error instanceof ApiError) {
      return res.status(400).json({
        error: "Invalid User Id",
      });
    }
    console.error("Error in Auth", error);
  }
};

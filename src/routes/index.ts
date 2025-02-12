import { Router } from "express";
import usersRouter from "./users.js";
import txRouter from "./transactions.js";
import tonRouter from "./ton.js";
import botRouter from "./bot/bot.js";

import { limiterGlobal } from "../middleware/rate-limiters.js";
import { telegramAuthValidate } from "../auth/telegramAuthValidate.js";
import usersController from "../controllers/users.js";
import pairsRouter from "./pairs.js";

const router = Router();

const apiVersion = "/api/v1";
router.use(limiterGlobal);

router.use(telegramAuthValidate);
router.use(`${apiVersion}/users`, usersRouter);
// router.use(`${apiVersion}/transactions`, txRouter);
// router.use(`${apiVersion}/ton`, tonRouter);
router.use(`${apiVersion}/pairs`, pairsRouter);
// ADMIN
router.use(`${apiVersion}/admin_4455_bot`, botRouter);

router.use("*", (_, res) => {
  res.status(404).json("Endpoint not found");
});

export default router;

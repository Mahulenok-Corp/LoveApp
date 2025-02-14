import { Router } from "express";
import usersRouter from "./users.js";
import txRouter from "./transactions.js";
import tonRouter from "./ton.js";

import { limiterGlobal } from "../middleware/rate-limiters.js";
import { telegramAuthValidate } from "../auth/telegramAuthValidate.js";
import pairsRouter from "./pairs.js";

const router = Router();

router.use(limiterGlobal);

router.use(telegramAuthValidate);
router.use(`/users`, usersRouter);
router.use(`/transactions`, txRouter);
router.use(`/pairs`, pairsRouter);
router.use(`/wallet`, tonRouter);

router.use("*", (_, res) => {
  res.status(404).json("Endpoint not found");
});

export default router;

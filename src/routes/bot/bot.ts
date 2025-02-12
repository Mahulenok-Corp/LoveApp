import { Router } from "express";
import { botController } from "../../controllers/bot.js";
import { isAdmin } from "../../middleware/isAdmin.js";
import { validateData } from "../../middleware/validation.js";
import { SendMessageSchema } from "../../zod/schemas/bot/mass-send-msg.js";

const router = Router();

router.use(isAdmin);
router.post(`/mass_send`, validateData(SendMessageSchema), botController.massSend);

export default router;

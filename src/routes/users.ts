import { Router } from "express";
import usersController from "../controllers/users.js";
import pairsController from "../controllers/pairsController.js";
import { validateData } from "../middleware/validation.js";
import { z } from "zod";

const AcceptInviteSchema = z.object({
  inviteCode: z.string().min(1, "Invite code cannot be empty"),
});

const router = Router();
router.get(`/`, usersController.get);
router.post(`/`, usersController.create);
router.post(`/refcode`, usersController.update_refcode);
// router.post("/divorce", pairsController.divorce);

export default router;

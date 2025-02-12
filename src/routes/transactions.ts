import { Router } from "express";
import { txController } from "../controllers/transactions.js";

const router = Router();

router.post(`/tx`, txController.getTx);
export default router;

import { Router } from "express";
import { tonController } from "../controllers/ton.js";
const router = Router();

router.post(`/payload`, tonController.payload);
router.post(`/verify`, tonController.verify);

export default router;

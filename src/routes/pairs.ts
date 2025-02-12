import { Router } from "express";
import pairsController from "../controllers/pairsController.js";
import { validateData } from "../middleware/validation.js";
import { z } from "zod";

const pairsRouter = Router();


pairsRouter.post("/divorce", pairsController.divorce);

export default pairsRouter;

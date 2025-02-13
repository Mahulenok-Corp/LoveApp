import { Router } from "express";
import pairsController from "../controllers/pairsController.js";
const pairsRouter = Router();

pairsRouter.post("/divorce", pairsController.divorce);

export default pairsRouter;

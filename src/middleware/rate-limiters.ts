import { rateLimit } from "express-rate-limit";

// User cant send more than 30 rps
export const limiterGlobal = rateLimit({
  windowMs: 1 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

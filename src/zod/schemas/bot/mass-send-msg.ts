import { z } from "zod";

export const SendMessageSchema = z.object({
  postId: z.string().min(1, "Post ID cannot be empty"),

  message: z.string().min(1, "Message cannot be empty").max(4096, "Message cannot exceed Telegram's limit of 4096 characters"),

  userLimit: z.number().int().min(1, "User limit must be at least 1").max(100000, "User limit cannot exceed 100,000 for safety"),
  minCigAmonut: z.number().int().min(0, "minCigAmonut must be at least 1").max(1_000_000_000, "User limit cannot exceed 1b for safety"),

  chunkSize: z
    .number()
    .int()
    .min(1, "Chunk size must be at least 1")
    .max(100, "Chunk size cannot exceed 100 for rate limiting")
    .default(30),

  delayBetweenChunks: z.number().int().min(500, "Delay must be at least 500ms").max(5000, "Delay cannot exceed 5000ms").default(1000),
});

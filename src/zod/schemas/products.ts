import { z } from "zod";

export const buyProductUSDSchema = z.object({
  product_id: z
    .string({
      required_error: "product_id is required",
      invalid_type_error: "product_id must be a string",
    })
    .length(36, "product_id must be 36 characters long")
    .uuid("product_id must be a valid UUID"),

  amount: z
    .number({
      required_error: "amount is required",
      invalid_type_error: "amount must be a number",
    })
    .positive("amount must be positive"),
});

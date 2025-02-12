import { z } from "zod";

const positiveIntOrZero = z.number().int().nonnegative();
const levelRequirement = z.number().int().min(1, { message: "'requiredLvl' must be at least 1." });

export const createLootboxSchema = z.object({
  name: z.string().min(1, { message: "'name' is required and must be a non-empty string." }),
  description: z.string().min(1, { message: "'description' is required and must be a non-empty string." }),
  image: z.string().min(1, { message: "'image' is required and must be a non-empty string." }),
  price: z.object({
    cigarettesCount: positiveIntOrZero,
    teaCount: positiveIntOrZero,
  }),
  show_in_market: z.boolean({ message: "'show_in_market' is required and must be boolean" }),
  transferrable: z.boolean({ message: "'transferrable' is required and must be boolean" }),
  can_sell_on_p2p: z.boolean({ message: "'can_sell_on_p2p' is required and must be boolean" }),
  requiredLvl: levelRequirement,
  awards: z
    .array(
      z
        .object({
          chance: z.number({ invalid_type_error: "'chance' must be a number." }),
          cigarettesAward: z
            .object({
              min: positiveIntOrZero,
              max: positiveIntOrZero,
            })
            .refine((data) => data.min <= data.max, { message: "Invalid 'cigarettesAward' range." })
            .optional(),
          teaAward: z
            .object({
              min: positiveIntOrZero,
              max: positiveIntOrZero,
            })
            .refine((data) => data.min <= data.max, { message: "Invalid 'teaAward' range." })
            .optional(),
          xpAward: z
            .object({
              min: positiveIntOrZero,
              max: positiveIntOrZero,
            })
            .refine((data) => data.min <= data.max, { message: "Invalid 'xpAward' range." })
            .optional(),
          itemAward: z
            .object({
              params: z.object({
                itemQty: z
                  .object({
                    min: positiveIntOrZero,
                    max: positiveIntOrZero,
                  })
                  .refine((data) => data.min <= data.max, { message: "Invalid 'itemQty' range." }),
                itemId: z.string(),
                itemImg: z.string().optional(),
                itemName: z.string().optional(),
              }),
            })
            .optional(),
          oneOfItemReward: z
            .array(
              z.object({
                params: z.object({
                  itemId: z.string(),
                  itemImg: z.string().optional(),
                  itemName: z.string().optional(),
                  itemQty: z
                    .object({
                      min: positiveIntOrZero,
                      max: positiveIntOrZero,
                    })
                    .refine((data) => data.min <= data.max, { message: "Invalid 'itemQty' range." }),
                }),
              })
            )
            .optional(),
        })
        .strict()
    )
    .min(1, { message: "'awards' must be a non-empty array." }),
});

import zod from "zod";

export const CheckProofRequest = zod.object({
  address: zod.string(),
  network: zod.enum(["-239", "-3"]),
  public_key: zod.string(),
  proof: zod.object({
    timestamp: zod.number(),
    domain: zod.object({
      lengthBytes: zod.number(),
      value: zod.string(),
    }),
    payload: zod.string(),
    signature: zod.string(),
    state_init: zod.string({ required_error: "state_init is required" }),
  }),
});

export type CheckProofRequestDto = zod.infer<typeof CheckProofRequest>;

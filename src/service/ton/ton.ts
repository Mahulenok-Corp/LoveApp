import "dotenv/config";
import { CheckProofRequest } from "../../zod/schemas/ton.js";
import { TonApiService } from "./ton-api-service.js";
import { TonProofService } from "./ton-proof-service.js";
import ApiError from "../../shared/errors/api-error.js";
import { createAuthToken, createPayloadToken, verifyToken } from "./utils.js";
import { logger } from "../../shared/logger/logger.js";
import { Users } from "../../database/entities/Users.js";
import { TransactionManager } from "../../database/utils/TransactionManager.js";

export const tonService = {
  async generatePayload(): Promise<{ payload: string; ttl?: number }> {
    try {
      const service = new TonProofService();

      const payload = service.generatePayload();
      const payloadToken = await createPayloadToken({ payload: payload });

      return { payload: payloadToken };
    } catch (err) {
      logger.error({ message: "Erron generatePayload", err });
      throw err;
    }
  },

  // async generatePayload(): Promise<{ payload: string; ttl?: number }> {
  //   // 8 bytes random, 8 bytes timestamp, 32 bytes signature
  //   const payload = Buffer.alloc(8 + 8 + 32);

  //   const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
  //   const timestampPayload = Buffer.alloc(8);
  //   timestampPayload.writeBigInt64BE(currentTimestamp, 0);

  //   const randomBytes = await tonCrypto.getSecureRandomBytes(8);
  //   const rawPayload = Buffer.concat([randomBytes, timestampPayload]);

  //   const hmac = crypto.createHmac("sha256", process.env.SECRET_AUTH_KEY);
  //   const signature = hmac.update(rawPayload).digest();

  //   randomBytes.copy(payload, 0);
  //   timestampPayload.copy(payload, 8);
  //   signature.copy(payload, 16);

  //   return {
  //     payload: payload.toString("hex"),
  //     // ttl: MAX_PROOF_AGE,
  //   };
  // },

  checkProof: async (user_id: string, ton_proof) => {
    try {
      const body = CheckProofRequest.parse(ton_proof);
      const client = TonApiService.create(body.network);
      const service = new TonProofService();

      // console.log(body);
      const isValid = await service.checkProof(body, (address) => client.getWalletPublicKey(address));
      if (!isValid) {
        throw new ApiError(403, "Invalid proof");
      }

      const payloadToken = body.proof.payload;
      if (!(await verifyToken(payloadToken))) {
        throw new ApiError(403, "Invalid token");
      }

      const token = await createAuthToken({ address: body.address, network: body.network });

      return TransactionManager.executeTransaction(async (manager) => {
        let user = await manager.findOne(Users, {
          where: { id: user_id },
        });

        if (!user) {
          throw new ApiError(404, "User not found.");
        }

        let prevWalletOwners = await manager.find(Users, {
          where: { wallet: body.address },
        });

        for (const i of prevWalletOwners) {
          i.wallet = null;
          await manager.save(i);
        }

        user.wallet = body.address || undefined;
        console.log(body.address);
        console.log(user.wallet);
        await manager.save(user);

        return token;
      }).catch((error) => {
        logger.error({ message: "Error in checkProof:tx", err: error });
        throw error;
      });
    } catch (err) {
      logger.error({ message: "Erron checkProof", err });
      throw err;
    }
  },
};

import { txRepository } from "../database/repositories/index.js";
import { logger } from "../shared/logger/logger.js";

export const txService = {
  getTx: async (user_id: string, uuid: string) => {
    try {
      const tx = await txRepository.findOne({ where: { user_id, payload: uuid } });
      return tx;
    } catch (error) {
      logger.error({ message: "Error fetching activities:", err: error });
      throw error;
    }
  },
};

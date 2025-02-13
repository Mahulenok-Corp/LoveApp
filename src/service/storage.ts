import { Storage } from "../database/entities/Payment/Storage.js";
import { storageRepository } from "../database/repositories/Storage.js";
import { logger } from "../shared/logger/logger.js";
const storageService = {
  getBackrunnerStartTimestamp: async (accountHex: string) => {
    try {
      let storageRecord = await storageRepository.findOne({
        select: {
          startTimestamp: true,
        },
        where: { accountHex },
      });

      if (!storageRecord) {
        const newStorage = new Storage();
        newStorage.accountHex = accountHex;
        await storageRepository.save(newStorage);

        storageRecord = await storageRepository.findOne({
          select: {
            startTimestamp: true,
          },
          where: { accountHex },
        });
      }

      const storage = storageRecord!;
      return { previousStartTimestamp: storage.startTimestamp };
    } catch (error) {
      logger.error(`Error getting event listener params: ${error}`);
      throw error;
    }
  },

  updateEventTimestamps: async (accountHex: string, newStartTimestamp: number) => {
    try {
      if (newStartTimestamp === 0) return;

      const data = await storageRepository.findOne({ where: { accountHex } });
      data.startTimestamp = newStartTimestamp;
      await storageRepository.save(data);
    } catch (error) {
      logger.error(`Error getting config: ${error}`);
      throw error;
    }
  },
};

export default storageService;

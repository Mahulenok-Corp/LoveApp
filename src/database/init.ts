import { logger } from "../shared/logger/logger.js";
import { Storage } from "./entities/Payment/Storage.js";
import { storageRepository } from "./repositories/Storage.js";
import "dotenv/config";

export const initDefaultStorage = async () => {
  try {
    const defaultStorage = await storageRepository.findOne({
      where: {
        accountHex: process.env.ACCOUNT_HEX,
      },
    });

    if (!defaultStorage) {
      const newStorage = new Storage();
      await storageRepository.save(newStorage);

      logger.info("Default storage initialized");
    }

    return true;
  } catch (err) {
    logger.error({ message: "Error initializing default storage:", err });
    return false;
  }
};

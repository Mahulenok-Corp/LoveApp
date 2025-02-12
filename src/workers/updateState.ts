import { PostgresDataSource } from "../database/db.js";
import { State } from "../database/entities/Data/State.js";
import { logger } from "../shared/logger/logger.js";

const updateGlobalDay = async () => {
  logger.info("Update time");
  try {
    const globalState = await PostgresDataSource.getRepository(State).findOne({
      order: { createdAt: "DESC" },
    });

    if (!globalState) {
      logger.error("Global state not initialized");
      return;
    }

    const now = new Date();
    const lastUpdate = new Date(globalState.lastUpdate);

    if (now.getUTCDate() !== lastUpdate.getUTCDate()) {
      const newState = new State();
      newState.currentDay = globalState.currentDay + 1;
      if (newState.currentDay > 28) {
        newState.currentDay = 1;
      }
      newState.lastUpdate = now;

      await PostgresDataSource.getRepository(State).save(newState);

      logger.info(`Global day updated to ${newState.currentDay}`);
    }
  } catch (err) {
    logger.error({ message: "Error in checkAndUpdateDay", err });
  }
};

export const startUpdateGlobalDayWorker = () => {
  updateGlobalDay();

  setInterval(updateGlobalDay, 3000);
};

import "dotenv/config";
import "reflect-metadata";
import cors from "cors";
import nocache from "nocache";
import express, { RequestHandler } from "express";
import helmet from "helmet";
import { PostgresDataSource } from "./database/db.js";
import router from "./routes/index.js";
import { logger } from "./shared/logger/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import compression from "compression";
import { startBot } from "./bot/index.js";
import { TransactionManager } from "./database/utils/TransactionManager.js";
import morgan from "morgan";
import { initDefaultStorage } from "./database/init.js";
import { startPaymentService } from "./payment-service/index.js";

async function main() {
  logger.info("Backend service started");
  const shutdown = async () => {
    await PostgresDataSource.destroy();
    logger.fatal("Destroying server...");
    process.exit(0);
  };
  try {
    await PostgresDataSource.initialize();
    await initDefaultStorage();
    await startPaymentService();

    if (process.env.RUN_BOT === "true") {
      startBot();
    }

    new TransactionManager(PostgresDataSource);

    const app = express();
    const port = process.env.PORT || 3000;

    app.use(helmet());

    const telegramHeaderFormat =
      ':remote-addr - [:date[clf]] ":method :url :body HTTP/:http-version" :status :res[content-length] - :response-time ms :telegram-data';

    morgan.token("body", (req: any) => {
      return JSON.stringify(req.body || "");
    });

    morgan.token("telegram-data", (req) => {
      const initData = req["user"]?.id;
      return initData ? `User ${initData}` : "No user";
    });

    app.use(compression({ threshold: 0 }) as unknown as express.RequestHandler);

    app.enable("trust proxy");
    app.disable("x-powered-by");
    app.use(cors());
    app.use(nocache());
    app.use(express.json());

    app.use(
      morgan(telegramHeaderFormat, {
        skip: (req) => req.url.includes("/health"), // Skip health check endpoints
      })
    );

    app.use(router);

    app.use(errorHandler);

    app.listen(port, () => {
      logger.info(`Server is running at http://localhost:${port}`);
    });

    process.once("SIGINT", async () => await shutdown());
    process.once("SIGTERM", async () => await shutdown());
  } catch (err) {
    logger.error({ message: "Critical Error", err });
  }
}

main().catch((err) => console.error(err));

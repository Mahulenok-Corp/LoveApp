import { fileURLToPath } from "node:url";
import path, { dirname } from "node:path";
import { DataSource } from "typeorm";
import "dotenv/config";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions.js";

export const IDLE_TIMEOUT_MS = 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// npx typeorm-ts-node-esm migration:generate -d src/database/db.ts src/database/migrations/Names
// npx typeorm-ts-node-esm migration:run -d src/database/db.ts
export const PostgresDataSource = new DataSource({
  type: "postgres",
  host: process.env.PG_HOST,
  port: +process.env.PG_PORT,
  username: process.env.PG_USER,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  synchronize: process.env.NODE_ENV == "production" ? true : true, //todo
  logging: false, //todo
  logNotifications: false,
  applicationName: "ton_prison",
  entities: [path.join(__dirname, "entities", "**", "*.{ts,js}")],
  migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
  // cache: { duration: 30000 },
  poolSize: 100,
  connectTimeoutMS: 3000,
  ssl:
    process.env.PG_SSL == "true"
      ? {
          rejectUnauthorized: false,
        }
      : false,
} as PostgresConnectionOptions);

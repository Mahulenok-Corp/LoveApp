import { PostgresDataSource } from "../db.js";
import { Storage } from "../entities/Payment/Storage.js";

export const storageRepository = PostgresDataSource.getRepository(Storage);

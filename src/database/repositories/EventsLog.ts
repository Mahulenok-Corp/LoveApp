import { PostgresDataSource } from "../db.js";
import { EventsLog } from "../entities/Payment/EventsLog.js";

export const eventsRepository = PostgresDataSource.getRepository(EventsLog);

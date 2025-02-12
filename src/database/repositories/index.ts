import { PostgresDataSource } from "../db.js";
import { Users } from "../entities/Users.js";
import { Referrals } from "../entities/Referrals.js";
import { Currency } from "../entities/Data/Currency.js";
import { Transactions } from "../entities/Payment/Transactions.js";

export const usersRepository = PostgresDataSource.getRepository(Users);
export const referralsRepository = PostgresDataSource.getRepository(Referrals);

export const currencyRepository = PostgresDataSource.getRepository(Currency);
export const txRepository = PostgresDataSource.getRepository(Transactions);

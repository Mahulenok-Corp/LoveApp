import { PostgresDataSource } from "../db.js";

export async function getQueryRunner() {
  const queryRunner = PostgresDataSource.createQueryRunner();
  return queryRunner;
}

export async function getQueryRunnerConnected() {
  const queryRunner = PostgresDataSource.createQueryRunner();
  await queryRunner.connect();
  return queryRunner;
}

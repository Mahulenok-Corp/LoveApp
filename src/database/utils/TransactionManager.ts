import { DataSource, EntityManager } from "typeorm";
import { IsolationLevel } from "typeorm/driver/types/IsolationLevel.js";
import ApiError from "../../shared/errors/api-error.js";
import { logger } from "../../shared/logger/logger.js";
import { IDLE_TIMEOUT_MS, PostgresDataSource } from "../db.js";

interface TransactionOptions {
  dataSource?: DataSource;
  isolation?: IsolationLevel;
  retries?: number;
  timeout?: number;
  delay?: number;
}

export class TransactionManager {
  private cleanupInterval: NodeJS.Timeout;
  private isDisposed = false;
  private static activeTransactions = new Set<string>();

  constructor(
    private readonly dataSource: DataSource,
    private readonly cleanupIntervalMs: number = 3000,
    private readonly idleTimeoutSeconds: number = IDLE_TIMEOUT_MS / 1000
  ) {
    if (!dataSource.isInitialized) {
      throw new Error("DataSource must be initialized before creating TransactionManager");
    }
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    if (this.isDisposed) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      if (!this.isDisposed) {
        this.cleanup().catch((err) => logger.error({ message: "Cleanup interval failed:", err }));
      }
    }, this.cleanupIntervalMs);

    this.cleanupInterval.unref();
  }

  private async cleanup(): Promise<void> {
    if (!this.dataSource.isInitialized || this.isDisposed) {
      return;
    }

    try {
      const result = await this.dataSource.query(`
        SELECT pid, state, state_change
        FROM pg_stat_activity
        WHERE state in ('idle in transaction', 'idle in transaction (aborted)')
        AND state_change < NOW() - INTERVAL '${this.idleTimeoutSeconds} seconds'
        AND pid NOT IN (SELECT pid FROM pg_locks WHERE granted = false)
      `);

      for (const row of result) {
        if (!TransactionManager.activeTransactions.has(row.pid.toString())) {
          await this.dataSource.query("SELECT pg_terminate_backend($1)", [row.pid]);
        }
      }
    } catch (error) {
      logger.error({ message: "Cleanup error:", err: error });
    }
  }

  static async executeTransaction<T>(operation: (manager: EntityManager) => Promise<T>, options: TransactionOptions = {}): Promise<T> {
    const { dataSource = PostgresDataSource, isolation = "SERIALIZABLE", retries = 3, delay = 800 } = options;

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        let transactionId: string;

        const result = await dataSource.transaction(isolation, async (manager) => {
          const [{ pid }] = await manager.query("SELECT pg_backend_pid() as pid");
          transactionId = pid.toString();
          TransactionManager.activeTransactions.add(transactionId);

          try {
            return await operation(manager);
          } finally {
            TransactionManager.activeTransactions.delete(transactionId);
          }
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof ApiError || attempt === retries || (error?.message && !error.message.includes("could not serialize access"))) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  isActive(): boolean {
    return !this.isDisposed && this.dataSource.isInitialized;
  }
}

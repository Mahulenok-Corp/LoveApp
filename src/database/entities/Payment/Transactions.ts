import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, Check, UpdateDateColumn, CreateDateColumn } from "typeorm";

@Entity()
export class Transactions {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  user_id: string;

  @Column({ type: "jsonb", nullable: true, select: false })
  data: Record<string, any>;

  @Column({ type: "varchar" })
  currency: "ton" | "XTR";

  @Column({ type: "varchar" })
  currency_amount: string;

  @Column({ type: "boolean" })
  isMarket: boolean;

  @Column({ type: "varchar" })
  product: "task_skip";

  @Column({ type: "varchar", nullable: true })
  product_id: string;

  @Column({ type: "float" })
  product_amount: number;

  @Column({ type: "varchar", unique: true })
  payload: string;

  @Column({ type: "varchar", unique: true, nullable: true })
  stars_invoice_id: string;

  @Column({ type: "varchar", unique: true, nullable: true })
  telegram_payment_charge_id: string;

  @Column({ type: "varchar" })
  status: "created" | "fulfilled" | "pre_checkout_answered" | "error" | "error_ton" | "error_sp" | "canceled" | "processing";

  @Column({ type: "varchar", nullable: true })
  error_log: string;

  @Column({ type: "jsonb", nullable: true })
  ctx: Object;

  @Column({ type: "boolean", nullable: true })
  refunded: boolean;

  @Column({ type: "varchar", nullable: true, unique: true })
  invoice_link: string;

  @Column({ type: "varchar", nullable: true, unique: true })
  blockchain_event: string;

  @Column({ type: "varchar", nullable: true })
  ton_destination: string;

  @UpdateDateColumn({ type: "timestamptz" })
  lastUpdate: Date;

  @CreateDateColumn({ type: "timestamptz" })
  creationDate: Date;
}

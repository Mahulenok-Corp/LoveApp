import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, Check, UpdateDateColumn, CreateDateColumn } from "typeorm";

@Entity()
export class Transactions {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  user_id: string;

  @Column({ type: "varchar" })
  currency_amount: string;

  @Column({ type: "varchar", unique: true })
  payload: string;

  @Column({ type: "varchar" })
  status: "created" | "fulfilled" | "pre_checkout_answered" | "error" | "error_ton" | "error_sp" | "canceled" | "processing";

  @Column({ type: "varchar", nullable: true })
  error_log: string;

  @Column({ type: "jsonb", nullable: true })
  ctx: Object;

  @Column({ type: "varchar", nullable: true, unique: true })
  blockchain_event: string;

  @Column({ type: "varchar", nullable: true })
  ton_destination: string;

  @UpdateDateColumn({ type: "timestamptz" })
  lastUpdate: Date;

  @CreateDateColumn({ type: "timestamptz" })
  creationDate: Date;
}

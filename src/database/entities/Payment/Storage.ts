import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from "typeorm";
import "dotenv/config";

@Entity()
export class Storage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "varchar",
    nullable: false,
    unique: true,
    default: process.env.ACCOUNT_HEX,
  })
  accountHex: string;

  @Column({ type: "integer", default: 1732385802 })
  startTimestamp: number;

  @UpdateDateColumn({ default: new Date(0) })
  last_scheduler_run: Date;
}

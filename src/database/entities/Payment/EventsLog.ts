import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class EventsLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", nullable: false, unique: false })
  accountHex: string;

  @Column({ type: "varchar", unique: true, nullable: false })
  event_id: string;

  @Column({ type: "varchar", unique: true, nullable: false })
  tx_hash: string;

  @Column({ type: "varchar", unique: false, nullable: true })
  sender: string;

  @Column({ type: "varchar", unique: false, nullable: true })
  destination: string;

  @Column({ type: "varchar", unique: false, nullable: false })
  type: string;

  @Column({ type: "varchar", unique: false, nullable: true })
  amount: string;

  @Column({ type: "varchar", unique: false, nullable: true })
  amount_pretty: string;

  @Column({ type: "varchar", unique: false, nullable: true })
  nft_collection: string;

  // Уникальный, тк нфт можно сжечь только один раз
  @Column({ type: "varchar", unique: true, nullable: true })
  nft_item: string;

  @Column({ type: "varchar", unique: false, nullable: true })
  nft_data: string;

  @Column({ type: "varchar", unique: true, nullable: true })
  payload: string;

  @Column({ type: "varchar", unique: false, nullable: false })
  status: string;

  @Column({ type: "varchar", unique: false, nullable: false })
  caught_by: string;

  // @Column({ type: "timestamptz", nullable: false })
  // tx_date: Date;

  @CreateDateColumn()
  creation_date: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Relation } from "typeorm";
import { Users } from "./Users.js";

@Entity()
export class Pairs {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  partner_referree: string;

  @Column({ type: "varchar", nullable: true })
  partner_referral: string;

  @CreateDateColumn({ type: "timestamptz" })
  marriage_date: Date;

  @Column({ type: "boolean", default: false })
  is_divorced: boolean;

  @Column({ type: "timestamptz", nullable: true })
  divorce_date: Date;

  @ManyToOne(() => Users, (user) => user.id)
  referree: Relation<Users>;

  @ManyToOne(() => Users, (user) => user.id)
  referral: Relation<Users>;
}

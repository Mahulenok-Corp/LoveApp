import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, Relation, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users.js";

@Entity()
@Unique(["referral"])
export class Referrals {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn({ type: "timestamptz" })
  creation_date: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  update_date: Date;

  @Column({ type: "varchar" })
  referree: string;

  @ManyToOne(() => Users, (user) => user.id, { eager: true, onDelete: "CASCADE" })
  referral: Relation<Users>;
}

// СОХРАНЯТЬ ВСЮ ИНФОРМАЦИЮ ЗДЕСЬ, ВООЬЩЕ НЕ ЮЗАТЬ РЕЛЕЙШНЫ
// ВЫБИРАТЬ КАК МОЖНО МЕНЬШЕ И РЕЖЕ

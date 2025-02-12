import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm";
@Entity()
export class Users {
  /** Basic Information */
  @PrimaryColumn({ type: "varchar" })
  id: string;

  @Column({ type: "varchar", default: null, nullable: true, length: 1000 })
  username: string;

  @Column({ type: "varchar", default: "", nullable: true, length: 1000 })
  name: string;

  @Column({ type: "varchar", default: "", nullable: true })
  avatar: string;

  @Column({ type: "varchar", default: "", nullable: true })
  wallet: string;

  @Column({ type: "varchar", default: "", nullable: true, length: 20 })
  language_code: string;

  @CreateDateColumn({ type: "timestamp", select: false })
  creation_date: Date;

  /**  Points */
  @Column({ type: "int", default: 0, nullable: false })
  points: number;

  /** Ref */
  @Column({ type: "varchar", default: "", unique: true, nullable: false, length: 30 })
  ref_code: string;
}

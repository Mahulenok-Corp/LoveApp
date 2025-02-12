import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, Check } from "typeorm";

@Entity()
export class Currency {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "float", nullable: true })
  dollar: number;

  @Column({ type: "float", nullable: true })
  ton: number;

  @Column({ type: "float", nullable: true })
  stars: number;

  @Column("timestamptz", { default: () => "CURRENT_TIMESTAMP" })
  lastUpdate: Date;
}

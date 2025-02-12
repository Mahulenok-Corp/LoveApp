import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class State {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "int" })
  currentDay: number;

  @Column({ type: "int", default: 0 })
  dialogs_offset: number;

  @Column({ type: "timestamptz" })
  lastUpdate: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}

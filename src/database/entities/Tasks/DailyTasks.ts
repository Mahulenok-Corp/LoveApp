import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class DailyTasks {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  type: "visit" | "subscribe" | "custom";

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", length: 255 })
  description: string;

  @Column({ type: "int" })
  required_lvl: number;

  @Column({ type: "jsonb", nullable: true })
  data: {
    url?: string;
    channel_id?: string;
    api_url?: string;
    method?: string;
    [key: string]: any;
  };

  @Column({ type: "int" })
  reward: number;

  @Column({ type: "int" })
  goal: number;
}

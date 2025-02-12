import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("message_deliveries")
export class MessageDelivery {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  user_id: string;

  @Column({ type: "varchar" })
  post_id: string;

  @Column({ type: "boolean", default: false })
  delivered: boolean;

  @CreateDateColumn({ nullable: true })
  delivered_at?: Date;

  @Column({ type: "text", nullable: true })
  error_message?: string;
}

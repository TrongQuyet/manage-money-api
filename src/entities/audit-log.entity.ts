import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ length: 100, nullable: true })
  userName: string;

  @Column({ length: 10 })
  action: string;

  @Column({ name: 'table_name', length: 50 })
  tableName: string;

  @Column({ name: 'record_id' })
  recordId: number;

  @Column({ name: 'old_values', type: 'json', nullable: true })
  oldValues: Record<string, unknown>;

  @Column({ name: 'new_values', type: 'json', nullable: true })
  newValues: Record<string, unknown>;

  @Column({ name: 'org_id', nullable: true })
  orgId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

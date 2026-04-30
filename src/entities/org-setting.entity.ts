import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('org_settings')
@Unique(['organizationId', 'key'])
export class OrgSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  key: string;

  @Column({ type: 'longtext', nullable: true })
  value: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

export enum OrgUserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('organization_users')
export class OrganizationUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: OrgUserRole, default: OrgUserRole.MEMBER })
  role: OrgUserRole;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Organization, (o) => o.organizationUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @ManyToOne(() => User, (u) => u.organizationUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;
}

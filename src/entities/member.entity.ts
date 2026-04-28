import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Transaction } from './transaction.entity';

export enum MemberRole {
  ADMIN = 'Admin',
  TREASURER = 'Thủ quỹ',
  MEMBER = 'Thành viên',
  OBSERVER = 'Quan sát viên',
}

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'user_id', nullable: true, length: 36 })
  userId: string | null;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Organization, (o) => o.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @OneToMany(() => Transaction, (t) => t.member)
  transactions: Transaction[];
}

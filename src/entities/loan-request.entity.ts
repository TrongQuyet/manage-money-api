import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Member } from './member.entity';

export enum LoanRequestStatus {
  PENDING_ADMIN = 'PENDING_ADMIN',
  PENDING_VOTES = 'PENDING_VOTES',
  APPROVED = 'APPROVED',
  REJECTED_BY_ADMIN = 'REJECTED_BY_ADMIN',
  REJECTED_BY_VOTE = 'REJECTED_BY_VOTE',
}

@Entity('loan_requests')
export class LoanRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'member_id' })
  memberId: number;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: LoanRequestStatus,
    default: LoanRequestStatus.PENDING_ADMIN,
  })
  status: LoanRequestStatus;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote: string | null;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: number | null;

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

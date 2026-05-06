import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { LoanRequest } from './loan-request.entity';
import { Organization } from './organization.entity';

export enum TransferRequestStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

@Entity('transfer_requests')
export class TransferRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LoanRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loan_request_id' })
  loanRequest: LoanRequest;

  @Column({ name: 'loan_request_id' })
  loanRequestId: number;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransferRequestStatus,
    default: TransferRequestStatus.PENDING,
  })
  status: TransferRequestStatus;

  @Column({ name: 'completed_by', nullable: true })
  completedBy: number | null;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

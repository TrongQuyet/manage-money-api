import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { LoanRequest } from './loan-request.entity';
import { Member } from './member.entity';

@Entity('loan_votes')
@Unique(['loanRequestId', 'memberId'])
export class LoanVote {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LoanRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loan_request_id' })
  loanRequest: LoanRequest;

  @Column({ name: 'loan_request_id' })
  loanRequestId: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'member_id' })
  memberId: number;

  @Column({ type: 'boolean' })
  approve: boolean;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

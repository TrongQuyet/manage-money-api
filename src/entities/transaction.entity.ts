import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Member } from './member.entity';
import { Category } from './category.entity';
import { TransactionType } from './category.entity';

export { TransactionType };

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 100, nullable: true })
  recipient: string;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => Organization, (o) => o.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Member, (m) => m.transactions, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'member_id', nullable: true })
  memberId: string;

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

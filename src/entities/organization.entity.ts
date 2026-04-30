import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrganizationUser } from './organization-user.entity';
import { Member } from './member.entity';
import { Transaction } from './transaction.entity';
import { Category } from './category.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true, nullable: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrganizationUser, (ou) => ou.organization)
  organizationUsers: OrganizationUser[];

  @OneToMany(() => Member, (m) => m.organization)
  members: Member[];

  @OneToMany(() => Transaction, (t) => t.organization)
  transactions: Transaction[];

  @OneToMany(() => Category, (c) => c.organization)
  categories: Category[];
}

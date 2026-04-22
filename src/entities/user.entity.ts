import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrganizationUser } from './organization-user.entity';
import { RefreshToken } from './refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  user_name: string;

  @Column()
  password: string;

  @Column({ length: 100, nullable: true })
  display_name: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => OrganizationUser, (ou) => ou.user)
  organizationUsers: OrganizationUser[];

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refreshTokens: RefreshToken[];
}

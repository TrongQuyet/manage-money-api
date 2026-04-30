import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Member } from '../entities/member.entity';
import { User } from '../entities/user.entity';
import { OrganizationUser, OrgUserRole } from '../entities/organization-user.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateSelfMemberDto } from './dto/update-self-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member) private readonly memberRepo: Repository<Member>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(OrganizationUser) private readonly ouRepo: Repository<OrganizationUser>,
  ) {}

  async findAll(orgId: string): Promise<Member[]> {
    return this.memberRepo.find({
      where: { organizationId: orgId },
      order: { joinedAt: 'ASC' },
    });
  }

  async findOne(orgId: string, id: string): Promise<Member> {
    const member = await this.memberRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async create(orgId: string, dto: CreateMemberDto): Promise<Member> {
    let userId: string | null = null;

    if (dto.email) {
      let user = await this.userRepo.findOne({ where: { user_name: dto.email } });

      if (!user) {
        const hash = await bcrypt.hash('1', 12);
        user = await this.userRepo.save(
          this.userRepo.create({ user_name: dto.email, password: hash, display_name: dto.name }),
        );
      }

      const existing = await this.ouRepo.findOne({
        where: { organizationId: orgId, userId: user.id },
      });
      if (!existing) {
        await this.ouRepo.save(
          this.ouRepo.create({ organizationId: orgId, userId: user.id, role: OrgUserRole.MEMBER }),
        );
      }

      userId = user.id;
    }

    const member = this.memberRepo.create({ ...dto, organizationId: orgId, userId });
    return this.memberRepo.save(member);
  }

  async update(orgId: string, id: string, dto: UpdateMemberDto): Promise<Member> {
    const member = await this.findOne(orgId, id);
    Object.assign(member, dto);
    return this.memberRepo.save(member);
  }

  async remove(orgId: string, id: string): Promise<void> {
    const result = await this.memberRepo.delete({ id, organizationId: orgId });
    if (result.affected === 0) throw new NotFoundException('Member not found');
  }

  async findByUserId(orgId: string, userId: string): Promise<Member | null> {
    return this.memberRepo.findOne({ where: { organizationId: orgId, userId } });
  }

  async updateSelf(orgId: string, userId: string, dto: UpdateSelfMemberDto): Promise<Member> {
    const member = await this.findByUserId(orgId, userId);
    if (!member) throw new NotFoundException('Không tìm thấy thông tin thành viên của bạn');
    Object.assign(member, dto);
    return this.memberRepo.save(member);
  }
}

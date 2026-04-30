import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Organization } from '../entities/organization.entity';
import { OrganizationUser, OrgUserRole } from '../entities/organization-user.entity';
import { User } from '../entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(OrganizationUser) private ouRepo: Repository<OrganizationUser>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  private generateSlug(name: string): string {
    return slugify(name, { lower: true, strict: true, locale: 'vi' });
  }

  async create(dto: CreateOrganizationDto, userId: number): Promise<Organization> {
    const slug = dto.slug ?? this.generateSlug(dto.name);

    const existing = await this.orgRepo.findOne({ where: { slug } });
    if (existing) throw new ConflictException(`Slug '${slug}' đã được sử dụng`);

    const org = this.orgRepo.create({ ...dto, slug });
    const saved = await this.orgRepo.save(org);

    const ou = this.ouRepo.create({
      organizationId: saved.id,
      userId,
      role: OrgUserRole.OWNER,
    });
    await this.ouRepo.save(ou);

    return saved;
  }

  async findMine(userId: number): Promise<Organization[]> {
    const memberships = await this.ouRepo.find({
      where: { userId },
      relations: ['organization'],
    });
    return memberships.map((m) => m.organization);
  }

  async findOne(id: number): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { slug } });
    if (!org) throw new NotFoundException(`Tổ chức '${slug}' không tồn tại`);
    return org;
  }

  async getMembers(orgId: number) {
    return this.ouRepo.find({
      where: { organizationId: orgId },
      relations: ['user'],
    });
  }

  async inviteUser(orgId: number, dto: InviteUserDto) {
    if (dto.role === OrgUserRole.OWNER) {
      throw new BadRequestException('Không thể gán quyền OWNER');
    }

    const user = await this.userRepo.findOne({ where: { user_name: dto.user_name } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.ouRepo.findOne({
      where: { organizationId: orgId, userId: user.id },
    });
    if (existing) throw new ConflictException('User already in organization');

    const ou = this.ouRepo.create({
      organizationId: orgId,
      userId: user.id,
      role: dto.role,
    });
    return this.ouRepo.save(ou);
  }

  async removeUser(orgId: number, userId: number) {
    const ou = await this.ouRepo.findOne({
      where: { organizationId: orgId, userId },
    });
    if (!ou) throw new NotFoundException('User not in organization');
    if (ou.role === OrgUserRole.OWNER) {
      throw new ForbiddenException('Không thể xóa tài khoản OWNER khỏi tổ chức');
    }
    await this.ouRepo.remove(ou);
  }

  async updateUserRole(orgId: number, targetUserId: number, role: OrgUserRole) {
    if (role === OrgUserRole.OWNER) {
      throw new BadRequestException('Không thể gán quyền OWNER');
    }
    const ou = await this.ouRepo.findOne({
      where: { organizationId: orgId, userId: targetUserId },
    });
    if (!ou) throw new NotFoundException('User not in organization');
    if (ou.role === OrgUserRole.OWNER) {
      throw new ForbiddenException('Không thể thay đổi quyền của OWNER');
    }
    ou.role = role;
    return this.ouRepo.save(ou);
  }

  async getMyRole(orgSlug: string, userId: number): Promise<{ role: string | null }> {
    const org = await this.orgRepo.findOne({ where: { slug: orgSlug } });
    if (!org) return { role: null };

    const membership = await this.ouRepo.findOne({
      where: { userId, organizationId: org.id },
    });

    return { role: membership?.role ?? null };
  }
}

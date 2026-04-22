import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationUser } from '../../entities/organization-user.entity';
import { Organization } from '../../entities/organization.entity';

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(
    @InjectRepository(OrganizationUser)
    private readonly orgUserRepo: Repository<OrganizationUser>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string = request.user?.userId;
    const orgSlug: string = request.params?.orgSlug;

    if (!userId || !orgSlug) throw new ForbiddenException();

    const org = await this.orgRepo.findOne({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException(`Tổ chức '${orgSlug}' không tồn tại`);

    const membership = await this.orgUserRepo.findOne({
      where: { userId, organizationId: org.id },
    });

    if (!membership) {
      throw new ForbiddenException('Bạn không thuộc tổ chức này');
    }

    request.orgId = org.id;
    request.orgRole = membership.role;
    return true;
  }
}

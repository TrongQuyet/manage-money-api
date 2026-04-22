import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';

@Injectable()
export class OrgSlugGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const orgSlug: string = request.params?.orgSlug;

    if (!orgSlug) throw new NotFoundException('orgSlug required');

    const org = await this.orgRepo.findOne({ where: { slug: orgSlug } });
    if (!org) throw new NotFoundException(`Tổ chức '${orgSlug}' không tồn tại`);

    request.orgId = org.id;
    return true;
  }
}

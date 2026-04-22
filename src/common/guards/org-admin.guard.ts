import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { OrgUserRole } from '../../entities/organization-user.entity';

@Injectable()
export class OrgAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const role: OrgUserRole = request.orgRole;

    if (role === OrgUserRole.OWNER || role === OrgUserRole.ADMIN) {
      return true;
    }

    throw new ForbiddenException('Only organization admins can perform this action');
  }
}

import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { OrgUserRole } from '../../entities/organization-user.entity';

export class InviteUserDto {
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsEnum(OrgUserRole)
  role: OrgUserRole;
}

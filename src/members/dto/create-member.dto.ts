import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { MemberRole } from '../../entities/member.entity';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(MemberRole)
  @IsOptional()
  role?: MemberRole;

  @IsString()
  @IsOptional()
  note?: string;
}

import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  display_name?: string;

  @IsString()
  @IsNotEmpty()
  registration_secret: string;
}

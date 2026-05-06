import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class VoteLoanRequestDto {
  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

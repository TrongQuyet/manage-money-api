import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AdminReviewDto {
  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

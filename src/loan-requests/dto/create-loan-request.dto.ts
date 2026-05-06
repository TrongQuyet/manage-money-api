import { IsInt, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateLoanRequestDto {
  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @MinLength(10)
  reason: string;
}

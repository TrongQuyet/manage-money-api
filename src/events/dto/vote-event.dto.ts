import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class VoteEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  option: string;
}

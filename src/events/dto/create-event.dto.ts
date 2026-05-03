import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  location?: string;

  @IsString()
  @IsOptional()
  rules?: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

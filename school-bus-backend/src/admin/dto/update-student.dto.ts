import { IsNumber, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  busId?: string | null;

  @IsOptional()
  @IsString()
  parentUserId?: string | null;

  @IsOptional()
  @IsString()
  parentName?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/)
  parentPhone?: string | null;

  @IsOptional()
  @IsString()
  parentEmail?: string | null;

  @IsOptional()
  @IsString()
  studentClass?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  longitude?: number | null;
}

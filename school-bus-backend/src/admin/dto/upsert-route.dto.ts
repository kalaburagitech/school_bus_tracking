import { IsArray, IsOptional, IsString } from 'class-validator';

class RouteStopDto {
  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  lat?: string;

  @IsOptional()
  @IsString()
  lng?: string;
}

export class UpsertRouteDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsArray()
  stops?: RouteStopDto[];
}

import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAsistenciaDto {
  @IsOptional()
  @IsNumber()
  id_alumno?: number;

  @IsOptional()
  @IsNumber()
  id_usuario?: number;

  // El front nos indicará si la persona escaneada es alumno o personal
  @IsString()
  @IsOptional()
  entidad_tipo?: 'alumno' | 'usuario';
}

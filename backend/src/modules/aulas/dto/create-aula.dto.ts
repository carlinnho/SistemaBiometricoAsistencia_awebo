import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateAulaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del aula es obligatorio.' })
  nombre: string;

  @IsString()
  @IsNotEmpty()
  grado: string;

  @IsString()
  @IsNotEmpty()
  seccion: string;

  @IsNumber()
  id_docente: number;
}

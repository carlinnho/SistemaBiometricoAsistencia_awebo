import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Length,
} from 'class-validator';

export class CreateAlumnoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @Length(8, 8, { message: 'El DNI debe tener exactamente 8 caracteres' })
  DNI: string;

  @IsNumber()
  id_aula: number;

  @IsArray()
  @IsNumber({}, { each: true })
  padres_ids: number[]; // IDs de los padres a vincular

  // Validación estricta del descriptor biométrico
  @IsArray()
  @ArrayMinSize(128, { message: 'El descriptor biométrico está incompleto' })
  @ArrayMaxSize(128, { message: 'El descriptor biométrico tiene datos extra' })
  @IsNumber({}, { each: true })
  descriptor: number[];
}

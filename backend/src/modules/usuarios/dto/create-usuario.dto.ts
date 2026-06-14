import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateUsuarioDto {
  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres.' })
  password: string;

  @IsEnum(Role, {
    message: `El rol debe ser uno de: ${Object.values(Role).join(', ')}.`,
  })
  rol: Role;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  // NUEVO: Permite recibir el arreglo matemático del rostro
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  descriptor?: number[];
}

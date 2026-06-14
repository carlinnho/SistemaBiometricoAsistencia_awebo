import { PartialType } from '@nestjs/mapped-types';
import { CreateHorarioUsuarioDto } from './create-horarios-usuario.dto';

export class UpdateHorarioUsuarioDto extends PartialType(
  CreateHorarioUsuarioDto,
) {}

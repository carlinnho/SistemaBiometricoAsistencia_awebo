import { PartialType } from '@nestjs/mapped-types';
import { CreateBiometriaDto } from './create-biometria.dto';

export class UpdateBiometriaDto extends PartialType(CreateBiometriaDto) {}

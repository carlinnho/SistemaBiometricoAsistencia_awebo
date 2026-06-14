import { Injectable } from '@nestjs/common';
import { CreateBiometriaDto } from './dto/create-biometria.dto';
import { UpdateBiometriaDto } from './dto/update-biometria.dto';

@Injectable()
export class BiometriaService {
  create(createBiometriaDto: CreateBiometriaDto) {
    return 'This action adds a new biometria';
  }

  findAll() {
    return `This action returns all biometria`;
  }

  findOne(id: number) {
    return `This action returns a #${id} biometria`;
  }

  update(id: number, updateBiometriaDto: UpdateBiometriaDto) {
    return `This action updates a #${id} biometria`;
  }

  remove(id: number) {
    return `This action removes a #${id} biometria`;
  }
}

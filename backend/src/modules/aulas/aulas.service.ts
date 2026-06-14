import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aula } from './entities/aula.entity';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';

@Injectable()
export class AulasService {
  constructor(
    @InjectRepository(Aula)
    private readonly aulaRepo: Repository<Aula>,
  ) {}

  async create(createAulaDto: CreateAulaDto): Promise<Aula> {
    const aula = this.aulaRepo.create(createAulaDto);
    return await this.aulaRepo.save(aula);
  }

  async findAll(): Promise<Aula[]> {
    return await this.aulaRepo.find({
      relations: {
        docente: true,
        horarios: true,
      },
    });
  }

  async findOne(id_aula: number): Promise<Aula> {
    const aula = await this.aulaRepo.findOne({
      where: { id_aula },
      relations: {
        docente: true,
        horarios: true,
      },
    });
    if (!aula)
      throw new NotFoundException(`Aula con ID ${id_aula} no encontrada.`);
    return aula;
  }

  async update(id_aula: number, updateAulaDto: UpdateAulaDto): Promise<Aula> {
    const aula = await this.findOne(id_aula);
    await this.aulaRepo.save({ ...aula, ...updateAulaDto });
    return this.findOne(id_aula);
  }

  async remove(id_aula: number): Promise<{ message: string }> {
    const aula = await this.findOne(id_aula);
    await this.aulaRepo.remove(aula);
    return { message: `Aula eliminada correctamente.` };
  }
}

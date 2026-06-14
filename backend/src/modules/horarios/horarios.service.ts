import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './entities/horario.entity';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(Horario)
    private readonly horariosRepo: Repository<Horario>,
  ) {}

  private normalizarHora(hora: string): string {
    return hora.length === 5 ? `${hora}:00` : hora;
  }

  async create(dto: CreateHorarioDto): Promise<Horario> {
    const horario = this.horariosRepo.create({
      id_aula: dto.id_aula,
      hora_entrada: this.normalizarHora(dto.hora_entrada),
      Hora_limite_puntual: this.normalizarHora(dto.Hora_limite_puntual),
      hora_salida: this.normalizarHora(dto.hora_salida),
    });
    return this.horariosRepo.save(horario);
  }

  async findAll(): Promise<Horario[]> {
    return this.horariosRepo.find({ relations: { aula: true } });
  }

  async findOne(id_horario: number): Promise<Horario> {
    const horario = await this.horariosRepo.findOne({
      where: { id_horario },
      relations: { aula: true },
    });
    if (!horario)
      throw new NotFoundException(
        `Horario con ID ${id_horario} no encontrado.`,
      );
    return horario;
  }

  async update(id_horario: number, dto: UpdateHorarioDto): Promise<Horario> {
    const horario = await this.findOne(id_horario);

    if (dto.hora_entrada)
      horario.hora_entrada = this.normalizarHora(dto.hora_entrada);
    if (dto.Hora_limite_puntual)
      horario.Hora_limite_puntual = this.normalizarHora(
        dto.Hora_limite_puntual,
      );
    if (dto.hora_salida)
      horario.hora_salida = this.normalizarHora(dto.hora_salida);
    if (dto.id_aula) horario.id_aula = dto.id_aula;

    return this.horariosRepo.save(horario);
  }

  async remove(id_horario: number): Promise<{ message: string }> {
    const horario = await this.findOne(id_horario);
    await this.horariosRepo.remove(horario);
    return { message: `Horario eliminado correctamente.` };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HorarioUsuario } from './entities/horarios-usuario.entity';
import { CreateHorarioUsuarioDto } from './dto/create-horarios-usuario.dto';
import { UpdateHorarioUsuarioDto } from './dto/update-horarios-usuario.dto';

@Injectable()
export class HorariosUsuarioService {
  constructor(
    @InjectRepository(HorarioUsuario)
    private repo: Repository<HorarioUsuario>,
  ) {}

  async create(dto: CreateHorarioUsuarioDto) {
    // Si ya tiene un horario, lo ideal sería actualizarlo o bloquear la creación.
    // Por ahora lo creamos de forma directa.
    const nuevo = this.repo.create(dto);
    return await this.repo.save(nuevo);
  }

  async findAll() {
    // Traemos la relación "usuario" para que el frontend pueda mostrar el nombre
    return await this.repo.find({ relations: { usuario: true } });
  }

  async findOne(id: number) {
    const horario = await this.repo.findOne({
      where: { id_horario_usuario: id },
      relations: { usuario: true },
    });
    if (!horario) throw new NotFoundException('Horario no encontrado');
    return horario;
  }

  async update(id: number, dto: UpdateHorarioUsuarioDto) {
    const horario = await this.findOne(id);
    await this.repo.save({ ...horario, ...dto });
    return this.findOne(id);
  }

  async remove(id: number) {
    const horario = await this.findOne(id);
    await this.repo.remove(horario);
    return { message: 'Horario eliminado correctamente' };
  }
}

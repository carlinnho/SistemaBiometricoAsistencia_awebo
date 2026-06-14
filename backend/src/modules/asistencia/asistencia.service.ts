import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from './entities/asistencia.entity';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { Alumno } from '../alumnos/entities/alumno.entity';
import { Horario } from '../horarios/entities/horario.entity';
import { HorarioUsuario } from '../horarios-usuario/entities/horarios-usuario.entity';

@Injectable()
export class AsistenciaService {
  constructor(
    @InjectRepository(Asistencia) private asisRepo: Repository<Asistencia>,
    @InjectRepository(Alumno) private alumnoRepo: Repository<Alumno>,
    @InjectRepository(Horario) private horarioRepo: Repository<Horario>,
    @InjectRepository(HorarioUsuario)
    private horarioUsuarioRepo: Repository<HorarioUsuario>, // <-- Inyectamos la tabla de docentes
  ) {}

  // Convierte "HH:MM:SS" o "HH:MM" a minutos para comparar fácilmente
  private horaEnMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  async registrarEscaneo(dto: CreateAsistenciaDto) {
    if (!dto.id_alumno && !dto.id_usuario) {
      throw new BadRequestException('Se requiere ID de alumno o de usuario.');
    }

    const now = new Date();
    const peruTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const fechaActual = peruTime.toISOString().split('T')[0];
    const horaActual = peruTime.toISOString().split('T')[1].substring(0, 8);
    const minutosActuales = this.horaEnMinutos(horaActual);

    // ─── 1. BUSCAR HORARIO CORRESPONDIENTE (ALUMNO O DOCENTE) ───
    let minutosHorarioSalida = 0;
    let minutosLimitePuntual = 0;
    let tieneHorario = false;

    if (dto.entidad_tipo === 'alumno' || dto.id_alumno) {
      const alumno = await this.alumnoRepo.findOne({
        where: { id_alumno: dto.id_alumno },
      });
      if (alumno) {
        const horario = await this.horarioRepo.findOne({
          where: { id_aula: alumno.id_aula },
        });
        if (horario) {
          minutosHorarioSalida = this.horaEnMinutos(horario.hora_salida);
          minutosLimitePuntual = this.horaEnMinutos(
            horario.Hora_limite_puntual,
          );
          tieneHorario = true;
        }
      }
    } else if (dto.entidad_tipo === 'usuario' || dto.id_usuario) {
      const horarioU = await this.horarioUsuarioRepo.findOne({
        where: { id_usuario: dto.id_usuario },
      });
      if (horarioU) {
        minutosHorarioSalida = this.horaEnMinutos(horarioU.hora_salida);
        minutosLimitePuntual = this.horaEnMinutos(horarioU.Hora_limite_puntual);
        tieneHorario = true;
      }
    }

    // ─── 2. BUSCAR REGISTRO DE HOY ───
    const registroHoy = await this.asisRepo.findOne({
      where:
        dto.entidad_tipo === 'alumno' || dto.id_alumno
          ? { id_alumno: dto.id_alumno, fecha: fechaActual as any }
          : { id_usuario: dto.id_usuario, fecha: fechaActual as any },
    });

    // ─── 3. YA TIENE ENTRADA HOY ───
    if (registroHoy) {
      // 3a. Si ya tiene salida, lo ignoramos silenciosamente
      if (registroHoy.hora_salida) {
        throw new ConflictException('SILENT_IGNORE');
      }

      // 3b. Validación de la ventana de 5 minutos antes de la salida
      if (tieneHorario) {
        const MARGEN_MINUTOS = 5;
        if (minutosActuales < minutosHorarioSalida - MARGEN_MINUTOS) {
          // Todavía no es hora. Rechazamos silenciosamente.
          throw new ConflictException('SILENT_IGNORE');
        }
      }

      // 3c. Pasó la validación -> Guardar Salida
      registroHoy.hora_salida = horaActual;
      await this.asisRepo.save(registroHoy);
      return {
        message: 'Salida registrada',
        data: registroHoy,
        accion: 'SALIDA',
      };
    }

    // ─── 4. SIN REGISTRO HOY -> ES SU ENTRADA ───
    let estadoCalculado = 'puntual';
    if (tieneHorario && minutosActuales > minutosLimitePuntual) {
      estadoCalculado = 'tardanza';
    }

    const nuevaAsistencia = this.asisRepo.create({
      id_alumno: dto.id_alumno || null,
      id_usuario: dto.id_usuario || null,
      fecha: fechaActual as any,
      hora_entrada: horaActual,
      estado: estadoCalculado,
    });

    const guardado = await this.asisRepo.save(nuevaAsistencia);
    return { message: 'Entrada registrada', data: guardado, accion: 'ENTRADA' };
  }

  findAll() {
    return this.asisRepo.find({
      relations: { alumno: true, usuario: true },
      order: { fecha: 'DESC', hora_entrada: 'DESC' },
    });
  }
}

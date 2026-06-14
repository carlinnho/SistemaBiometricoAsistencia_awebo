import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Alumno } from './entities/alumno.entity';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto';
import { Biometria } from '../biometria/entities/biometria.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

const DUPLICATE_THRESHOLD = 0.55;

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
}

@Injectable()
export class AlumnosService {
  constructor(
    @InjectRepository(Alumno) private readonly alumnoRepo: Repository<Alumno>,
    @InjectRepository(Biometria)
    private readonly biometriaRepo: Repository<Biometria>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async create(dto: CreateAlumnoDto) {
    // 1. Verificar si el DNI ya existe
    const existeDNI = await this.alumnoRepo.findOne({
      where: { DNI: dto.DNI },
    });
    if (existeDNI)
      throw new ConflictException(`El alumno con DNI ${dto.DNI} ya existe.`);

    // 2. ── SEGURIDAD: VALIDACIÓN ANTI-DUPLICADOS BIOMÉTRICOS ──
    const todasBiometrias = await this.biometriaRepo.find({
      relations: { alumno: true },
    });

    for (const bio of todasBiometrias) {
      const existingDescriptor: number[] = JSON.parse(bio.embedding_facial);
      const distance = euclideanDistance(dto.descriptor, existingDescriptor);

      if (distance < DUPLICATE_THRESHOLD) {
        throw new ConflictException(
          `Seguridad: Rostro duplicado. Esta cara ya pertenece al alumno: "${bio.alumno.nombre}".`,
        );
      }
    }

    // 3. Obtener las entidades de los padres seleccionados
    const padres = await this.usuarioRepo.findBy({ id: In(dto.padres_ids) });

    // 4. Guardar al Alumno (con sus relaciones de padres)
    const nuevoAlumno = this.alumnoRepo.create({
      nombre: dto.nombre.trim(),
      DNI: dto.DNI,
      id_aula: dto.id_aula,
      padres: padres, // TypeORM llena la tabla padre_alumno automáticamente
    });
    const alumnoGuardado = await this.alumnoRepo.save(nuevoAlumno);

    // 5. Guardar el Registro Biométrico asociado a este alumno
    const nuevaBiometria = this.biometriaRepo.create({
      id_alumno: alumnoGuardado.id_alumno,
      embedding_facial: JSON.stringify(dto.descriptor),
    });
    await this.biometriaRepo.save(nuevaBiometria);

    return {
      message: 'Alumno registrado exitosamente con biometría.',
      alumno: alumnoGuardado,
    };
  }

  // Endpoint especial para enviar al quiosco frontal (Solo envía ID, nombre y rostro)
  async getAllForScanner() {
    const biometrias = await this.biometriaRepo.find({
      where: { activo: true },
      relations: { alumno: true },
    });

    // Formateamos la respuesta para que el frontend (face-api) la consuma fácil
    return biometrias.map((bio) => ({
      id_alumno: bio.alumno.id_alumno,
      nombre: bio.alumno.nombre,
      descriptor: JSON.parse(bio.embedding_facial),
    }));
  }

  async findAll() {
    return this.alumnoRepo.find({
      relations: {
        aula: true,
        padres: true,
        biometrias: true,
      },
    });
  }

  async findOne(id: number) {
    const alumno = await this.alumnoRepo.findOne({
      where: { id_alumno: id },
      relations: {
        aula: true,
        padres: true,
        biometrias: true,
      },
    });
    if (!alumno) throw new NotFoundException('Alumno no encontrado');
    return alumno;
  }

  async update(id: number, dto: UpdateAlumnoDto) {
    // La actualización se puede expandir según necesidades
    const alumno = await this.findOne(id);
    await this.alumnoRepo.save({ ...alumno, ...dto });
    return this.findOne(id);
  }

  async remove(id: number) {
    const alumno = await this.findOne(id);
    await this.alumnoRepo.remove(alumno);
    return { message: 'Alumno eliminado' };
  }
}

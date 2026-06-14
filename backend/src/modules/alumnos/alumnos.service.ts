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
    const existeDNI = await this.alumnoRepo.findOne({
      where: { DNI: dto.DNI },
    });
    if (existeDNI)
      throw new ConflictException(`El alumno con DNI ${dto.DNI} ya existe.`);

    // ── SEGURIDAD: VALIDACIÓN ANTI-DUPLICADOS BIOMÉTRICOS ──
    const todasBiometrias = await this.biometriaRepo.find({
      relations: { alumno: true },
    });

    for (const bio of todasBiometrias) {
      if (!bio.embedding_facial || !bio.alumno) continue;
      const existingDescriptor: number[] = JSON.parse(bio.embedding_facial);
      const distance = euclideanDistance(dto.descriptor, existingDescriptor);

      if (distance < DUPLICATE_THRESHOLD) {
        throw new ConflictException(
          `Seguridad: Rostro duplicado. Esta cara ya pertenece al alumno: "${bio.alumno.nombre}".`,
        );
      }
    }

    const padres = await this.usuarioRepo.findBy({ id: In(dto.padres_ids) });

    const nuevoAlumno = this.alumnoRepo.create({
      nombre: dto.nombre.trim(),
      DNI: dto.DNI,
      id_aula: dto.id_aula,
      padres: padres,
    });
    const alumnoGuardado = await this.alumnoRepo.save(nuevoAlumno);

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

  async getAllForScanner() {
    const biometrias = await this.biometriaRepo.find({
      where: { activo: true },
      relations: { alumno: true },
    });

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
      order: { created_at: 'DESC' },
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

  async update(id: number, dto: any) {
    const alumno = await this.findOne(id);

    // 1. Actualizar campos básicos
    if (dto.nombre) alumno.nombre = dto.nombre.trim();
    if (dto.DNI) alumno.DNI = dto.DNI;

    // 2. Actualizar el aula (FK)
    // IMPORTANT: We must DELETE the loaded relation property instead of setting
    // it to null. Setting `aula = null` makes TypeORM generate `id_aula = NULL`
    // which violates the NOT NULL foreign key constraint.
    if (dto.id_aula !== undefined) {
      alumno.id_aula = dto.id_aula;
      delete (alumno as any).aula;
    }

    // 3. Actualizar la relación ManyToMany (Padres)
    if (dto.padres_ids !== undefined) {
      const padres = await this.usuarioRepo.findBy({ id: In(dto.padres_ids) });
      alumno.padres = padres;
    }

    await this.alumnoRepo.save(alumno);

    // 4. Si envían un nuevo rostro, lo actualizamos
    if (dto.descriptor && dto.descriptor.length === 128) {
      let bio = await this.biometriaRepo.findOne({ where: { id_alumno: id } });
      if (bio) {
        bio.embedding_facial = JSON.stringify(dto.descriptor);
      } else {
        bio = this.biometriaRepo.create({
          id_alumno: id,
          embedding_facial: JSON.stringify(dto.descriptor),
        });
      }
      await this.biometriaRepo.save(bio);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const alumno = await this.findOne(id);
    // TypeORM y MySQL con ON DELETE CASCADE se encargarán de borrar su biometría
    // y los registros en la tabla pivote padre_alumno.
    await this.alumnoRepo.remove(alumno);
    return { message: 'Alumno eliminado' };
  }
}

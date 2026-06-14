import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Biometria } from '../biometria/entities/biometria.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(Biometria)
    private readonly biometriaRepo: Repository<Biometria>,
  ) {}

  async create(
    createUsuarioDto: CreateUsuarioDto,
  ): Promise<Omit<Usuario, 'password'>> {
    const { descriptor, ...userData } = createUsuarioDto;

    const existing = await this.usuariosRepository.findOne({
      where: { email: userData.email },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un usuario con el email: ${userData.email}`,
      );
    }

    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const usuario = this.usuariosRepository.create({
      ...userData,
      password: passwordHash,
      activo: userData.activo ?? true,
    });

    const saved = await this.usuariosRepository.save(usuario);

    // Si llegó la biometría, la guardamos vinculada al ID del usuario
    if (descriptor && descriptor.length > 0) {
      const nuevaBiometria = this.biometriaRepo.create({
        id_usuario: saved.id,
        embedding_facial: JSON.stringify(descriptor),
      });
      await this.biometriaRepo.save(nuevaBiometria);
    }

    return this.sanitize(saved);
  }

  async findAll(): Promise<Omit<Usuario, 'password'>[]> {
    const usuarios = await this.usuariosRepository.find({
      relations: { biometrias: true }, // Traemos sus biometrías
      order: { created_at: 'DESC' },
    });
    return usuarios.map(this.sanitize.bind(this)); // Bind necesario para no perder el contexto de this
  }

  async findOne(id: number): Promise<Omit<Usuario, 'password'>> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      relations: { biometrias: true },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }
    return this.sanitize(usuario);
  }

  // Usado por el AuthService para poder validar el login
  async findByEmailForAuth(email: string): Promise<Usuario | null> {
    return this.usuariosRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.email = :email', { email })
      .getOne();
  }

  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Omit<Usuario, 'password'>> {
    const usuario = await this.usuariosRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    const { descriptor, password, ...userData } = updateUsuarioDto;

    if (password) {
      usuario.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await this.usuariosRepository.save({ ...usuario, ...userData });

    // Lógica para actualizar o insertar la biometría si la mandan en el PATCH
    if (descriptor && descriptor.length > 0) {
      let bio = await this.biometriaRepo.findOne({ where: { id_usuario: id } });
      if (bio) {
        bio.embedding_facial = JSON.stringify(descriptor);
      } else {
        bio = this.biometriaRepo.create({
          id_usuario: id,
          embedding_facial: JSON.stringify(descriptor),
        });
      }
      await this.biometriaRepo.save(bio);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const usuario = await this.usuariosRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    try {
      await this.usuariosRepository.remove(usuario);
      return { message: `Usuario con ID ${id} eliminado correctamente.` };
    } catch (error) {
      // ─── ATRAPAMOS EL ERROR DE LLAVE FORÁNEA (1451) ───
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
        throw new ConflictException(
          'No se puede eliminar este docente porque tiene un AULA a su cargo. Por favor, ve a "Aulas" y asígnale ese salón a otro docente antes de eliminarlo.',
        );
      }

      // Si es otro tipo de error, lo lanzamos normalmente
      throw error;
    }
  }

  private sanitize(usuario: Usuario): Omit<Usuario, 'password'> {
    const { password, ...safe } = usuario;
    return safe;
  }
}

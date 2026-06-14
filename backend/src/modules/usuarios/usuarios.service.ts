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

const SALT_ROUNDS = 10;

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async create(
    createUsuarioDto: CreateUsuarioDto,
  ): Promise<Omit<Usuario, 'password'>> {
    const existing = await this.usuariosRepository.findOne({
      where: { email: createUsuarioDto.email },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un usuario con el email: ${createUsuarioDto.email}`,
      );
    }

    const passwordHash = await bcrypt.hash(
      createUsuarioDto.password,
      SALT_ROUNDS,
    );

    const usuario = this.usuariosRepository.create({
      ...createUsuarioDto,
      password: passwordHash,
      activo: createUsuarioDto.activo ?? true,
    });

    const saved = await this.usuariosRepository.save(usuario);
    return this.sanitize(saved);
  }

  async findAll(): Promise<Omit<Usuario, 'password'>[]> {
    const usuarios = await this.usuariosRepository.find({
      order: { created_at: 'DESC' },
    });
    return usuarios.map(this.sanitize);
  }

  async findOne(id: number): Promise<Omit<Usuario, 'password'>> {
    const usuario = await this.usuariosRepository.findOne({ where: { id } });
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
    if (!usuario)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);

    if (updateUsuarioDto.password) {
      updateUsuarioDto.password = await bcrypt.hash(
        updateUsuarioDto.password,
        SALT_ROUNDS,
      );
    }

    await this.usuariosRepository.save({ ...usuario, ...updateUsuarioDto });
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const usuario = await this.usuariosRepository.findOne({ where: { id } });
    if (!usuario)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);

    await this.usuariosRepository.remove(usuario);
    return { message: `Usuario con ID ${id} eliminado correctamente.` };
  }

  private sanitize(usuario: Usuario): Omit<Usuario, 'password'> {
    const { password, ...safe } = usuario;
    return safe;
  }
}

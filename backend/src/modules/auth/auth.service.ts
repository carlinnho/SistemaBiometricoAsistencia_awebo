import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RevokedToken } from './entities/revoked-token.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

const DUMMY_HASH =
  '$2b$10$X9f6gRqZ8M1KwLmN3pVtOeHjQ7sYdAuBiCvExWkPlRnToSzUyIabc';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
  ) {}

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; usuario: Omit<Usuario, 'password'> }> {
    const usuario = await this.usuariosService.findByEmailForAuth(
      loginDto.email,
    );

    const hashToCompare = usuario?.password ?? DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      hashToCompare,
    );

    if (!usuario || !isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Esta cuenta se encuentra desactivada.');
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };

    const access_token = this.jwtService.sign(payload);
    const { password, ...safeUser } = usuario;

    return {
      access_token,
      usuario: safeUser,
    };
  }

  async logout(rawToken: string): Promise<{ message: string }> {
    const decoded = this.jwtService.decode(rawToken) as JwtPayload;

    if (!decoded?.exp) throw new UnauthorizedException('Token inválido.');

    const alreadyRevoked = await this.revokedTokenRepository.findOne({
      where: { token: rawToken },
    });
    if (alreadyRevoked)
      return { message: 'La sesión ya había sido cerrada previamente.' };

    const expires_at = new Date(decoded.exp * 1000);
    await this.revokedTokenRepository.save(
      this.revokedTokenRepository.create({ token: rawToken, expires_at }),
    );

    return { message: 'Sesión cerrada correctamente.' };
  }
}

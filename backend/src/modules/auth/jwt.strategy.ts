import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RevokedToken } from './entities/revoked-token.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  rol: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usuariosService: UsuariosService,
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    } as any);
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<Omit<Usuario, 'password'>> {
    const rawToken = req.headers.authorization?.split(' ')[1];

    if (!rawToken)
      throw new UnauthorizedException('Token no encontrado en la solicitud.');

    const isRevoked = await this.revokedTokenRepository.findOne({
      where: { token: rawToken },
    });
    if (isRevoked)
      throw new UnauthorizedException(
        'Sesión cerrada. Por favor, inicie sesión nuevamente.',
      );

    const usuario = await this.usuariosService.findOne(payload.sub);

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo.');
    }

    return usuario;
  }
}

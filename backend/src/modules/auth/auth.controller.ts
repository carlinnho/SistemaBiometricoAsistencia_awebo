import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    short: { ttl: 1000, limit: 3 },
    medium: { ttl: 60000, limit: 5 },
  })
  login(@Body() loginDto: LoginDto) {
    this.logger.log(`Intento de login para: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request) {
    const rawToken = req.headers.authorization?.split(' ')[1] ?? '';
    return this.authService.logout(rawToken);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumnosService } from './alumnos.service';
import { AlumnosController } from './alumnos.controller';
import { Alumno } from './entities/alumno.entity';
import { Biometria } from '../biometria/entities/biometria.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alumno, Biometria, Usuario])],
  controllers: [AlumnosController],
  providers: [AlumnosService],
  exports: [AlumnosService],
})
export class AlumnosModule {}

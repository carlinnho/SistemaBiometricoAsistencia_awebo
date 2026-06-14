import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsistenciaService } from './asistencia.service';
import { AsistenciaController } from './asistencia.controller';
import { Asistencia } from './entities/asistencia.entity';
import { Alumno } from '../alumnos/entities/alumno.entity';
import { Horario } from '../horarios/entities/horario.entity';
import { HorarioUsuario } from '../horarios-usuario/entities/horarios-usuario.entity'; // <-- IMPORTANTE

@Module({
  imports: [
    TypeOrmModule.forFeature([Asistencia, Alumno, Horario, HorarioUsuario]),
  ], // <-- AGREGAR HorarioUsuario
  controllers: [AsistenciaController],
  providers: [AsistenciaService],
  exports: [AsistenciaService],
})
export class AsistenciaModule {}

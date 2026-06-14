import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorariosUsuarioService } from './horarios-usuario.service';
import { HorariosUsuarioController } from './horarios-usuario.controller';
import { HorarioUsuario } from './entities/horarios-usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HorarioUsuario])],
  controllers: [HorariosUsuarioController],
  providers: [HorariosUsuarioService],
  exports: [HorariosUsuarioService],
})
export class HorariosUsuarioModule {}

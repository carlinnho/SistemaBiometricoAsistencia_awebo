import { Controller, Get, Post, Body } from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';

@Controller('asistencia')
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @Post('marcar')
  registrarEscaneo(@Body() createAsistenciaDto: CreateAsistenciaDto) {
    return this.asistenciaService.registrarEscaneo(createAsistenciaDto);
  }

  @Get()
  findAll() {
    return this.asistenciaService.findAll();
  }
}

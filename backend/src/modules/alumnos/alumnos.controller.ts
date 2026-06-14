import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AlumnosService } from './alumnos.service';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('alumnos')
// @UseGuards(AuthGuard('jwt')) // NOTA: Descomenta esto en el futuro, pero lo dejaremos libre temporalmente si el quiosco no usa token.
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Post()
  create(@Body() createAlumnoDto: CreateAlumnoDto) {
    return this.alumnosService.create(createAlumnoDto);
  }

  @Get()
  findAll(@Query('for') usage: string) {
    if (usage === 'scanner') {
      // Retorna todos los descriptores matemáticos listos para face-api.js
      return this.alumnosService.getAllForScanner();
    }
    // Retorna la data normal para el panel del administrador
    return this.alumnosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alumnosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAlumnoDto: UpdateAlumnoDto,
  ) {
    return this.alumnosService.update(id, updateAlumnoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.alumnosService.remove(id);
  }
}

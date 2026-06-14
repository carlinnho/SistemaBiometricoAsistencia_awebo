import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { HorariosUsuarioService } from './horarios-usuario.service';
import { CreateHorarioUsuarioDto } from './dto/create-horarios-usuario.dto';
import { UpdateHorarioUsuarioDto } from './dto/update-horarios-usuario.dto';

@Controller('horario_usuario') // <-- Esta es la ruta exacta que busca el frontend
export class HorariosUsuarioController {
  constructor(
    private readonly horariosUsuarioService: HorariosUsuarioService,
  ) {}

  @Post()
  create(@Body() dto: CreateHorarioUsuarioDto) {
    return this.horariosUsuarioService.create(dto);
  }

  @Get()
  findAll() {
    return this.horariosUsuarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.horariosUsuarioService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHorarioUsuarioDto,
  ) {
    return this.horariosUsuarioService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.horariosUsuarioService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AulasService } from './aulas.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('aulas')
@UseGuards(AuthGuard('jwt')) // Protegemos todas las rutas
export class AulasController {
  constructor(private readonly aulasService: AulasService) {}

  @Post()
  create(@Body() createAulaDto: CreateAulaDto) {
    return this.aulasService.create(createAulaDto);
  }

  @Get()
  findAll() {
    return this.aulasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.aulasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAulaDto: UpdateAulaDto,
  ) {
    return this.aulasService.update(id, updateAulaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.aulasService.remove(id);
  }
}

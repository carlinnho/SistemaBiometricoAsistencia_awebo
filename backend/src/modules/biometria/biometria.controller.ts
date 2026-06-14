import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BiometriaService } from './biometria.service';
import { CreateBiometriaDto } from './dto/create-biometria.dto';
import { UpdateBiometriaDto } from './dto/update-biometria.dto';

@Controller('biometria')
export class BiometriaController {
  constructor(private readonly biometriaService: BiometriaService) {}

  @Post()
  create(@Body() createBiometriaDto: CreateBiometriaDto) {
    return this.biometriaService.create(createBiometriaDto);
  }

  @Get()
  findAll() {
    return this.biometriaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.biometriaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBiometriaDto: UpdateBiometriaDto) {
    return this.biometriaService.update(+id, updateBiometriaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.biometriaService.remove(+id);
  }
}

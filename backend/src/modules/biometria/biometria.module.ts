import { Module } from '@nestjs/common';
import { BiometriaService } from './biometria.service';
import { BiometriaController } from './biometria.controller';

@Module({
  controllers: [BiometriaController],
  providers: [BiometriaService],
})
export class BiometriaModule {}

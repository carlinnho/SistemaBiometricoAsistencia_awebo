import { IsNumber, IsString, Matches } from 'class-validator';

export class CreateHorarioUsuarioDto {
  @IsNumber()
  id_usuario: number;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora de entrada inválido (HH:mm)',
  })
  hora_entrada: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora límite inválido (HH:mm)',
  })
  Hora_limite_puntual: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora de salida inválido (HH:mm)',
  })
  hora_salida: string;
}

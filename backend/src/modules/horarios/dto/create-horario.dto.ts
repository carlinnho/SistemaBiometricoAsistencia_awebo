import { IsNumber, IsString, Matches } from 'class-validator';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
const timeMessage = 'La hora debe tener el formato HH:MM o HH:MM:SS';

export class CreateHorarioDto {
  @IsNumber()
  id_aula: number;

  @IsString()
  @Matches(timeRegex, { message: timeMessage })
  hora_entrada: string;

  @IsString()
  @Matches(timeRegex, { message: timeMessage })
  Hora_limite_puntual: string;

  @IsString()
  @Matches(timeRegex, { message: timeMessage })
  hora_salida: string;
}

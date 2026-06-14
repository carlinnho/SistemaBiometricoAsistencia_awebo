import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Aula } from '../../aulas/entities/aula.entity';

@Entity('horario')
export class Horario {
  @PrimaryGeneratedColumn()
  id_horario: number;

  @Column()
  id_aula: number;

  @Column({ type: 'time' })
  hora_entrada: string;

  @Column({ type: 'time' })
  Hora_limite_puntual: string;

  @Column({ type: 'time' })
  hora_salida: string;

  @ManyToOne(() => Aula, (aula) => aula.horarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_aula' })
  aula: Aula;
}

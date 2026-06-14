import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('horario_usuario')
export class HorarioUsuario {
  @PrimaryGeneratedColumn()
  id_horario_usuario: number;

  @Column()
  id_usuario: number;

  @Column({ type: 'time' })
  hora_entrada: string;

  @Column({ type: 'time' })
  Hora_limite_puntual: string;

  @Column({ type: 'time' })
  hora_salida: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}

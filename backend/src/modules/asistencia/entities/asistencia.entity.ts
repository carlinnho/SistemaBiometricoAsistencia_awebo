import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Alumno } from '../../alumnos/entities/alumno.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('asistencia')
export class Asistencia {
  @PrimaryGeneratedColumn()
  id_asistencia: number;

  @Column({ nullable: true })
  id_alumno: number | null;

  @Column({ nullable: true })
  id_usuario: number | null;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time', nullable: true })
  hora_entrada: string;

  @Column({ type: 'time', nullable: true })
  hora_salida: string;

  @Column({ type: 'enum', enum: ['puntual', 'tardanza', 'inasistencia'] })
  estado: string;

  @ManyToOne(() => Alumno, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_alumno' })
  alumno: Alumno;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}

import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Alumno } from '../../alumnos/entities/alumno.entity';

@Entity('biometria')
export class Biometria {
  @PrimaryGeneratedColumn()
  id_biometria: number;

  @Column()
  id_alumno: number;

  // Guardamos el Float32Array como string (JSON) en un longtext
  @Column({ type: 'longtext' })
  embedding_facial: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha_registro: Date;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToOne(() => Alumno, (alumno) => alumno.biometrias, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_alumno' })
  alumno: Alumno;
}

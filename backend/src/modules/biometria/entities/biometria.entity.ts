import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Alumno } from '../../alumnos/entities/alumno.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('biometria')
export class Biometria {
  @PrimaryGeneratedColumn()
  id_biometria: number;

  @Column({ nullable: true })
  id_alumno: number;

  @Column({ nullable: true })
  id_usuario: number;

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

  @ManyToOne(() => Usuario, (usuario) => usuario.biometrias, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}

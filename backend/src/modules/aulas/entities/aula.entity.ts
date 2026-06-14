import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Horario } from '../../horarios/entities/horario.entity';

@Entity('aula')
export class Aula {
  @PrimaryGeneratedColumn()
  id_aula: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 20 })
  grado: string;

  @Column({ type: 'varchar', length: 20 })
  seccion: string;

  @Column()
  id_docente: number;

  @ManyToOne(() => Usuario, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'id_docente' })
  docente: Usuario;

  @OneToMany(() => Horario, (horario) => horario.aula)
  horarios: Horario[];
}

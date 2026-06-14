import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';
import { Biometria } from '../../biometria/entities/biometria.entity';
import { Asistencia } from '../../asistencia/entities/asistencia.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255 })
  apellido: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.DOCENTE })
  rol: Role;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @OneToMany(() => Biometria, (bio) => bio.usuario)
  biometrias: Biometria[];

  @OneToMany(() => Asistencia, (asis) => asis.usuario)
  asistencias: Asistencia[];
}

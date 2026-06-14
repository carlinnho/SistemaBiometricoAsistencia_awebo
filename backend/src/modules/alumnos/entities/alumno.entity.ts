import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Aula } from '../../aulas/entities/aula.entity';
import { Biometria } from '../../biometria/entities/biometria.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('alumno')
export class Alumno {
  @PrimaryGeneratedColumn()
  id_alumno: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 8, unique: true })
  DNI: string;

  @Column()
  id_aula: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  eliminated_at: Date;

  @ManyToOne(() => Aula)
  @JoinColumn({ name: 'id_aula' })
  aula: Aula;

  @OneToMany(() => Biometria, (biometria) => biometria.alumno)
  biometrias: Biometria[];

  // Relación Muchos a Muchos con la tabla padre_alumno
  @ManyToMany(() => Usuario)
  @JoinTable({
    name: 'padre_alumno',
    joinColumn: { name: 'id_alumno', referencedColumnName: 'id_alumno' },
    inverseJoinColumn: { name: 'id_padre', referencedColumnName: 'id' },
  })
  padres: Usuario[];
}

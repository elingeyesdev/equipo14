import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Point } from 'geojson';
import { User } from '../../../users/entities/user.entity';
import { REPORT_TYPE_VALUES } from '../enums/report-type.enum';
import { Image } from '../../images/entities/image.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: REPORT_TYPE_VALUES,
  })
  type: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: Point;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'float' })
  weight: number;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @ManyToOne(() => User, (user) => user.reports, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Image, (image) => image.report)
  images: Image[];
}

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Report } from '../../reports/entities/report.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column({ type: 'timestamptz' })
  uploaded_at: Date;

  @ManyToOne(() => Report, (report) => report.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportId' })
  report: Report;
}

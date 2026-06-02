import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { Polygon } from 'geojson';

@Entity()
export class Zone {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ default: '#3b82f6' })
    color: string;

    @Column({
        type: 'geography',
        spatialFeatureType: 'Polygon',
        srid: 4326,
    })
    boundary: Polygon;

    @CreateDateColumn()
    created_at: Date;
}

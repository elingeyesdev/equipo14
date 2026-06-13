import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { Point } from 'geojson';
import { FacilityType } from 'app/enums/facility_type.enum';

@Entity()
export class EmergencyFacility {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: FacilityType,
    })
    type: FacilityType;

    @Column({ nullable: true })
    address: string;

    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
    })
    location: Point;

    @CreateDateColumn()
    created_at: Date;
}

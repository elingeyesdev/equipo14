import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Point } from 'geojson';
import { InstallationType } from 'app/enums/installation-type.enum';
import { DispatchTracking } from './dispatch-tracking.entity';

@Entity()
export class EmergencyStation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: InstallationType,
    })
    installation_type: InstallationType;

    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
    })
    location: Point;

    @OneToOne(() => DispatchTracking, dispatchTracking => dispatchTracking.destination)
    dispatch_tracking: DispatchTracking;
}

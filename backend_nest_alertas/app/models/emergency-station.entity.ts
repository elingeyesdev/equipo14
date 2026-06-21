import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Point } from 'geojson';
import { InstallationType } from 'app/enums/installation-type.enum';
import { Dispatch } from './dispatch.entity';

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

    @OneToMany(() => Dispatch, dispatch => dispatch.destination)
    dispatches: Dispatch[];
}

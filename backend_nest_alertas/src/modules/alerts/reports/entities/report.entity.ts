import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { Point } from 'geojson';
import { User } from "src/modules/users/entities/user.entity";
import { ReportTypes } from "../enums/report-type.enum";
import { Image } from "../../images/entities/image.entity";

@Entity()
export class Report {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: ReportTypes
    })
    type: string;

    @Column({
        type: 'text'
    })
    description: string

    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
    })
    location: Point;

    @Column()
    created_at: Date;

    @Column()
    weight: number;

    @Column()
    expires_at: Date;

    @ManyToOne(() => User, (user) => user.reports)
    user: User;

    @OneToMany(() => Image, image => image.report)
    images: Image[];
}
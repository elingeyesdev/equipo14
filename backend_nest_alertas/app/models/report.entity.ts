import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { Point } from 'geojson';
import { User } from "app/models/user.entity";
import { Image } from "./image.entity";
import { ReportType } from "./report-types.entity";

@Entity()
export class Report {
    @PrimaryGeneratedColumn()
    id: number;

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

    @Column({ default: false })
    verified: boolean;

    @Column()
    expires_at: Date;

    @ManyToOne(() => User, (user) => user.reports)
    user: User;

    @ManyToOne(() => ReportType, (report_type) =>  report_type.reports)
    type: ReportType

    @OneToMany(() => Image, image => image.report)
    images: Image[];
}
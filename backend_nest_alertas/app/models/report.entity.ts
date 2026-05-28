import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { Point } from 'geojson';
import { User } from "app/models/user.entity";
import { Image } from "./image.entity";
import { ReportType } from "./report-types.entity";

@Index(['deleted_at'])
@Index(['expires_at'])
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

    @CreateDateColumn()
    created_at: Date;

    @DeleteDateColumn({
        nullable: true
    })
    deleted_at?: Date;

    @Column()
    weight: number;

    @Column({ nullable: true })
    zone: string;

    @Column({ default: false })
    verified: boolean;

    @Column()
    expires_at: Date;

    @ManyToOne(() => User, (user) => user.reports)
    creator: User;

    @ManyToOne(() => ReportType, (report_type) =>  report_type.reports)
    type: ReportType

    @OneToMany(() => Image, image => image.report)
    images: Image[];
}
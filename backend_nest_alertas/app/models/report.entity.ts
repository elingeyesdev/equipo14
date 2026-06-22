import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Point } from 'geojson';
import { User } from "app/models/user.entity";
import { Image } from "./image.entity";
import { ReportType } from "./report-types.entity";
import { Comment } from "./comment.entity";
import { Dispatch } from "./dispatch.entity";
import { StateReport } from "app/enums/state-report.enum";

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

    @Index({spatial: true})
    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
    })
    location: Point;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

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

    @Column({
        type: 'enum',
        enum: StateReport,
        default: StateReport.Activo,
    })
    status: StateReport;

    @ManyToOne(() => User, user => user.reports)
    creator: User;

    @ManyToOne(() => ReportType, report_type =>  report_type.reports)
    type: ReportType

    @OneToMany(() => Image, image => image.report)
    images: Image[];

    @OneToMany(() => Comment, comment => comment.report)
    comments: Comment[];

    @OneToMany(() => Dispatch, dispatch => dispatch.response_report)
    dispatches: Dispatch[];
}
import { Report } from "./report.entity";
import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, DeleteDateColumn } from "typeorm";
import type { Point } from 'geojson';
import { Role } from "./role.entity";
import { Image } from "./image.entity";
import { Comment } from "./comment.entity";
import { AuthorityProfile } from "./authority-profile.entity";
import { Dispatch } from "./dispatch.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    first_name: string;
    
    @Column()
    last_name: string;

    @Column({unique: true})
    phone: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    refresh_token: string;

    @Column({ nullable: true })
    fcm_token: string;

    @Column({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    })
    last_location: Point;

    @OneToMany(() => Report, report => report.creator)
    reports: Report[];

    @OneToMany(() => Image, image => image.uploadedBy)
    images: Image[];

    @OneToMany(() => Comment, comment => comment.creator)
    commnets: Comment

    @ManyToOne(() => Role, role => role.users)
    role: Role;

    @OneToOne(() => AuthorityProfile, authProfile => authProfile.user)
    authority_profile: AuthorityProfile

    @OneToMany(() => Dispatch, dispatch => dispatch.attended_by)
    dispatches: Dispatch[];

    @DeleteDateColumn()
    deleted_at: Date;
}
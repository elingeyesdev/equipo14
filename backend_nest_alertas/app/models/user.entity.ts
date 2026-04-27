import { Report } from "app/models/report.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { Point } from 'geojson';
import { Role } from "./role.entity";

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

    @OneToMany(() => Report, report => report.user)
    reports: Report[];

    @ManyToOne(() => Role, role => role.users)
    role: Role;
}
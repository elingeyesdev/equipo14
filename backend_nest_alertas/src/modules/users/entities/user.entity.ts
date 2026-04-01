import { Report } from "src/modules/alerts/reports/entities/report.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    first_name: string;
    
    @Column()
    last_name: string;

    @Column()
    phone: string;

    @Column()
    password: string;

    @OneToMany(() => Report, report => report.user)
    reports: Report[];
}
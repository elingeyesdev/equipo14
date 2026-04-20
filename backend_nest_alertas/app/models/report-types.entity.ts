import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Report } from "./report.entity";
import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Exclude } from "class-transformer";

@Entity()
export class ReportType{
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty()
    @Column()
    name: string;

    @OneToMany(() => Report, report => report.type)
    reports: Report[]
}
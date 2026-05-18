import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { Report } from "./report.entity";
import { User } from "./user.entity";

@Entity()
export class Image{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    cloudinary_id: string;

    @Column()
    url: string;

    @Column()
    uploaded_at: Date;

    @ManyToOne(() => Report, (report) => report.images)
    report: Report;

    @ManyToOne(() => User, (user) => user.images)
    uploadedBy: User;
}
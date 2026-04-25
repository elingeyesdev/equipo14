import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Role{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string

    @OneToMany(() => User, users => users.role)
    users: User[]
}
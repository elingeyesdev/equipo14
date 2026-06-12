import { ProfileType } from "app/enums/profile_type.enum";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./user.entity";

@Entity()
export class AuthorityProfile{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    ci: string;

    @Column()
    gmail: string;

    @Column({
        type: 'enum',
        enum: ProfileType
    })
    profile_type: string

    @OneToOne(() => User, user => user.authority_profile)
    @JoinColumn()
    user: User
}
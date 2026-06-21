import { CreateDateColumn, Column, Entity, JoinColumn, OneToOne, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Report } from './report.entity';
import { EmergencyStation } from './emergency-station.entity';
import { User } from './user.entity';
import { StateType } from 'app/enums/state-type.enum';

@Entity('dispatch')
export class Dispatch {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    recorded_at: Date;

    @Column({
        type: 'enum',
        enum: StateType,
        default: StateType.EnCurso,
    })
    state: StateType;

    @ManyToOne(() => Report, report => report.dispatches)
    response_report: Report;

    @ManyToOne(() => EmergencyStation, station => station.dispatches)
    destination: EmergencyStation;

    @ManyToOne(() => User, user => user.dispatches)
    attended_by: User;
}

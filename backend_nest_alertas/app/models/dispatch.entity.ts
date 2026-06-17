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

    @OneToOne(() => Report, report => report.dispatch)
    @JoinColumn({ name: 'response_report_id' })
    response_report: Report;

    @OneToOne(() => EmergencyStation, station => station.dispatch)
    @JoinColumn({ name: 'destination_id' })
    destination: EmergencyStation;

    @ManyToOne(() => User, user => user.dispatches)
    @JoinColumn({ name: 'attended_by_id' })
    attended_by: User;
}

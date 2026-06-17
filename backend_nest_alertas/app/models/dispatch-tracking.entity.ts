import { CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Report } from './report.entity';
import { EmergencyStation } from './emergency-station.entity';

@Entity('dispatch_tracking')
export class DispatchTracking {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    recorded_at: Date;

    @OneToOne(() => Report, report => report.dispatch_tracking)
    @JoinColumn({ name: 'response_report_id' })
    response_report: Report;

    @OneToOne(() => EmergencyStation, station => station.dispatch_tracking)
    @JoinColumn({ name: 'destination_id' })
    destination: EmergencyStation;
}

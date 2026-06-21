import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportType } from 'app/models/report-types.entity';
import { Role } from 'app/models/role.entity';
import { Report } from 'app/models/report.entity';
import { User } from 'app/models/user.entity';
import { EmergencyStation } from 'app/models/emergency-station.entity';
import { InstallationType } from 'app/enums/installation-type.enum';
import { Repository } from 'typeorm';
/**
 * Inserta los tipos de reporte por defecto si la tabla está vacía.
 * Se llama una vez al arrancar la app (bootstrap/app.ts).
 */
export async function seedReportTypes(app: INestApplication): Promise<void> {
    const repo = app.get<Repository<ReportType>>(getRepositoryToken(ReportType));

    const count = await repo.count();
    if (count > 0) return; // Ya hay datos, no sobrescribir

    await repo.save([
        { id: 1, name: 'Robo a mano armada', base_weight: 9 },
        { id: 2, name: 'Incendio estructural', base_weight: 10 },
        { id: 3, name: 'Accidente de tránsito', base_weight: 8 },
        { id: 4, name: 'Hurto', base_weight: 4 },
        { id: 5, name: 'Incendio forestal', base_weight: 8 },
        { id: 6, name: 'Emergencia médica', base_weight: 9 },
        { id: 7, name: 'Obstrucción de vía', base_weight: 3 },
    ]);

    console.log('[Seed] Tipos de reporte insertados: robo (1), incendio (2), accidente (3)');
}

export async function seedRoles(app: INestApplication): Promise<void> {
    const repo = app.get<Repository<Role>>(getRepositoryToken(Role));

    const count = await repo.count();
    if (count > 0) return;

    await repo.save([
        { id: 1, name: 'usuario' },
        { id: 2, name: 'autoridad' },
        { id: 3, name: 'admin' },
    ]);

    console.log('[Seed] Roles insertados: usuario normal (1), autoridad (2), admin (3)');
}

/** Reportes de demo si la tabla está vacía (útil para métricas y mapa en desarrollo). */
export async function seedSampleReports(app: INestApplication): Promise<void> {
    const reportRepo = app.get<Repository<Report>>(getRepositoryToken(Report));
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const typeRepo = app.get<Repository<ReportType>>(getRepositoryToken(ReportType));

    const count = await reportRepo.count();
    if (count > 0) return;

    const user =
        (await userRepo.findOne({ where: { phone: '64474075' }, relations: ['role'] })) ??
        (await userRepo.findOne({ where: {}, relations: ['role'] }));
    if (!user) {
        console.log('[Seed] Sin usuarios: omitiendo reportes de demo');
        return;
    }

    const types = await typeRepo.find();
    if (!types.length) return;

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    const samples: Array<{
        description: string;
        lng: number;
        lat: number;
        zone: string;
        verified: boolean;
        type: ReportType;
    }> = [
        {
            description: 'Accidente de tránsito en Av. Banzer y 2do anillo',
            lng: -63.1812,
            lat: -17.7833,
            zone: 'Centro',
            verified: true,
            type: types.find((t) => t.id === 3) ?? types[0],
        },
        {
            description: 'Robo a mano armada reportado por vecinos',
            lng: -63.195,
            lat: -17.79,
            zone: 'Equipetrol',
            verified: false,
            type: types.find((t) => t.id === 1) ?? types[0],
        },
        {
            description: 'Incendio estructural en bodega comercial',
            lng: -63.17,
            lat: -17.775,
            zone: 'Plan 3000',
            verified: true,
            type: types.find((t) => t.id === 2) ?? types[0],
        },
        {
            description: 'Emergencia médica — persona inconsciente',
            lng: -63.205,
            lat: -17.768,
            zone: 'Urbari',
            verified: false,
            type: types.find((t) => t.id === 6) ?? types[0],
        },
        {
            description: 'Obstrucción de vía por árbol caído',
            lng: -63.188,
            lat: -17.801,
            zone: 'La Guardia',
            verified: true,
            type: types.find((t) => t.id === 7) ?? types[0],
        },
    ];

    for (const sample of samples) {
        const report = reportRepo.create({
            description: sample.description,
            location: {
                type: 'Point',
                coordinates: [sample.lng, sample.lat],
            },
            weight: sample.type.base_weight,
            zone: sample.zone,
            verified: sample.verified,
            expires_at: expires,
            creator: user,
            type: sample.type,
        });
        await reportRepo.save(report);
    }

    console.log(`[Seed] ${samples.length} reportes de demo insertados`);
}

/** Estaciones de emergencia en Santa Cruz (policía, bomberos, hospitales). */
export async function seedEmergencyStations(app: INestApplication): Promise<void> {
    const repo = app.get<Repository<EmergencyStation>>(
        getRepositoryToken(EmergencyStation),
    );

    const count = await repo.count();
    if (count > 0) return;

    const stations: Array<{
        name: string;
        installation_type: InstallationType;
        lng: number;
        lat: number;
    }> = [
        {
            name: 'Comando Departamental Policía SC',
            installation_type: InstallationType.Policia,
            lng: -63.1821,
            lat: -17.7833,
        },
        {
            name: 'UTOP Equipetrol',
            installation_type: InstallationType.Policia,
            lng: -63.1968,
            lat: -17.7565,
        },
        {
            name: 'UTOP Sur',
            installation_type: InstallationType.Policia,
            lng: -63.175,
            lat: -17.81,
        },
        {
            name: 'Cuartel General Bomberos SC',
            installation_type: InstallationType.Bombero,
            lng: -63.1755,
            lat: -17.7895,
        },
        {
            name: 'Compañía Bomberos Plan 3000',
            installation_type: InstallationType.Bombero,
            lng: -63.168,
            lat: -17.772,
        },
        {
            name: 'Hospital Japonés',
            installation_type: InstallationType.Hospital,
            lng: -63.1902,
            lat: -17.7598,
        },
        {
            name: 'Hospital Obrero',
            installation_type: InstallationType.Hospital,
            lng: -63.1765,
            lat: -17.7836,
        },
        {
            name: 'Clínica Las Américas',
            installation_type: InstallationType.Hospital,
            lng: -63.181,
            lat: -17.783,
        },
    ];

    for (const item of stations) {
        const station = repo.create({
            name: item.name,
            installation_type: item.installation_type,
            location: {
                type: 'Point',
                coordinates: [item.lng, item.lat],
            },
        });
        await repo.save(station);
    }

    console.log(`[Seed] ${stations.length} estaciones de emergencia insertadas`);
}

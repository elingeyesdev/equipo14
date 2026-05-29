import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportType } from 'app/models/report-types.entity';
import { Role } from 'app/models/role.entity';
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
        { id: 1, name: 'Robo a mano armada', base_weight: 10 },
        { id: 2, name: 'Incendio estructural', base_weight: 15 },
        { id: 3, name: 'Accidente de tránsito', base_weight: 8 },
        { id: 4, name: 'Hurto', base_weight: 5 },
        { id: 5, name: 'Incendio forestal', base_weight: 12 },
        { id: 6, name: 'Emergencia médica', base_weight: 12 },
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

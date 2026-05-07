-- ============================================================
-- SEED COMPLETO - alertas_db
-- Ciudad: Santa Cruz de la Sierra, Bolivia
-- Usuarios: Waldir, Ignacio, Sebastian (pass: admin123)
-- ============================================================

-- 1. ROLES (si no existen)
INSERT INTO role (id, name) VALUES
  (1, 'usuario normal'),
  (2, 'autoridad')
ON CONFLICT (id) DO NOTHING;

-- 2. TIPOS DE REPORTE (si no existen)
INSERT INTO report_type (id, name, category, base_weight) VALUES
  (1, 'Robo a mano armada',   'Seguridad',   10),
  (2, 'Incendio estructural', 'Emergencia',  15),
  (3, 'Accidente de tránsito','Vial',         8),
  (4, 'Hurto',               'Seguridad',    5),
  (5, 'Incendio forestal',    'Emergencia',  12),
  (6, 'Emergencia médica',    'Salud',       12),
  (7, 'Obstrucción de vía',   'Vial',         3)
ON CONFLICT (id) DO NOTHING;

-- 3. USUARIOS
-- Contraseña para todos: admin123
-- Hash bcrypt (10 rounds): $2b$10$k5r9A5/8XnGXQWKuMeCDA..1qDBxZbKexBDOwQQtmZULf9ztnVs1C

INSERT INTO "user" (id, first_name, last_name, phone, password, refresh_token, fcm_token, last_location, "roleId")
VALUES
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    'Waldir', 'Mamani',
    '70000001',
    '$2b$10$k5r9A5/8XnGXQWKuMeCDA..1qDBxZbKexBDOwQQtmZULf9ztnVs1C',
    NULL, NULL,
    ST_SetSRID(ST_MakePoint(-63.1821, -17.7834), 4326),
    1
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    'Ignacio', 'Vaca',
    '70000002',
    '$2b$10$k5r9A5/8XnGXQWKuMeCDA..1qDBxZbKexBDOwQQtmZULf9ztnVs1C',
    NULL, NULL,
    ST_SetSRID(ST_MakePoint(-63.1950, -17.7700), 4326),
    1
  ),
  (
    'a1b2c3d4-0003-0003-0003-000000000003',
    'Sebastian', 'Flores',
    '70000003',
    '$2b$10$k5r9A5/8XnGXQWKuMeCDA..1qDBxZbKexBDOwQQtmZULf9ztnVs1C',
    NULL, NULL,
    ST_SetSRID(ST_MakePoint(-63.1650, -17.8100), 4326),
    1
  )
ON CONFLICT (id) DO NOTHING;

-- 4. REPORTES (distribuidos por toda la ciudad)
-- Zona Centro, Norte, Sur, Este, Oeste, Plan 3000, Equipetrol, etc.

INSERT INTO report (description, location, created_at, weight, zone, verified, expires_at, "userId", "typeId")
VALUES

  -- === WALDIR (usuario 1) ===

  -- Centro Histórico
  ('Robo a pasajero en plena Plaza 24 de Septiembre, sujeto huyó hacia el mercado.',
   ST_SetSRID(ST_MakePoint(-63.1821, -17.7834), 4326)::geography,
   NOW() - INTERVAL '2 hours', 10, 'Centro', false, NOW() + INTERVAL '22 hours',
   'a1b2c3d4-0001-0001-0001-000000000001', 1),

  -- Equipetrol Norte
  ('Accidente entre camioneta y moto en la intersección de Equipetrol y 4to anillo.',
   ST_SetSRID(ST_MakePoint(-63.2050, -17.7600), 4326)::geography,
   NOW() - INTERVAL '3 hours', 8, 'Equipetrol Norte', true, NOW() + INTERVAL '21 hours',
   'a1b2c3d4-0001-0001-0001-000000000001', 3),

  -- Villa 1ro de Mayo
  ('Incendio en vivienda de madera, llamas se propagan al lote vecino.',
   ST_SetSRID(ST_MakePoint(-63.1300, -17.7400), 4326)::geography,
   NOW() - INTERVAL '1 hour', 15, 'Villa 1ro de Mayo', false, NOW() + INTERVAL '23 hours',
   'a1b2c3d4-0001-0001-0001-000000000001', 2),

  -- Av. Santos Dumont (Norte)
  ('Persona desmayada en la vía pública frente al colegio, necesita ambulancia.',
   ST_SetSRID(ST_MakePoint(-63.1750, -17.7500), 4326)::geography,
   NOW() - INTERVAL '40 minutes', 12, 'Norte', false, NOW() + INTERVAL '23 hours',
   'a1b2c3d4-0001-0001-0001-000000000001', 6),

  -- 6to anillo Sur
  ('Árbol caído bloquea completamente la vía en el 6to anillo camino al aeropuerto.',
   ST_SetSRID(ST_MakePoint(-63.1600, -17.8400), 4326)::geography,
   NOW() - INTERVAL '5 hours', 3, 'Sur', true, NOW() + INTERVAL '19 hours',
   'a1b2c3d4-0001-0001-0001-000000000001', 7),

  -- Plan 3000
  ('Hurto de celular en parada de trufi, zona Plan 3000 entrada principal.',
   ST_SetSRID(ST_MakePoint(-63.0900, -17.8000), 4326)::geography,
   NOW() - INTERVAL '6 hours', 5, 'Plan 3000', false, NOW() + INTERVAL '18 hours',
   'a1b2c3d4-0001-0001-0001-000000000001', 4),

  -- === IGNACIO (usuario 2) ===

  -- Av. Cañoto (Centro-Oeste)
  ('Robo a mano armada a comerciante en la feria de la Av. Cañoto.',
   ST_SetSRID(ST_MakePoint(-63.1920, -17.7900), 4326)::geography,
   NOW() - INTERVAL '90 minutes', 10, 'Cañoto', false, NOW() + INTERVAL '22 hours',
   'a1b2c3d4-0002-0002-0002-000000000002', 1),

  -- Urbarí
  ('Choque múltiple en rotonda de Urbarí, al menos 3 vehículos involucrados.',
   ST_SetSRID(ST_MakePoint(-63.1700, -17.7700), 4326)::geography,
   NOW() - INTERVAL '2 hours', 8, 'Urbarí', true, NOW() + INTERVAL '22 hours',
   'a1b2c3d4-0002-0002-0002-000000000002', 3),

  -- Zona Norte - Las Palmas
  ('Incendio de pastizal cerca de la urbanización Las Palmas, humo visible desde lejos.',
   ST_SetSRID(ST_MakePoint(-63.2100, -17.7350), 4326)::geography,
   NOW() - INTERVAL '30 minutes', 12, 'Norte', false, NOW() + INTERVAL '23 hours',
   'a1b2c3d4-0002-0002-0002-000000000002', 5),

  -- Av. Piraí
  ('Obstrucción total de la Av. Piraí por obras sin señalización adecuada.',
   ST_SetSRID(ST_MakePoint(-63.2200, -17.7800), 4326)::geography,
   NOW() - INTERVAL '4 hours', 3, 'Oeste', true, NOW() + INTERVAL '20 hours',
   'a1b2c3d4-0002-0002-0002-000000000002', 7),

  -- Mercado Los Pozos
  ('Hurto de cartera a señora en mercado Los Pozos, delincuente identificado.',
   ST_SetSRID(ST_MakePoint(-63.1870, -17.7850), 4326)::geography,
   NOW() - INTERVAL '3 hours', 5, 'Los Pozos', false, NOW() + INTERVAL '21 hours',
   'a1b2c3d4-0002-0002-0002-000000000002', 4),

  -- Av. Brasil (Este)
  ('Persona con herida de bala encontrada en Av. Brasil y 3er anillo.',
   ST_SetSRID(ST_MakePoint(-63.1500, -17.7750), 4326)::geography,
   NOW() - INTERVAL '20 minutes', 12, 'Este', false, NOW() + INTERVAL '23 hours',
   'a1b2c3d4-0002-0002-0002-000000000002', 6),

  -- === SEBASTIAN (usuario 3) ===

  -- Av. Monseñor Rivero
  ('Accidente de tránsito con peatón atropellado frente al Hospital de Clínicas.',
   ST_SetSRID(ST_MakePoint(-63.1780, -17.7820), 4326)::geography,
   NOW() - INTERVAL '1 hour', 8, 'Centro', true, NOW() + INTERVAL '23 hours',
   'a1b2c3d4-0003-0003-0003-000000000003', 3),

  -- Ciudad Jardín (Sureste)
  ('Robo a motociclista en semáforo de Ciudad Jardín y 4to anillo.',
   ST_SetSRID(ST_MakePoint(-63.1550, -17.8050), 4326)::geography,
   NOW() - INTERVAL '2 hours', 10, 'Ciudad Jardín', false, NOW() + INTERVAL '22 hours',
   'a1b2c3d4-0003-0003-0003-000000000003', 1),

  -- Zona Sur - Pampa de la Isla
  ('Incendio estructural en galpón industrial, bomberos ya presentes.',
   ST_SetSRID(ST_MakePoint(-63.1400, -17.8300), 4326)::geography,
   NOW() - INTERVAL '45 minutes', 15, 'Sur', true, NOW() + INTERVAL '23 hours',
   'a1b2c3d4-0003-0003-0003-000000000003', 2),

  -- 2do Anillo Interno Norte
  ('Semáforo caído genera caos vehicular en 2do anillo y Beni.',
   ST_SetSRID(ST_MakePoint(-63.1830, -17.7680), 4326)::geography,
   NOW() - INTERVAL '3 hours', 3, 'Norte', false, NOW() + INTERVAL '21 hours',
   'a1b2c3d4-0003-0003-0003-000000000003', 7),

  -- Barrio Hamacas (Oeste)
  ('Hurto de mercadería en puesto del mercado Hamacas, madrugada.',
   ST_SetSRID(ST_MakePoint(-63.2300, -17.7900), 4326)::geography,
   NOW() - INTERVAL '7 hours', 5, 'Oeste', false, NOW() + INTERVAL '17 hours',
   'a1b2c3d4-0003-0003-0003-000000000003', 4),

  -- Av. G-77 (Este lejano)
  ('Emergencia médica, adulto mayor con síntomas de infarto en Av. G-77.',
   ST_SetSRID(ST_MakePoint(-63.1200, -17.7950), 4326)::geography,
   NOW() - INTERVAL '15 minutes', 12, 'Este', false, NOW() + INTERVAL '23 hours',
   'a1b2c3d4-0003-0003-0003-000000000003', 6);

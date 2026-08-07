-- ============================================
-- SCHEMA INICIAL (ya ejecutado)
-- ============================================

-- areas: departamentos de la organización
CREATE TABLE IF NOT EXISTS areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- usuarios: personas atendidas por soporte
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- tickets: registro de cada atención
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total areas" ON areas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- ALTER: Evolucionar tickets
-- Reemplaza "descripcion" por problema/dx/solución + status
-- ============================================
-- Ejecuta SOLO este bloque si ya corriste el schema inicial ↑

-- 1. Agregar nuevas columnas
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS problema TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS dx TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS solucion TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'abierto'
  CHECK (status IN ('abierto', 'en_progreso', 'cerrado'));

-- 2. Migrar datos existentes (descripcion → problema)
UPDATE tickets SET problema = descripcion WHERE problema IS NULL AND descripcion IS NOT NULL;

-- 3. Eliminar columna vieja
ALTER TABLE tickets DROP COLUMN IF EXISTS descripcion;

-- 4. Hacer problema NOT NULL ahora que migramos datos
ALTER TABLE tickets ALTER COLUMN problema SET NOT NULL;

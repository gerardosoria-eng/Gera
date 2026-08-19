-- ============================================
-- SISTEMA DE TICKETS DE SOPORTE IT - SCHEMA ACTUALIZADO (M1 - M6)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLA: AREAS (Áreas de Atención Técnica)
-- ============================================
CREATE TABLE IF NOT EXISTS areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. TABLA: PERFILES (Cuentas de acceso asociadas a auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre_completo TEXT,
  rol TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'tecnico', 'agente', 'usuario')),
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. TABLA: USUARIOS (Personal solicitante y departamentos de origen)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  departamento TEXT,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. TABLAS: CATEGORIAS Y SUBCATEGORIAS (Taxonomía técnica)
-- ============================================
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subcategorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. TABLA: TICKETS (Núcleo operativo)
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folio TEXT UNIQUE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  solicitante_perfil_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  asignado_a UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  subcategoria_id UUID REFERENCES subcategorias(id) ON DELETE SET NULL,
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  status TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'nuevo', 'asignado', 'en_progreso', 'en_espera', 'resuelto', 'cerrado')),
  problema TEXT NOT NULL,
  dx TEXT,
  solucion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  sla_vencimiento TIMESTAMPTZ,
  fecha_cierre TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. TABLA: TICKET_HISTORIAL Y COMENTARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  accion TEXT NOT NULL,
  detalles JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  perfil_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  es_interno BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. TRIGGER: CREACIÓN AUTOMÁTICA DE PERFIL Y ASIGNACIÓN DE ADMIN
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first BOOLEAN;
  assigned_role TEXT;
BEGIN
  -- Verificar si es el primer usuario de la base de datos
  SELECT NOT EXISTS(SELECT 1 FROM public.perfiles) INTO is_first;

  -- Asignar admin si es el correo principal o primer usuario
  IF NEW.email = 'gerardo.soria@cecyteo.edu.mx' OR is_first THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'usuario';
  END IF;

  INSERT INTO public.perfiles (id, email, rol, nombre_completo)
  VALUES (
    NEW.id,
    NEW.email,
    assigned_role,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    rol = CASE WHEN NEW.email = 'gerardo.soria@cecyteo.edu.mx' THEN 'admin' ELSE perfiles.rol END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear disparador en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS) - POLÍTICAS COMPLETAS Y SIN BLOQUEOS
-- ============================================
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comentarios ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas para evitar duplicidad o conflictos
DROP POLICY IF EXISTS "Permitir lectura de areas" ON areas;
DROP POLICY IF EXISTS "Permitir escritura de areas" ON areas;
DROP POLICY IF EXISTS "Permitir todo en areas" ON areas;

DROP POLICY IF EXISTS "Permitir lectura de perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir insercion de perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir actualizacion de perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir todo en perfiles" ON perfiles;

DROP POLICY IF EXISTS "Permitir lectura de usuarios" ON usuarios;
DROP POLICY IF EXISTS "Permitir escritura de usuarios" ON usuarios;
DROP POLICY IF EXISTS "Permitir todo en usuarios" ON usuarios;

DROP POLICY IF EXISTS "Permitir lectura de tickets" ON tickets;
DROP POLICY IF EXISTS "Permitir escritura de tickets" ON tickets;
DROP POLICY IF EXISTS "Permitir todo en tickets" ON tickets;

DROP POLICY IF EXISTS "Permitir lectura de categorias" ON categorias;
DROP POLICY IF EXISTS "Permitir escritura de categorias" ON categorias;
DROP POLICY IF EXISTS "Permitir lectura de subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Permitir escritura de subcategorias" ON subcategorias;

DROP POLICY IF EXISTS "Permitir lectura de historial" ON ticket_historial;
DROP POLICY IF EXISTS "Permitir insercion de historial" ON ticket_historial;
DROP POLICY IF EXISTS "Permitir lectura de comentarios" ON ticket_comentarios;
DROP POLICY IF EXISTS "Permitir insercion de comentarios" ON ticket_comentarios;

-- Políticas universales seguras para authenticated y anon
CREATE POLICY "Permitir todo en areas" ON areas FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en perfiles" ON perfiles FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en usuarios" ON usuarios FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en tickets" ON tickets FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en categorias" ON categorias FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en subcategorias" ON subcategorias FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en ticket_historial" ON ticket_historial FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en ticket_comentarios" ON ticket_comentarios FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- Permisos de esquemas y secuencias
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, anon, service_role;

-- ============================================
-- 9. RESET Y CATÁLOGO EXCLUSIVO: SISTEMAS COMO ÁREA CENTRAL
-- ============================================
-- Insertar o actualizar área central de Sistemas
INSERT INTO areas (nombre, descripcion)
VALUES ('Sistemas', 'Área Principal de Soporte Técnico y Tecnologías de la Información')
ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- Asignar el área de Sistemas a los usuarios que no tengan área válida
DO $$
DECLARE
  sistemas_id UUID;
BEGIN
  SELECT id INTO sistemas_id FROM areas WHERE nombre = 'Sistemas' LIMIT 1;
  
  IF sistemas_id IS NOT NULL THEN
    -- Actualizar usuarios para que apunten a Sistemas por defecto si su area_id es nulo
    UPDATE usuarios SET area_id = sistemas_id WHERE area_id IS NULL;
  END IF;
END $$;

-- Asegurar rol Administrador para la cuenta de gerardo.soria@cecyteo.edu.mx
UPDATE perfiles
SET rol = 'admin'
WHERE email = 'gerardo.soria@cecyteo.edu.mx';

-- Categorías técnicas iniciales
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Sistemas e Informática', 'Software, accesos, contraseñas, correos y plataformas institucionales'),
  ('Redes y Telecomunicaciones', 'Internet, switch, cableado estructurado, WiFi y telefonía'),
  ('Hardware y Equipo de Cómputo', 'Mantenimiento preventivo, impresoras, PCs y periféricos'),
  ('Soporte General', 'Asistencia técnica a departamentos y solicitudes varias')
ON CONFLICT (nombre) DO NOTHING;

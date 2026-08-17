-- ============================================
-- SISTEMA DE TICKETS DE SOPORTE IT - SCHEMA COMPLETO (M1 - M6)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLA: AREAS (Departamentos de la organización)
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
  rol TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'agente', 'usuario')),
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. TABLA: USUARIOS (Personal atendido / Solicitantes)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
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
  status TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'asignado', 'en_progreso', 'en_espera', 'resuelto', 'cerrado')),
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
-- 7. TRIGGER: CREACIÓN AUTOMÁTICA DE PERFIL AL REGISTRAR USUARIO EN AUTH
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  -- Si es el primer usuario de la base de datos, asignarle rol admin
  SELECT NOT EXISTS(SELECT 1 FROM public.perfiles) INTO is_first;

  INSERT INTO public.perfiles (id, email, rol)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN is_first THEN 'admin' ELSE 'usuario' END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
-- Areas: Lectura pública/autenticada, modificación total
CREATE POLICY "Permitir lectura de areas" ON areas FOR SELECT USING (true);
CREATE POLICY "Permitir escritura de areas" ON areas FOR ALL USING (true) WITH CHECK (true);

-- Usuarios: Lectura y escritura
CREATE POLICY "Permitir lectura de usuarios" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Permitir escritura de usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);

-- Perfiles: Lectura a usuarios autenticados, actualización propia o por admin
CREATE POLICY "Permitir lectura de perfiles" ON perfiles FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de perfiles" ON perfiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion de perfiles" ON perfiles FOR UPDATE USING (true) WITH CHECK (true);

-- Tickets: Lectura y escritura
CREATE POLICY "Permitir lectura de tickets" ON tickets FOR SELECT USING (true);
CREATE POLICY "Permitir escritura de tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);

-- Categorías y Subcategorías
CREATE POLICY "Permitir lectura de categorias" ON categorias FOR SELECT USING (true);
CREATE POLICY "Permitir escritura de categorias" ON categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura de subcategorias" ON subcategorias FOR SELECT USING (true);
CREATE POLICY "Permitir escritura de subcategorias" ON subcategorias FOR ALL USING (true) WITH CHECK (true);

-- Historial y Comentarios
CREATE POLICY "Permitir lectura de historial" ON ticket_historial FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de historial" ON ticket_historial FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura de comentarios" ON ticket_comentarios FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de comentarios" ON ticket_comentarios FOR INSERT WITH CHECK (true);

-- ============================================
-- 9. CATÁLOGO INICIAL DE ÁREAS (SEMILLA)
-- ============================================
INSERT INTO areas (nombre) VALUES
  ('Dir. de Vinculación'),
  ('Depto. de Promoción Cultural, Cívica y Deportiva'),
  ('Dir. EMSAD'),
  ('Depto. Desarrollo Académico'),
  ('Depto. de Operación y Evaluación'),
  ('Dir. Académica'),
  ('Depto. de Planes y Programas'),
  ('Depto. de Servicios Docentes'),
  ('Dir. de Planeación'),
  ('Subdirección de Programación y Presupuesto'),
  ('Depto. de Infraestructura Educativa'),
  ('Depto. Jurídico'),
  ('Dir. Administrativa'),
  ('Depto. de Recursos Humanos'),
  ('Depto. de Recursos Financieros'),
  ('Depto. de Recursos Materiales y Servicios'),
  ('Depto. de Ingreso y Formación de Personal'),
  ('Depto. de Registro Escolar y Estadística'),
  ('Junta Directiva'),
  ('Dir. General')
ON CONFLICT (nombre) DO NOTHING;

-- Categorías iniciales
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Sistemas e Informática', 'Software, accesos, contraseñas, correos y páginas web'),
  ('Redes y Telecomunicaciones', 'Internet, switch, cableado estructurado, WiFi y telefonía'),
  ('Hardware y Equipo de Cómputo', 'Mantenimiento preventivo, impresoras, PCs y periféricos'),
  ('Soporte General', 'Asistencia a usuarios y solicitudes varias')
ON CONFLICT (nombre) DO NOTHING;

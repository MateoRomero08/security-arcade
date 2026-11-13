-- =============================================================================
-- INTIATION SCHEMA: SECURITY ARCADE (PCI DSS AWARENESS PLATFORM)
-- =============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos enumerados
CREATE TYPE game_type AS ENUM ('AUDITOR', 'FRAUD');
CREATE TYPE severity_level AS ENUM ('critica', 'alta', 'media', 'baja');
CREATE TYPE content_status AS ENUM ('borrador', 'validado');
CREATE TYPE channel_type AS ENUM ('EMAIL', 'SMS', 'CHAT', 'CALL', 'MFA_PUSH', 'WEB', 'POS_FISICO');

-- Función auxiliar para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Tabla de Eventos / Campañas
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_attempts_per_player INT DEFAULT 0, -- 0 = ilimitado
  active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla de Áreas de la Empresa
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INT DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabla de Jugadores
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  area_id UUID REFERENCES areas(id) ON DELETE RESTRICT,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL,
  employee_code TEXT,
  session_token TEXT UNIQUE,
  consent_accepted BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Requisitos PCI DSS v4.0.1
CREATE TABLE IF NOT EXISTS pci_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  version_estandar TEXT NOT NULL DEFAULT '4.0.1',
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion_corta TEXT NOT NULL,
  descripcion_completa TEXT,
  estado content_status NOT NULL DEFAULT 'borrador', -- 'borrador' requiere revisión de QSA
  validado_por TEXT,
  validado_en TIMESTAMPTZ,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Objetos de Oficina (Juego 1: "¡Ahí viene el auditor!")
CREATE TABLE IF NOT EXISTS audit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion_corta TEXT NOT NULL,
  svg_key TEXT NOT NULL,
  categoria TEXT NOT NULL,
  severidad severity_level NOT NULL,
  es_infraccion BOOLEAN NOT NULL,
  accion_correcta TEXT NOT NULL,
  acciones_parciales TEXT[] DEFAULT '{}',
  explicacion_acierto TEXT NOT NULL,
  explicacion_error TEXT NOT NULL,
  nivel_minimo INT NOT NULL DEFAULT 1,
  peso_aparicion NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  variantes JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla Puente: Objetos ↔ Requisitos PCI DSS
CREATE TABLE IF NOT EXISTS audit_item_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_item_id UUID NOT NULL REFERENCES audit_items(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES pci_requirements(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(audit_item_id, requirement_id)
);

-- 6. Escenarios de Fraude (Juego 2: "Cazador de fraude")
CREATE TABLE IF NOT EXISTS phishing_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canal channel_type NOT NULL,
  dificultad INT NOT NULL DEFAULT 1,
  es_fraude BOOLEAN NOT NULL,
  tipo_fraude TEXT,
  area_objetivo TEXT[] DEFAULT '{}',
  remitente TEXT NOT NULL,
  asunto TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  pista_inspeccion TEXT,
  headers_simulados JSONB,
  banderas_rojas JSONB DEFAULT '[]'::jsonb,
  accion_correcta TEXT NOT NULL,
  explicacion TEXT NOT NULL,
  nivel_minimo INT NOT NULL DEFAULT 1,
  peso_aparicion NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  variantes JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla Puente: Escenarios ↔ Requisitos PCI DSS
CREATE TABLE IF NOT EXISTS scenario_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES phishing_scenarios(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES pci_requirements(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scenario_id, requirement_id)
);

-- 7. Sesiones de Juego
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  game_type game_type NOT NULL,
  level INT NOT NULL DEFAULT 1,
  seed BIGINT NOT NULL,
  config_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_ms INT,
  score INT NOT NULL DEFAULT 0,
  max_score INT,
  accuracy NUMERIC(5,4),
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  rank_label TEXT,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Acciones Individuales dentro de la Sesión
CREATE TABLE IF NOT EXISTS session_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  item_or_scenario_id TEXT NOT NULL,
  action TEXT NOT NULL,
  elapsed_ms INT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points INT NOT NULL DEFAULT 0,
  client_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Configuración de Marca y Textos Legales
CREATE TABLE IF NOT EXISTS brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- VISTAS DE LEADERBOARD (OPTIMIZADAS)
-- =============================================================================

-- Vista: Mejor puntaje por jugador y juego
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT DISTINCT ON (gs.player_id, gs.game_type)
  gs.id AS session_id,
  gs.player_id,
  p.name AS player_name,
  p.short_name,
  a.id AS area_id,
  a.name AS area_name,
  gs.event_id,
  gs.game_type,
  gs.score,
  gs.rank_label,
  gs.accuracy,
  gs.ended_at,
  RANK() OVER (
    PARTITION BY gs.event_id, gs.game_type
    ORDER BY gs.score DESC, gs.duration_ms ASC NULLS LAST
  ) AS position
FROM game_sessions gs
JOIN players p ON gs.player_id = p.id
JOIN areas a ON p.area_id = a.id
WHERE gs.ended_at IS NOT NULL
  AND gs.is_valid = true
  AND p.active = true
ORDER BY gs.player_id, gs.game_type, gs.score DESC, gs.duration_ms ASC NULLS LAST;

-- Función: Promedio de los Top N mejores jugadores por área (Equitativo)
CREATE OR REPLACE FUNCTION get_area_leaderboard(
  p_event_id UUID DEFAULT NULL,
  p_top_n INT DEFAULT 5
)
RETURNS TABLE (
  area_id UUID,
  area_name TEXT,
  total_players BIGINT,
  avg_score NUMERIC,
  best_score INT,
  area_rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_players AS (
    SELECT
      v.area_id,
      v.area_name,
      v.score,
      ROW_NUMBER() OVER (
        PARTITION BY v.area_id
        ORDER BY v.score DESC
      ) AS rnk
    FROM v_leaderboard v
    WHERE (p_event_id IS NULL OR v.event_id = p_event_id)
  )
  SELECT
    rp.area_id,
    rp.area_name,
    COUNT(*)::BIGINT AS total_players,
    ROUND(AVG(rp.score), 1) AS avg_score,
    MAX(rp.score)::INT AS best_score,
    DENSE_RANK() OVER (ORDER BY AVG(rp.score) DESC)::BIGINT AS area_rank
  FROM ranked_players rp
  WHERE rp.rnk <= p_top_n
  GROUP BY rp.area_id, rp.area_name
  ORDER BY avg_score DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pci_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE phishing_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_texts ENABLE ROW LEVEL SECURITY;

-- Lectura pública para áreas, requisitos validados y textos legales
CREATE POLICY "areas_public_read" ON areas FOR SELECT USING (active = true);
CREATE POLICY "events_public_read" ON events FOR SELECT USING (active = true);
CREATE POLICY "pci_requirements_public_read" ON pci_requirements FOR SELECT USING (activo = true);
CREATE POLICY "legal_texts_public_read" ON legal_texts FOR SELECT USING (is_current = true);
CREATE POLICY "brand_public_read" ON brand_settings FOR SELECT USING (true);

-- Jugadores pueden registrarse (INSERT), actualizarse (UPDATE) y leer
CREATE POLICY "players_insert" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_select_own" ON players FOR SELECT USING (true);
CREATE POLICY "players_update_all" ON players FOR UPDATE USING (true);

-- game_sessions y session_actions: lectura e inserción permitidas
CREATE POLICY "sessions_read_all" ON game_sessions FOR SELECT USING (is_valid = true);
CREATE POLICY "sessions_insert_all" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "actions_read_own" ON session_actions FOR SELECT USING (true);
CREATE POLICY "actions_insert_all" ON session_actions FOR INSERT WITH CHECK (true);

-- Phishing Scenarios NO tienen SELECT anónimo para evitar filtración de respuestas en el navegador
-- Solo el servidor lee mediante Service Role para alimentar el generador de partidas

-- =============================================================================
-- SEMILLA DE ÁREAS OFICIALES INTOUCHCX
-- =============================================================================
INSERT INTO areas (name, display_order, active) VALUES
  ('HR', 1, true),
  ('EX', 2, true),
  ('LSS', 3, true),
  ('IT', 4, true),
  ('RECRUITMENT', 5, true),
  ('S-OPS', 6, true),
  ('FACILITIES', 7, true)
ON CONFLICT (name) DO UPDATE SET active = true, display_order = EXCLUDED.display_order;



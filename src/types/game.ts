/**
 * Tipos de datos para Security Arcade (Juego 1 y Juego 2)
 */

export type GameType = 'AUDITOR' | 'FRAUD';

export type SeverityLevel = 'critica' | 'alta' | 'media' | 'baja';

export type CorrectActionType = 
  | 'DEJAR_ESCRITORIO'
  | 'GUARDAR_BAJO_LLAVE'
  | 'TRITURAR'
  | 'SACAR_REPORTAR'
  | 'BLOQUEAR_PANTALLA'
  // Acciones Juego 2
  | 'RESPONDER_PERMITIDO'
  | 'REPORTAR_FRAUDE'
  | 'ELIMINAR'
  | 'VERIFICAR_CANAL_ALTERNO';

export interface AuditItemVariant {
  nombre?: string;
  descripcion_corta?: string;
  detalle?: string;
  svg_key?: string;
}

export interface AuditItem {
  id: string;
  nombre: string;
  descripcion_corta: string;
  detalle?: string;
  svg_key: string;
  categoria: 'documento' | 'dispositivo' | 'credencial' | 'red' | 'visitante' | 'estacion';
  severidad: SeverityLevel;
  es_infraccion: boolean;
  accion_correcta: CorrectActionType;
  acciones_parciales?: CorrectActionType[];
  explicacion_acierto: string;
  explicacion_error: string;
  nivel_minimo: number;
  peso_aparicion: number;
  variantes?: AuditItemVariant[];
  requisitos_pci_ids?: string[];
  activo: boolean;
  version?: number;
}

export interface ClientAuditItem {
  id: string;
  nombre: string;
  descripcion_corta: string;
  svg_key: string;
  categoria: string;
  severidad: SeverityLevel;
  slotIndex: number;
  resolved?: boolean;
}

export interface PhishingScenarioVariant {
  remitente?: string;
  asunto?: string;
  cuerpo?: string;
}

export interface RedFlag {
  id: string;
  fragmento: string;
  descripcion: string;
  puntos: number;
}

export interface PhishingScenario {
  id: string;
  canal: 'EMAIL' | 'SMS' | 'CHAT' | 'CALL' | 'MFA_PUSH' | 'WEB' | 'POS_FISICO';
  dificultad: 1 | 2 | 3 | 4 | 5;
  es_fraude: boolean;
  tipo_fraude?: string; // phishing, vishing, mfa_fatigue, etc.
  area_objetivo?: string[];
  remitente: string;
  asunto: string;
  cuerpo: string;
  pista_inspeccion?: string;
  headers_simulados?: {
    from_real: string;
    spf: 'PASS' | 'FAIL';
    dkim: 'PASS' | 'FAIL';
  };
  banderas_rojas?: RedFlag[];
  accion_correcta: CorrectActionType;
  explicacion: string;
  nivel_minimo: number;
  peso_aparicion: number;
  variantes?: PhishingScenarioVariant[];
  requisitos_pci_ids?: string[];
  activo: boolean;
  version?: number;
}

export interface ClientPhishingScenario {
  id: string;
  canal: PhishingScenario['canal'];
  dificultad: number;
  es_fraude: boolean; // safe to expose — content already reveals context; answer key is accion_correcta which stays server-side
  remitente: string;
  asunto: string;
  cuerpo: string;
  pista_inspeccion?: string;
  headers_simulados?: PhishingScenario['headers_simulados'];
  banderas_rojas_opciones?: Array<{ id: string; fragmento: string }>;
}

export interface PlayerSession {
  playerId: string;
  displayName: string;
  shortName: string;
  area: string;
  employeeCode?: string;
  eventId?: string;
  consentGiven: boolean;
  consentTimestamp: string;
}

export interface GameSessionState {
  sessionId: string;
  gameType: GameType;
  level: number;
  seed: number;
  startedAt: number;
  actions: SessionActionLog[];
  score: number;
  streak: number;
  combo: number;
  shields: number;
}

export interface SessionActionLog {
  itemId: string;
  action: CorrectActionType | string;
  clientTimestamp: number;
  serverTimestamp?: number;
  elapsedMs: number;
  isCorrect?: boolean;
  pointsEarned?: number;
}

export interface SessionResult {
  sessionId: string;
  gameType: GameType;
  score: number;
  rankLabel: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  breakdown: {
    basePoints: number;
    comboBonus: number;
    timeBonus: number;
    perfectBonus: number;
    penalties: number;
  };
  findings: Array<{
    itemId: string;
    titulo: string;
    decisionTomada: string;
    accionCorrecta: string;
    esCorrecto: boolean;
    puntos: number;
    explicacion: string;
    requisitoPci?: string;
  }>;
  newBadges?: string[];
}


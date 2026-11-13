/**
 * Tipos para el sistema de Requisitos PCI DSS v4.0.1 y trazabilidad
 */

export type PciStatus = 'borrador' | 'validado';

export interface PciRequirement {
  id: string;
  code: string;               // Ej: "3.4.1", "8.3.1", "12.2"
  version_estandar: string;   // Ej: "4.0.1"
  categoria: string;          // Ej: "Protección de datos de cuenta", "Control de acceso"
  titulo: string;
  descripcion_corta: string;
  descripcion_completa?: string;
  estado: PciStatus;          // 'borrador' por defecto para requerir validación QSA
  validado_por?: string | null;
  validado_en?: string | null;
  activo: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TraceabilityItem {
  id: string;
  tipo: 'objeto_oficina' | 'escenario_fraude';
  nombre_o_asunto: string;
  severidad_o_dificultad: string;
  requisitos: Array<{
    code: string;
    titulo: string;
    estado: PciStatus;
    es_primario: boolean;
  }>;
  accion_correcta: string;
  activo: boolean;
}


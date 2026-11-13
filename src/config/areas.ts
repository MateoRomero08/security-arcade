/**
 * Áreas Corporativas Oficiales Estandarizadas de InTouchCX
 */
export const COMPANY_AREAS = [
  "HR",
  "EX",
  "LSS",
  "IT",
  "RECRUITMENT",
  "S-OPS",
  "FACILITIES",
] as const;

export type CompanyArea = (typeof COMPANY_AREAS)[number];

export const DEFAULT_AREA: CompanyArea = "S-OPS";


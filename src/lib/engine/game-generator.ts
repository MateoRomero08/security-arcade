import { Mulberry32 } from "./prng";
import { SEED_AUDIT_ITEMS } from "../../data/seed-audit-items";
import { SEED_PHISHING_SCENARIOS } from "../../data/seed-phishing-scenarios";
import { 
  AuditItem, 
  PhishingScenario, 
  ClientAuditItem, 
  ClientPhishingScenario 
} from "../../types/game";

export interface GenerateAuditGameOptions {
  seed: number;
  level?: number;
  totalItems?: number;
  recentItemIds?: string[];
}

export interface GeneratedAuditGame {
  sessionId: string;
  seed: number;
  level: number;
  clientItems: ClientAuditItem[];
  serverItems: AuditItem[];
}

export function generateAuditGameSession(options: GenerateAuditGameOptions): GeneratedAuditGame {
  const { seed, level = 1, totalItems = 8, recentItemIds = [] } = options;
  const rng = new Mulberry32(seed);

  let pool = SEED_AUDIT_ITEMS.filter((i) => i.activo && i.nivel_minimo <= level);
  if (pool.length < totalItems) {
    pool = SEED_AUDIT_ITEMS.filter((i) => i.activo);
  }

  const poolSinRecientes = pool.filter((i) => !recentItemIds.includes(i.id));
  const poolEfectivo = poolSinRecientes.length >= totalItems ? poolSinRecientes : pool;

  const targetInfractions = Math.round(totalItems * 0.625);
  const targetAllowed = totalItems - targetInfractions;

  const infractionsPool = poolEfectivo.filter((i) => i.es_infraccion);
  const allowedPool = poolEfectivo.filter((i) => !i.es_infraccion);

  const selected: AuditItem[] = [];
  const selectedCategories: Record<string, number> = {};

  const canAddCategory = (cat: string) => (selectedCategories[cat] || 0) < 2;

  const shuffledInfractions = rng.shuffle(infractionsPool);
  for (const item of shuffledInfractions) {
    if (selected.length >= targetInfractions) break;
    if (canAddCategory(item.categoria)) {
      selected.push(item);
      selectedCategories[item.categoria] = (selectedCategories[item.categoria] || 0) + 1;
    }
  }

  const shuffledAllowed = rng.shuffle(allowedPool);
  for (const item of shuffledAllowed) {
    if (selected.length >= totalItems) break;
    if (canAddCategory(item.categoria)) {
      selected.push(item);
      selectedCategories[item.categoria] = (selectedCategories[item.categoria] || 0) + 1;
    }
  }

  while (selected.length < totalItems && poolEfectivo.length > selected.length) {
    const remaining = poolEfectivo.filter((i) => !selected.some((s) => s.id === i.id));
    if (remaining.length === 0) break;
    selected.push(rng.choice(remaining));
  }

  const finalOrder = rng.shuffle(selected);

  const resolvedServerItems = finalOrder.map((item) => {
    if (item.variantes && item.variantes.length > 0) {
      const variant = rng.choice(item.variantes);
      return {
        ...item,
        nombre: variant.nombre || item.nombre,
        descripcion_corta: variant.descripcion_corta || item.descripcion_corta,
      };
    }
    return item;
  });

  const clientItems: ClientAuditItem[] = resolvedServerItems.map((item, index) => ({
    id: item.id,
    nombre: item.nombre,
    descripcion_corta: item.descripcion_corta,
    svg_key: item.svg_key,
    categoria: item.categoria,
    severidad: item.severidad,
    slotIndex: index,
  }));

  const sessionId = `ses_aud_${seed}_${Date.now().toString(36)}`;

  return {
    sessionId,
    seed,
    level,
    clientItems,
    serverItems: resolvedServerItems,
  };
}

export interface GenerateFraudGameOptions {
  seed: number;
  playerArea?: string;
  totalScenarios?: number;
  recentScenarioIds?: string[];
}

export interface GeneratedFraudGame {
  sessionId: string;
  seed: number;
  clientScenarios: ClientPhishingScenario[];
  serverScenarios: PhishingScenario[];
}

export function generateFraudGameSession(options: GenerateFraudGameOptions): GeneratedFraudGame {
  const { seed, playerArea, totalScenarios = 8, recentScenarioIds = [] } = options;
  const rng = new Mulberry32(seed);

  let pool = SEED_PHISHING_SCENARIOS.filter((s) => s.activo);
  const poolSinRecientes = pool.filter((s) => !recentScenarioIds.includes(s.id));
  const poolEfectivo = poolSinRecientes.length >= totalScenarios ? poolSinRecientes : pool;

  const targetFrauds = Math.round(totalScenarios * 0.6);
  const targetLegit = totalScenarios - targetFrauds;

  const fraudPool = poolEfectivo.filter((s) => s.es_fraude);
  const legitPool = poolEfectivo.filter((s) => !s.es_fraude);

  const selected: PhishingScenario[] = [];

  const areaFrauds = playerArea
    ? fraudPool.filter((s) => s.area_objetivo?.includes(playerArea))
    : [];
  const areaLegits = playerArea
    ? legitPool.filter((s) => s.area_objetivo?.includes(playerArea))
    : [];

  if (areaFrauds.length > 0) selected.push(rng.choice(areaFrauds));
  if (areaLegits.length > 0) selected.push(rng.choice(areaLegits));

  const shuffledFrauds = rng.shuffle(fraudPool);
  for (const f of shuffledFrauds) {
    if (selected.filter((s) => s.es_fraude).length >= targetFrauds) break;
    if (!selected.some((s) => s.id === f.id)) selected.push(f);
  }

  const shuffledLegit = rng.shuffle(legitPool);
  for (const l of shuffledLegit) {
    if (selected.filter((s) => !s.es_fraude).length >= targetLegit) break;
    if (!selected.some((s) => s.id === l.id)) selected.push(l);
  }

  const finalOrder = rng.shuffle(selected);

  const clientScenarios: ClientPhishingScenario[] = finalOrder.map((s) => ({
    id: s.id,
    canal: s.canal,
    dificultad: s.dificultad,
    es_fraude: s.es_fraude,
    remitente: s.remitente,
    asunto: s.asunto,
    cuerpo: s.cuerpo,
    pista_inspeccion: s.pista_inspeccion,
    headers_simulados: s.headers_simulados,
    banderas_rojas_opciones: s.banderas_rojas?.map((b) => ({
      id: b.id,
      fragmento: b.fragmento,
    })),
  }));

  const sessionId = `ses_fra_${seed}_${Date.now().toString(36)}`;

  return {
    sessionId,
    seed,
    clientScenarios,
    serverScenarios: finalOrder,
  };
}

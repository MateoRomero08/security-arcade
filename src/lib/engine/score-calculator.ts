import { 
  AuditItem, 
  PhishingScenario, 
  SessionActionLog, 
  SessionResult 
} from "../../types/game";
import { SEED_PCI_REQUIREMENTS } from "../../data/seed-pci";

const SEVERITY_WEIGHTS = {
  critica: 3.0,
  alta: 2.0,
  media: 1.5,
  baja: 1.0,
};

export function evaluateAuditSession(
  sessionId: string,
  serverItems: AuditItem[],
  actions: SessionActionLog[],
  timeLeftSeconds: number = 0
): SessionResult {
  let score = 0;
  let streak = 0;
  let correctCount = 0;

  const findings: SessionResult["findings"] = [];
  const actionsMap = new Map<string, SessionActionLog>();

  for (const act of actions) {
    if (act.elapsedMs > 0 && act.elapsedMs < 250) {
      act.isCorrect = false;
      act.pointsEarned = -100;
      score = Math.max(0, score - 100);
      continue;
    }
    actionsMap.set(act.itemId, act);
  }

  for (const item of serverItems) {
    const actionLog = actionsMap.get(item.id);
    const weight = SEVERITY_WEIGHTS[item.severidad] || 1.0;

    const reqPci = item.requisitos_pci_ids?.[0]
      ? SEED_PCI_REQUIREMENTS.find((r) => r.id === item.requisitos_pci_ids![0])
      : null;
    const reqCode = reqPci ? `${reqPci.code} - ${reqPci.titulo}` : undefined;

    if (!actionLog) {
      if (item.es_infraccion) {
        const penalty = Math.round(150 * weight);
        score = Math.max(0, score - penalty);
        findings.push({
          itemId: item.id,
          titulo: item.nombre,
          decisionTomada: "Not reviewed (forgotten)",
          accionCorrecta: item.accion_correcta,
          esCorrecto: false,
          puntos: -penalty,
          explicacion: item.explicacion_error,
          requisitoPci: reqCode,
        });
      } else {
        correctCount++;
        findings.push({
          itemId: item.id,
          titulo: item.nombre,
          decisionTomada: "Left on desk",
          accionCorrecta: item.accion_correcta,
          esCorrecto: true,
          puntos: 0,
          explicacion: item.explicacion_acierto,
          requisitoPci: reqCode,
        });
      }
      continue;
    }

    const isDirectMatch = actionLog.action === item.accion_correcta;
    const isPartialMatch = item.acciones_parciales?.includes(actionLog.action as never);

    if (isDirectMatch) {
      correctCount++;
      streak++;
      const comboMult = streak >= 5 ? 2.0 : streak >= 3 ? 1.5 : 1.0;
      const pts = Math.round(100 * weight * comboMult);
      score += pts;

      findings.push({
        itemId: item.id,
        titulo: item.nombre,
        decisionTomada: actionLog.action,
        accionCorrecta: item.accion_correcta,
        esCorrecto: true,
        puntos: pts,
        explicacion: item.explicacion_acierto,
        requisitoPci: reqCode,
      });
    } else if (isPartialMatch) {
      correctCount++;
      const pts = Math.round(40 * weight);
      score += pts;

      findings.push({
        itemId: item.id,
        titulo: item.nombre,
        decisionTomada: actionLog.action + " (Partial action)",
        accionCorrecta: item.accion_correcta,
        esCorrecto: true,
        puntos: pts,
        explicacion: "Acceptable with observation: " + item.explicacion_acierto,
        requisitoPci: reqCode,
      });
    } else {
      streak = 0;
      let penalty = 0;
      if (!item.es_infraccion) {
        penalty = 60;
      } else {
        penalty = Math.round(40 * weight);
      }
      score = Math.max(0, score - penalty);

      findings.push({
        itemId: item.id,
        titulo: item.nombre,
        decisionTomada: actionLog.action,
        accionCorrecta: item.accion_correcta,
        esCorrecto: false,
        puntos: -penalty,
        explicacion: item.explicacion_error,
        requisitoPci: reqCode,
      });
    }
  }

  const totalCount = serverItems.length;
  const isPerfect = correctCount === totalCount;
  const perfectBonus = isPerfect ? 500 : 0;
  const timeBonus = isPerfect && timeLeftSeconds > 0 ? timeLeftSeconds * 2 : 0;

  score += perfectBonus + timeBonus;

  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

  let rankLabel = "Major Non-Conformity";
  if (accuracy >= 0.9) rankLabel = "Happy Auditor (Outstanding)";
  else if (accuracy >= 0.75) rankLabel = "Passed with Observations";
  else if (accuracy >= 0.5) rankLabel = "Minor Non-Conformity";

  return {
    sessionId,
    gameType: "AUDITOR",
    score,
    rankLabel,
    correctCount,
    totalCount,
    accuracy,
    breakdown: {
      basePoints: score - perfectBonus - timeBonus,
      comboBonus: 0,
      timeBonus,
      perfectBonus,
      penalties: 0,
    },
    findings,
  };
}

export function evaluateFraudSession(
  sessionId: string,
  serverScenarios: PhishingScenario[],
  actions: SessionActionLog[],
  initialShields: number = 3
): SessionResult {
  let score = 0;
  let streak = 0;
  let shields = initialShields;
  let correctCount = 0;

  const findings: SessionResult["findings"] = [];
  const actionsMap = new Map<string, SessionActionLog>();

  for (const act of actions) {
    if (act.elapsedMs > 0 && act.elapsedMs < 250) {
      act.isCorrect = false;
      score = Math.max(0, score - 100);
      continue;
    }
    actionsMap.set(act.itemId, act);
  }

  for (const scenario of serverScenarios) {
    const actionLog = actionsMap.get(scenario.id);
    const diff = scenario.dificultad || 1;

    const reqPci = scenario.requisitos_pci_ids?.[0]
      ? SEED_PCI_REQUIREMENTS.find((r) => r.id === scenario.requisitos_pci_ids![0])
      : null;
    const reqCode = reqPci ? `${reqPci.code} - ${reqPci.titulo}` : undefined;

    if (!actionLog) {
      if (scenario.es_fraude) {
        shields = Math.max(0, shields - 1);
        score = Math.max(0, score - 200 * diff);
      }
      continue;
    }

    const isCorrect = actionLog.action === scenario.accion_correcta;

    if (isCorrect) {
      correctCount++;
      streak++;
      const streakBonus = streak * 10;
      let pts = 0;

      if (scenario.es_fraude) {
        pts = 100 * diff + streakBonus;
      } else {
        pts = 60 * diff + streakBonus;
      }

      score += pts;
      findings.push({
        itemId: scenario.id,
        titulo: `${scenario.canal} · ${scenario.asunto}`,
        decisionTomada: actionLog.action === "REPORTAR_FRAUDE" ? "Reported as Fraud" : "Allowed as Legitimate",
        accionCorrecta: scenario.accion_correcta === "REPORTAR_FRAUDE" ? "Report as Fraud" : "Allow as Legitimate",
        esCorrecto: true,
        puntos: pts,
        explicacion: scenario.explicacion,
        requisitoPci: reqCode,
      });
    } else {
      streak = 0;
      let penalty = 0;

      if (scenario.es_fraude) {
        shields = Math.max(0, shields - 1);
        penalty = 200 * diff;
      } else {
        penalty = 50;
      }

      score = Math.max(0, score - penalty);
      findings.push({
        itemId: scenario.id,
        titulo: `${scenario.canal} · ${scenario.asunto}`,
        decisionTomada: actionLog.action === "REPORTAR_FRAUDE" ? "Reported as Fraud" : "Allowed as Legitimate",
        accionCorrecta: scenario.accion_correcta === "REPORTAR_FRAUDE" ? "Report as Fraud" : "Allow as Legitimate",
        esCorrecto: false,
        puntos: -penalty,
        explicacion: scenario.explicacion,
        requisitoPci: reqCode,
      });
    }
  }

  if (shields === 3) {
    score += 150;
  }

  const totalCount = serverScenarios.length;
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

  let rankLabel = "Easy Target";
  if (accuracy >= 0.85 && shields >= 2) rankLabel = "Elite Hunter";
  else if (accuracy >= 0.7) rankLabel = "Eagle Eye";
  else if (accuracy >= 0.5) rankLabel = "Vigilant Trainee";

  return {
    sessionId,
    gameType: "FRAUD",
    score,
    rankLabel,
    correctCount,
    totalCount,
    accuracy,
    breakdown: {
      basePoints: score,
      comboBonus: 0,
      timeBonus: 0,
      perfectBonus: shields === 3 ? 150 : 0,
      penalties: 0,
    },
    findings,
  };
}

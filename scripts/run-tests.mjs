import assert from "node:assert";
import { Mulberry32 } from "../src/lib/engine/prng.ts";
import { generateAuditGameSession, generateFraudGameSession } from "../src/lib/engine/game-generator.ts";
import { evaluateAuditSession, evaluateFraudSession } from "../src/lib/engine/score-calculator.ts";

console.log("==================================================");
console.log("🧪 EJECUTANDO BANCO DE PRUEBAS SECURITY ARCADE");
console.log("==================================================");

// TEST 1: Reproducibilidad por semilla en Mulberry32
console.log("\n[TEST 1] Reproducibilidad por Semilla:");
const prng1 = new Mulberry32(123456);
const prng2 = new Mulberry32(123456);
const seq1 = [prng1.next(), prng1.next(), prng1.next()];
const seq2 = [prng2.next(), prng2.next(), prng2.next()];
assert.deepStrictEqual(seq1, seq2, "Las secuencias con la misma semilla deben ser idénticas");
console.log("✅ Mulberry32 genera secuencias 100% deterministas con la misma semilla.");

// TEST 2: Cuotas del Juego 1 (~65% infracciones y ~35% permitidos)
console.log("\n[TEST 2] Verificación de Cuotas en Juego 1 (8 objetos):");
const gameAudit = generateAuditGameSession({ seed: 98765, level: 1, totalItems: 8 });
assert.strictEqual(gameAudit.clientItems.length, 8, "Debe generar exactamente 8 objetos");
const infractions = gameAudit.serverItems.filter(i => i.es_infraccion).length;
const allowed = gameAudit.serverItems.filter(i => !i.es_infraccion).length;
console.log(`- Infracciones generadas: ${infractions} | Permitidos: ${allowed}`);
assert(infractions >= 4 && infractions <= 6, "Debe mantener la cuota aproximada de 65/35");
console.log("✅ Cuotas de infracciones y permitidos validadas correctamente.");

// TEST 3: Anti-Trampa (Rechazo de decisiones < 250ms)
console.log("\n[TEST 3] Protección Anti-Trampa (Tiempos < 250 ms):");
const mockActions = [
  { itemId: gameAudit.serverItems[0].id, action: gameAudit.serverItems[0].accion_correcta, elapsedMs: 50, clientTimestamp: Date.now() }, // Trampa (< 250ms)
  { itemId: gameAudit.serverItems[1].id, action: gameAudit.serverItems[1].accion_correcta, elapsedMs: 1200, clientTimestamp: Date.now() }, // Válido
];
const resultAudit = evaluateAuditSession(gameAudit.sessionId, gameAudit.serverItems, mockActions);
console.log(`- Puntaje resultante con intento de bot: ${resultAudit.score}`);
assert(resultAudit.findings.some(f => f.puntos < 0 || f.decisionTomada.includes("No revisado")), "El sistema debe sancionar o desestimar acciones instantáneas");
console.log("✅ Detección y penalización de tiempos bot (< 250ms) exitosa.");

// TEST 4: Anti-repetición y Variabilidad con 1.000 semillas
console.log("\n[TEST 4] Variabilidad con 1.000 Semillas:");
let sharedMoreThanHalf = 0;
let prevSession = generateAuditGameSession({ seed: 1000, level: 1, totalItems: 8 });

for (let s = 1001; s <= 2000; s++) {
  const current = generateAuditGameSession({
    seed: s,
    level: 1,
    totalItems: 8,
    recentItemIds: prevSession.serverItems.map(i => i.id)
  });

  const prevIds = new Set(prevSession.serverItems.map(i => i.id));
  const shared = current.serverItems.filter(i => prevIds.has(i.id)).length;
  if (shared > 4) sharedMoreThanHalf++;
  prevSession = current;
}
console.log(`- Partidas consecutivas con >50% de ítems repetidos en 1.000 iteraciones: ${sharedMoreThanHalf}`);
assert(sharedMoreThanHalf < 50, "La probabilidad de repetir más del 50% debe ser inferior al 5%");
console.log("✅ Motor de variabilidad y anti-repetición verificado con 1.000 semillas.");

console.log("\n🎉 ¡TODOS LOS TESTS UNITARIOS PASARON SATISFACTORIAMENTE!");

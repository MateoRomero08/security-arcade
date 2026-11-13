/**
 * Generador Pseudoaleatorio Determínico Mulberry32 (32-bit state)
 * 
 * 100% reproducible en Node.js y navegador sin dependencias externas.
 * Con la misma semilla numérica genera exactamente la misma secuencia.
 */
export class Mulberry32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Genera un float pseudoaleatorio en el rango [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Genera un entero en [min, max] inclusive
   */
  nextInt(min: number, max: number): number {
    const fMin = Math.ceil(min);
    const fMax = Math.floor(max);
    return Math.floor(this.next() * (fMax - fMin + 1)) + fMin;
  }

  /**
   * Elige un elemento aleatorio de un arreglo
   */
  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Baraja un arreglo in-place usando el algoritmo Fisher-Yates determinista
   */
  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Selección ponderada (weighted random selection)
   */
  weightedChoice<T extends { weight?: number; peso_aparicion?: number }>(items: T[]): T {
    if (items.length === 0) {
      throw new Error("Items array cannot be empty");
    }
    const weights = items.map(i => i.peso_aparicion ?? i.weight ?? 1.0);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let randomVal = this.next() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      if (randomVal < weights[i]) {
        return items[i];
      }
      randomVal -= weights[i];
    }
    return items[items.length - 1];
  }
}

/**
 * Convierte un string en un entero positivo de 32 bits (para sembrar con UUID o fecha)
 */
export function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}


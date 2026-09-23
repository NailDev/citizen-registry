export type Rng = () => number;

/** Mulberry32: маленький детерминированный генератор — одна и та же запись всегда получается одинаковой. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function int(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

export function weighted<T>(rng: Rng, items: ReadonlyArray<readonly [T, number]>): T {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = rng() * total;
  for (const [value, weight] of items) {
    cursor -= weight;
    if (cursor < 0) return value;
  }
  return (items[items.length - 1] as readonly [T, number])[0];
}

export function digits(rng: Rng, count: number): string {
  let result = '';
  for (let i = 0; i < count; i += 1) result += int(rng, 0, 9);
  return result;
}

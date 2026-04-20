/**
 * XP auto-allocation strategies for the NPC Builder.
 *
 * Design goals:
 * - Strategies are pure functions: same inputs → same outputs.
 * - Adding a new strategy only requires: adding a key to AllocationStrategyKey,
 *   registering its metadata in ALLOCATION_STRATEGIES, and adding a branch
 *   inside allocateXp(). No other files need to change.
 * - All cost arithmetic is delegated to the existing xp-cost.ts helpers so
 *   the WFRP 4e rules stay in one place.
 *
 * Max-advance caps enforced by auto-allocation (sandbox manual editing is uncapped):
 *   - Skills:          MAX_SKILL_ADVANCES = 50
 *   - Characteristics: MAX_CHARACTERISTIC_ADVANCES = 50
 *   - Talents:         MAX_TALENT_RANKS = 10 (absolute; effectiveRankForCost is the floor)
 *
 * Example verifications:
 *   Target 1 000 XP, evenly across 5 skills all starting at 0:
 *     Round 1: each skill costs 10 → 5 × 10 = 50 spent, 950 left, each at 1 advance.
 *     … continues until budget exhausted. At 10 advances each cost 15/adv, etc.
 *
 *   Target 500 XP, evenly across 2 talents starting at effectiveRankForCost = 1 each:
 *     Next cost for each = 100 × 2 = 200. Round 1: talent A +1 (200 spent), talent B +1 (200
 *     spent) = 400 total. Round 2: next cost = 300 each, only 100 left → cannot afford.
 *     Result: each talent at rank 2, unspent = 100.
 */

export type AllocationStrategyKey = 'evenly' | 'cheapest-first';

export interface AllocationStrategyMeta {
  label: string;
  description: string;
}

/** Registered strategies. Iterate this to build dropdowns without hardcoding option lists. */
export const ALLOCATION_STRATEGIES: Record<AllocationStrategyKey, AllocationStrategyMeta> = {
  evenly: {
    label: 'Evenly distribute',
    description:
      'Advances all eligible entries by 1 per round in round-robin order until the budget is spent.',
  },
  'cheapest-first': {
    label: 'Cheapest first',
    description:
      'Always spends on the cheapest next advance first, maximising the total number of advances purchased.',
  },
};

/** Hard caps enforced during auto-allocation (manual sandbox editing is uncapped). */
export const MAX_SKILL_ADVANCES = 50;
export const MAX_CHARACTERISTIC_ADVANCES = 50;
export const MAX_TALENT_RANKS = 10;

/**
 * A single entry that can receive XP during auto-allocation.
 *
 * `start` is the effective baseline value (career + base actor for talents;
 * career-only for skills and characteristics). Allocation advances from here.
 */
export interface AllocatableEntry {
  /** Globally unique key within an allocation run, e.g. "skill:Athletics". */
  key: string;
  /** Category used to group results back into store buckets. */
  category: 'skill' | 'talent' | 'characteristic';
  /** Advance/rank value to start from (effective baseline, not user-edited current). */
  start: number;
  /** Maximum allowed advance/rank value (inclusive). */
  max: number;
  /**
   * Total XP cost from advance 0 up to n advances/ranks.
   * Used to compute marginal cost as getCostUpTo(n+1) − getCostUpTo(n).
   */
  getCostUpTo: (n: number) => number;
}

export interface AllocationResult {
  /** Final advance/rank value for every entry that was passed in, keyed by entry.key. */
  values: Record<string, number>;
  /** XP budget not consumed because all entries hit their cap or no advance was affordable. */
  unspent: number;
}

function marginalCost(entry: AllocatableEntry, current: number): number {
  if (current >= entry.max) return Infinity;
  return entry.getCostUpTo(current + 1) - entry.getCostUpTo(current);
}

/**
 * Applies the selected allocation strategy and returns the resulting values plus
 * any unspent XP. Entries start from their `start` value; results may be higher.
 *
 * This function is pure: it does not mutate the store.
 */
export function allocateXp(
  entries: AllocatableEntry[],
  budget: number,
  strategy: AllocationStrategyKey,
): AllocationResult {
  // Working copy
  const values: Record<string, number> = {};
  for (const entry of entries) {
    values[entry.key] = entry.start;
  }

  let remaining = Math.max(0, Math.floor(budget));

  if (strategy === 'evenly') {
    // Round-robin: each pass tries to advance every entry by exactly 1.
    // Stops when no entry could be advanced in a full pass (all at cap or too expensive).
    let progress = true;
    while (progress && remaining > 0) {
      progress = false;
      for (const entry of entries) {
        const current = values[entry.key]!;
        const cost = marginalCost(entry, current);
        if (Number.isFinite(cost) && cost <= remaining) {
          values[entry.key] = current + 1;
          remaining -= cost;
          progress = true;
        }
      }
    }
  } else {
    // cheapest-first: repeatedly find the entry whose next advance is cheapest.
    // Tie-break alphabetically by key for determinism.
    let progress = true;
    while (progress && remaining > 0) {
      progress = false;
      let bestEntry: AllocatableEntry | null = null;
      let bestCost = Infinity;

      for (const entry of entries) {
        const cost = marginalCost(entry, values[entry.key]!);
        if (
          cost < bestCost ||
          (cost === bestCost && bestEntry !== null && entry.key < bestEntry.key)
        ) {
          bestCost = cost;
          bestEntry = entry;
        }
      }

      if (bestEntry !== null && Number.isFinite(bestCost) && bestCost <= remaining) {
        values[bestEntry.key] = values[bestEntry.key]! + 1;
        remaining -= bestCost;
        progress = true;
      }
    }
  }

  return { values, unspent: remaining };
}

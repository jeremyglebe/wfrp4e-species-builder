/**
 * WFRP 4e XP cost helpers for NPC Builder manual advancement editing.
 *
 * Rules implemented exactly as specified in the feature prompt.
 */

function getSkillBandCost(step: number): number {
  if (step <= 5) return 10;
  if (step <= 10) return 15;
  if (step <= 15) return 20;
  if (step <= 20) return 30;
  if (step <= 25) return 40;
  if (step <= 30) return 60;
  if (step <= 35) return 80;
  if (step <= 40) return 110;
  if (step <= 45) return 140;
  return 180;
}

function getCharacteristicBandCost(step: number): number {
  if (step <= 5) return 25;
  if (step <= 10) return 30;
  if (step <= 15) return 40;
  if (step <= 20) return 50;
  if (step <= 25) return 70;
  if (step <= 30) return 90;
  if (step <= 35) return 120;
  if (step <= 40) return 150;
  if (step <= 45) return 190;
  return 230;
}

function toSafeNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function getSkillXpCost(advances: number): number {
  const clampedAdvances = toSafeNonNegativeInteger(advances);
  let totalCost = 0;

  for (let step = 1; step <= clampedAdvances; step += 1) {
    totalCost += getSkillBandCost(step);
  }

  return totalCost;
}

export function getCharacteristicXpCost(advances: number): number {
  const clampedAdvances = toSafeNonNegativeInteger(advances);
  let totalCost = 0;

  for (let step = 1; step <= clampedAdvances; step += 1) {
    totalCost += getCharacteristicBandCost(step);
  }

  return totalCost;
}

export function getTalentXpCost(level: number): number {
  const clampedLevel = toSafeNonNegativeInteger(level);
  let totalCost = 0;

  for (let nextRank = 1; nextRank <= clampedLevel; nextRank += 1) {
    totalCost += 100 * nextRank;
  }

  return totalCost;
}

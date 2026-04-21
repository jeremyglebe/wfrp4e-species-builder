import type { DiceString } from '../../utils/DiceString';

export interface Definition_SpeciesCharacteristics {
  ws: DiceString; // Weapon Skill
  bs: DiceString; // Ballistic Skill
  s: DiceString; // Strength
  t: DiceString; // Toughness
  i: DiceString; // Initiative
  ag: DiceString; // Agility
  dex: DiceString; // Dexterity
  int: DiceString; // Intelligence
  wp: DiceString; // Willpower
  fel: DiceString; // Fellowship
} // WFRP characteristic formulas keyed by system short codes.

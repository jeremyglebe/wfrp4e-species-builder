import type { DiceString } from '../../strings/DiceString';

export interface Definition_SpeciesCharacteristics {
  readonly ws: DiceString; // Weapon Skill
  readonly bs: DiceString; // Ballistic Skill
  readonly s: DiceString; // Strength
  readonly t: DiceString; // Toughness
  readonly i: DiceString; // Initiative
  readonly ag: DiceString; // Agility
  readonly dex: DiceString; // Dexterity
  readonly int: DiceString; // Intelligence
  readonly wp: DiceString; // Willpower
  readonly fel: DiceString; // Fellowship
} // WFRP characteristic formulas keyed by system short codes.

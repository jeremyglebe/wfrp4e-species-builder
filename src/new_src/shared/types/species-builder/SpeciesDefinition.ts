import type { DiceString } from '../utils/DiceString';
import type { Definition_SpeciesCharacteristics } from '../wfrp4e/config/Definition_SpeciesCharacteristics';
import type { RandomTalentsEntry } from './RandomTalentsDefinition';
import type { SubspeciesDefinition } from './SubspeciesDefinition';

export interface SpeciesDefinition {
  // Properties defined as Item *names*, rather than any unique identifier, will be queried and resolved at runtime.
  // This is a feature of the system and cannot be reasonably changed.
  // This does mean that Items with duplicate names are resolved arbitrarily.

  // Unique identifier for the species, frequently used as a key in data structures.
  id: string;

  // The display name of the species, shown in the UI (such as the Character Creation window).
  name: string;

  characteristics: Definition_SpeciesCharacteristics;

  // Names of skills the species can get at creation
  skills: string[];

  // Talents can be selected at character creation or randomly generated.
  // Randomly generated talents use tables in the world,
  //   so they are defined as keys and counts. (Though there is also a default table)
  // Selection-based talents are given as arrays of options (string names of talents)
  talents: {
    // List of selection groups
    selections: Array<
      // List of options within a selection group
      Array<string> // Values are names of talents that can be selected
    >;
    random: Array<RandomTalentsEntry>;
  };

  // Names of traits the species gets at creation
  traits?: string[];

  // Standard movement speed of the species
  movement: number;

  // Meta currency
  fate: number;
  resilience: number;
  extra: number;

  age: {
    minimum: number;
    // Roll formula for random age generation, e.g. "2d10" or "1d20+2".
    roll: DiceString;
  };

  height: {
    minimum: {
      feet: number;
      inches: number;
    };
    // Roll formula for random height generation, e.g. "2d10" or "1d20+2".
    roll: DiceString;
  };

  // Show in character creation section intended for selectable, non-rollable species.
  extraSpecies?: boolean;

  // Child species that inherit, modify, and override properties of the parent species.
  subspecies?: Array<SubspeciesDefinition>;

  // Usually species don't need to replace talents or careers- since they are specific to the species
  // Probably skip these properties, even if they're supported by the game system.
  // talentReplacement?:
  // careerReplacements?:
}

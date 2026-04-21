import type { Definition_SpeciesCharacteristics } from './wfrp4e/config/Definition_SpeciesCharacteristics';

export interface SpeciesDefinition {
  // Properties defined as Item *names*, rather than any unique identifier, will be queried and resolved at runtime.
  // This is a feature of the system and cannot be reasonably changed.
  // This does mean that Items with duplicate names are resolved arbitrarily.

  id: string; // Unique identifier for the species, frequently used as a key in data structures.
  name: string; // The display name of the species, shown in the UI (such as the Character Creation window).
  characteristics: Definition_SpeciesCharacteristics;
  skills: string[]; // Names of skills the species can get at creation
  talents: {
    // list of selection groups
    selections: Array<
      // list of options within a selection group
      Array<string> // values are names of talents that can be selected
    >;
    random: {
      count: number; // Number of random talents to select.
      options: string[]; // Names of talents to randomly select from
    };
  };
  traits?: string[]; // Names of traits the species gets at creation
  movement: number;
  fate: number;
  resilience: number;
  extra: number;
  age: {
    minimum: number;
    roll: string; // Roll formula for random age generation, e.g. "2d10" or "1d20+2".
  };
  height: {
    minimum: {
      feet: number;
      inches: number;
    };
    roll: string; // Roll formula for random height generation, e.g. "2d10" or "1d20+2".
  };
  extraSpecies?: boolean; // Show in character creation section intended for selectable, non-rollable species.
  // subspecies?:

  // Usually species don't need to replace talents or careers- since they are specific to the species
  // We can probably skip these properties, even if they're supported.
  // talentReplacement?:
  // careerReplacements?:
}

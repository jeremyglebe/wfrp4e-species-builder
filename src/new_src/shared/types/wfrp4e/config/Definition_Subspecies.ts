import type { Definition_RandomTalents } from './Definition_RandomTalents';
import type { Definition_SpeciesCharacteristics } from './Definition_SpeciesCharacteristics';

export interface Definition_Subspecies {
  name: string;
  characteristics?: Definition_SpeciesCharacteristics;
  skills?: string[];
  talents?: string[];
  // This is documented as speciesTraits here:
  // https://moo-man.github.io/WFRP4e-FoundryVTT/pages/advanced/species.html
  // but in practice and in reviewing the existing config (via dev tools) this was a typo.
  // Subspecies override definitions from speciesTraits with the traits property.
  // Examples found in: game.wfrp4e.config.subspecies.familiar (Winds of Magic)
  traits?: string[];
  randomTalents?: Definition_RandomTalents;
  talentReplacement?: Record<string, string>;
  movement?: number;
  fate?: number;
  res?: number;
  extra?: number;
  // Undocumented Property: careerTable
  // Not documented in the Custom Speices docs, but found in existing config.
  // This property is the key of the table which should be used to roll the subspecies' career.
  // This overrides the usual behavior of career tables needing to be keyed by the species' id.
  // Examples found in game.wfrp4e.config.subspecies.dwarf (Dwarf Bundle)
  careerTable?: string;
  // Properties to test later.
  // Can these be overriden by subspecies?
  // age?: string;
  // height?: Definition_SpeciesHeight;
}

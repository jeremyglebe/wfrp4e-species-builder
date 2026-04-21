import type { Definition_SpeciesCharacteristics } from './Definition_SpeciesCharacteristics';
import type { Definition_RandomTalents } from './Definition_RandomTalents';
import type { Definition_Subspecies } from './Definition_Subspecies';
import type { Definition_SpeciesHeight } from './Definition_SpeciesHeight';

export interface ConfigFragment_Species {
  readonly species: Record<string, string>; // species ids -> species names
  readonly speciesCharacteristics: Record<string, Definition_SpeciesCharacteristics>; // species ids -> characteristic formulas
  readonly speciesSkills: Record<string, string[]>; // species ids -> species skills
  readonly speciesTalents: Record<string, string[]>; // species ids -> species talents
  readonly speciesRandomTalents: Record<string, Definition_RandomTalents>; // species ids -> random talent definitions
  readonly speciesTalentReplacement: Record<string, Record<string, string>>; // species ids -> replaced talent name -> replacement talent name
  readonly speciesTraits: Record<string, string[]>; // species ids -> species traits
  readonly speciesMovement: Record<string, number>; // species ids -> movement characteristic
  readonly speciesFate: Record<string, number>; // species ids -> fate points
  readonly speciesRes: Record<string, number>; // species ids -> resilience points
  readonly speciesExtra: Record<string, number>; // species ids -> extra points
  readonly speciesAge: Record<string, string>; // species ids -> age roll formula
  readonly speciesHeight: Record<string, Definition_SpeciesHeight>; // species ids -> height definitions
  readonly extraSpecies: Array<string>; // species ids that should be put in the "extra species" ui section
  readonly subspecies: Record<string, Record<string, Definition_Subspecies>>; // species ids -> subspecies ids -> subspecies definitions
  // The same documentation that talks about this property says it's bad to edit it this way, so we will skip it.
  // speciesCareerReplacements:
}

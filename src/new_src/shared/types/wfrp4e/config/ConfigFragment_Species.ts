import type { Definition_SpeciesCharacteristics } from './Definition_SpeciesCharacteristics';
import type { Definition_RandomTalents } from './Definition_RandomTalents';
import type { Definition_Subspecies } from './Definition_Subspecies';
import type { Definition_SpeciesHeight } from './Definition_SpeciesHeight';

export interface ConfigFragment_Species {
  species: Record<string, string>; // species ids -> species names
  speciesCharacteristics: Record<string, Definition_SpeciesCharacteristics>; // species ids -> characteristic formulas
  speciesSkills: Record<string, string[]>; // species ids -> species skills
  speciesTalents: Record<string, string[]>; // species ids -> species talents
  speciesRandomTalents: Record<string, Definition_RandomTalents>; // species ids -> random talent definitions
  speciesTalentReplacement: Record<string, Record<string, string>>; // species ids -> replaced talent name -> replacement talent name
  speciesTraits: Record<string, string[]>; // species ids -> species traits
  speciesMovement: Record<string, number>; // species ids -> movement characteristic
  speciesFate: Record<string, number>; // species ids -> fate points
  speciesRes: Record<string, number>; // species ids -> resilience points
  speciesExtra: Record<string, number>; // species ids -> extra points
  speciesAge: Record<string, string>; // species ids -> age roll formula
  speciesHeight: Record<string, Definition_SpeciesHeight>; // species ids -> height definitions
  extraSpecies: Array<string>; // species ids that should be put in the "extra species" ui section
  subspecies: Record<string, Record<string, Definition_Subspecies>>; // species ids -> subspecies ids -> subspecies definitions
  // The same documentation that talks about this property says it's bad to edit it this way, so we will skip it.
  // speciesCareerReplacements:
}

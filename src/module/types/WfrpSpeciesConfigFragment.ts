import type { SpeciesCharacteristics } from './SpeciesCharacteristics';
import type { SpeciesHeight } from './SpeciesHeight';
import type { WfrpSubspeciesConfig } from './WfrpSubspeciesConfig';

/**
 * Split runtime config buckets expected by WFRP4e.
 *
 * The injection service creates this structure from module-native species
 * definitions, then merges it into game.wfrp4e.config.
 */
export interface WfrpSpeciesConfigFragment {
  species: Record<string, string>;
  speciesCharacteristics: Record<string, SpeciesCharacteristics>;
  speciesSkills: Record<string, string[]>;
  speciesTalents: Record<string, string[]>;
  speciesRandomTalents: Record<string, Record<string, number>>;
  speciesTalentReplacement: Record<string, Record<string, string>>;
  speciesTraits: Record<string, string[]>;
  speciesMovement: Record<string, number>;
  speciesFate: Record<string, number>;
  speciesRes: Record<string, number>;
  speciesExtra: Record<string, number>;
  speciesAge: Record<string, string>;
  speciesHeight: Record<string, SpeciesHeight>;
  speciesCareerReplacements: Record<string, Record<string, string[]>>;
  extraSpecies: string[];
  subspecies: Record<string, Record<string, WfrpSubspeciesConfig>>;
}

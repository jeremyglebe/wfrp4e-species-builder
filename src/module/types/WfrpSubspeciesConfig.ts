import type { SpeciesCharacteristics } from './SpeciesCharacteristics';

/**
 * Subspecies shape expected by WFRP config under
 * config.subspecies[speciesKey][subspeciesKey].
 */
export interface WfrpSubspeciesConfig {
  name?: string;
  characteristics?: SpeciesCharacteristics;
  skills?: string[];
  talents?: string[];
  randomTalents?: Record<string, number>;
  talentReplacement?: Record<string, string>;
  traits?: string[];
  movement?: number;
  fate?: number;
  resilience?: number;
  extra?: number;
}

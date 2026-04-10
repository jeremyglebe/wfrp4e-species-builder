import type { SpeciesCharacteristics } from './SpeciesCharacteristics';

/**
 * Module-native subspecies definition stored under a species.
 *
 * Subspecies may define only override fields. Undefined values fall back
 * to parent species values during chargen.
 */
export interface CustomSubspeciesDefinition {
  id: string;
  name: string;
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

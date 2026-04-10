import type { CustomSubspeciesDefinition } from './CustomSubspeciesDefinition';
import type { SpeciesCharacteristics } from './SpeciesCharacteristics';
import type { SpeciesHeight } from './SpeciesHeight';

/**
 * Module-native species definition used by settings storage and the editor UI.
 *
 * This is the module source-of-truth model. WFRP runtime config remains an
 * adapter target generated from this data at init.
 */
export interface CustomSpeciesDefinition {
  id: string;
  name: string;
  characteristics: SpeciesCharacteristics;
  skills: string[];
  talents: string[];
  randomTalents?: Record<string, number>;
  talentReplacement?: Record<string, string>;
  traits?: string[];
  movement: number;
  fate: number;
  resilience: number;
  extra: number;
  age?: string;
  height?: SpeciesHeight;
  careerReplacements?: Record<string, string[]>;
  extraSpecies?: boolean;
  subspecies?: Record<string, CustomSubspeciesDefinition>;
}

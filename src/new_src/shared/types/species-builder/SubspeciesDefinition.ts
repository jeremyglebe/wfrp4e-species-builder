import type { Definition_SpeciesCharacteristics } from '../wfrp4e/config/Definition_SpeciesCharacteristics';

export interface SubspeciesDefinition {
  readonly name: string;
  readonly characteristics?: Partial<Definition_SpeciesCharacteristics>;
  readonly skills?: {
    readonly added?: string[]; // skill names added to the subspecies
    readonly removed?: string[]; // skill names removed from the species
    readonly override?: string[]; // replaces the entire array- ignores added and removed if present
  };
  readonly talents?: {
    readonly selections?: {
      readonly added?: Array<Array<string>>; // talent selection groups added to the subspecies
      readonly removed?: Array<Array<string>>; // talent selection groups removed from the species
      readonly override?: Array<Array<string>>; // replaces the entire array- ignores added and removed if present
    };
    readonly random?: {
      readonly count?: number;
      readonly options?: {
        readonly added?: string[]; // talents added to the subspecies' random talents pool
        readonly removed?: string[]; // talents removed from the species' random talents pool
        readonly override?: string[]; // replaces the entire array- ignores added and removed if present
      };
    };
  };
  readonly traits?: {
    readonly added?: string[]; // trait names added to the subspecies
    readonly removed?: string[]; // trait names removed from the species
    readonly override?: string[]; // replaces the entire array- ignores added and removed if present
  };
  readonly movement?: number;
  readonly fate?: number;
  readonly resilience?: number;
  readonly extra?: number;
  readonly careerTableKey?: string; // The subspecies can override the species' career table as well (which is usually keyed by the species id)
  // talentReplacement?:
}

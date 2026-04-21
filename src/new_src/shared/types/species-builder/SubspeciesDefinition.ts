import type { Definition_SpeciesCharacteristics } from '../wfrp4e/config/Definition_SpeciesCharacteristics';

export interface SubspeciesDefinition {
  name: string;
  characteristics?: Partial<Definition_SpeciesCharacteristics>;
  skills?: {
    added?: string[]; // skill names added to the subspecies
    removed?: string[]; // skill names removed from the species
    override?: string[]; // replaces the entire array- ignores added and removed if present
  };
  talents?: {
    selections?: {
      added?: Array<Array<string>>; // talent selection groups added to the subspecies
      removed?: Array<Array<string>>; // talent selection groups removed from the species
      override?: Array<Array<string>>; // replaces the entire array- ignores added and removed if present
    };
    random?: {
      count?: number;
      options?: {
        added?: string[]; // talents added to the subspecies' random talents pool
        removed?: string[]; // talents removed from the species' random talents pool
        override?: string[]; // replaces the entire array- ignores added and removed if present
      };
    };
  };
  traits?: {
    added?: string[]; // trait names added to the subspecies
    removed?: string[]; // trait names removed from the species
    override?: string[]; // replaces the entire array- ignores added and removed if present
  };
  movement?: number;
  fate?: number;
  resilience?: number;
  extra?: number;
  careerTableKey?: string; // The subspecies can override the species' career table as well (which is usually keyed by the species id)
  // talentReplacement?:
}

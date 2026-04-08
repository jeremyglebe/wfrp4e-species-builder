export const MODULE_ID = 'wfrp4e-species-builder';

export const CUSTOM_SPECIES_SETTING_KEY = 'customSpeciesDefinitions';

/**
 * WFRP characteristic formulas keyed by the short codes used by the system.
 */
export interface SpeciesCharacteristics {
  ws: string;
  bs: string;
  s: string;
  t: string;
  i: string;
  ag: string;
  dex: string;
  int: string;
  wp: string;
  fel: string;
}

/**
 * Height structure used by WFRP species config.
 * Example: 5'2" + 1d10"
 */
export interface SpeciesHeight {
  die: string;
  feet: number;
  inches: number;
}

/**
 * Module-native subspecies definition.
 *
 * Subspecies override only the fields they define. Any undefined fields
 * should fall back to the parent species during WFRP chargen.
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

/**
 * Module-native species definition.
 *
 * This is the primary structure for storage in world settings and editing
 * in the builder UI. It is intentionally cohesive and friendly to edit,
 * even though WFRP's runtime config splits these values across many objects.
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
  /**
   * If true, push this species key into game.wfrp4e.config.extraSpecies so it
   * appears in Chargen for manual selection without necessarily being rollable.
   */
  extraSpecies?: boolean;
  subspecies?: Record<string, CustomSubspeciesDefinition>;
}

/**
 * Top-level storage object for world settings.
 * Keeping this wrapped gives us room for versioning and migrations later.
 */
export interface CustomSpeciesSettingsData {
  version: number;
  species: CustomSpeciesDefinition[];
}

/**
 * WFRP runtime config fragment shape produced by the transform layer.
 * This mirrors the split config buckets expected by the system.
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

/**
 * WFRP subspecies shape nested under config.subspecies[speciesKey][subspeciesKey].
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

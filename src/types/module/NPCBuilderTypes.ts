/**
 * Configuration settings for the NPC Builder.
 */
export interface NPCBuilderSettings {
  /** Whether to append the actor's species name to the generated NPC name */
  includeSpeciesInName: boolean;
  /** Whether to automatically add lower-level careers from the same career group when adding a career */
  autoAddLowerCareers: boolean;
  /** Whether to run AI image enhancement on the final portrait after build */
  enhanceImage: boolean;
  /** Whether to generate a circular token texture from the final portrait */
  circularToken: boolean;
  /** Name of the folder containing base actor templates */
  baseFolderName: string;
  /** Name of the folder where generated NPCs will be created */
  outputFolderName: string;
  /** Whether base actor skills may appear as upgradeable entries in the advancement tab */
  allowUpgradeBaseSkills: boolean;
  /** Whether base actor characteristics may appear as upgradeable entries in the advancement tab */
  allowUpgradeBaseCharacteristics: boolean;
  /** Whether base actor talents may appear as upgradeable entries in the advancement tab */
  allowUpgradeBaseTalents: boolean;
  /** Whether base actor trappings may appear as editable entries in the trappings tab */
  allowUpgradeBaseTrappings: boolean;
}

/**
 * A base actor option available for selection in the UI.
 * Represents an actor that exists in the base folder.
 */
export interface BaseActorOption {
  /** Unique Foundry actor ID */
  id: string;
  /** Display name of the actor */
  name: string;
  /** URL to the actor's artwork image */
  img: string;
  /** Species/ancestry/race label used by preview naming */
  species: string;
}

/**
 * A base actor that has been explicitly selected via drag-and-drop override.
 * Takes priority over the dropdown selection.
 */
export interface BaseActorOverride {
  /** Unique Foundry actor ID */
  id: string;
  /** Foundry UUID for resolving the actor across world/compendium boundaries */
  uuid: string;
  /** Display name of the actor */
  name: string;
  /** URL to the actor's artwork image */
  img: string;
  /** Species/ancestry/race label used by preview naming */
  species: string;
}

/**
 * A career that has been added to the build queue.
 * Tracks the career details and how many times it should be added to the NPC.
 */
export interface CareerEntry {
  /** Display name of the career */
  name: string;
  /** Foundry UUID for resolving the career item across world/compendium boundaries */
  uuid: string;
  /** URL to the career's artwork image */
  img: string;
  /** The career group/path this career belongs to (e.g., "Warrior", "Wizard") */
  careergroup: string;
  /** The advancement level of this career (e.g., 1, 2, 3), or null if not applicable */
  level: number | null;
  /** How many times this career should be added to the generated NPC */
  quantity: number;
}

/**
 * A career indexed from world items or compendiums, with source tracking.
 * Used internally by the career index service.
 */
export interface IndexedCareer {
  /** Foundry UUID for resolving the career item */
  uuid: string;
  /** Display name of the career */
  name: string;
  /** URL to the career's artwork image */
  img: string;
  /** The career group/path this career belongs to */
  careergroup: string;
  /** The advancement level of this career, or null if not applicable */
  level: number | null;
  /** Where this career was found: 'world' for world items, or compendium name/ID for compendium items */
  source: string;
}

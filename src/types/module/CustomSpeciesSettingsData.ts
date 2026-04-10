import type { CustomSpeciesDefinition } from './CustomSpeciesDefinition';

/**
 * Settings payload shape stored in Foundry world settings.
 */
export interface CustomSpeciesSettingsData {
  version: number;
  species: CustomSpeciesDefinition[];
}

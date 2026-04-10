import type { CustomSpeciesDefinition, CustomSpeciesSettingsData } from '../types';
import { Data } from './data-service';

/**
 * Foundry settings boundary for species storage.
 *
 * This service owns registration and persistence of the module-native model.
 * Stored data remains a cohesive species object array, not WFRP's split
 * runtime shape.
 */
export const MODULE_ID = 'wfrp4e-species-builder';
export const CUSTOM_SPECIES_SETTING_KEY = 'customSpeciesDefinitions';
export const SETTINGS_SCHEMA_VERSION = 1;

declare global {
  interface SettingConfig {
    'wfrp4e-species-builder.customSpeciesDefinitions': CustomSpeciesSettingsData;
  }
}

export const Settings = {
  register,
  loadCustomSpeciesDefinitions,
  saveCustomSpeciesDefinitions,
} as const;

function register(): void {
  game?.settings?.register(MODULE_ID, CUSTOM_SPECIES_SETTING_KEY, {
    name: 'Custom Species Definitions',
    hint: 'Internal storage for WFRP4e Species Builder custom species.',
    scope: 'world',
    config: false,
    default: Data.Empty.CustomSpeciesSettingsData(),
  });
}

function loadCustomSpeciesDefinitions(): CustomSpeciesDefinition[] {
  const rawValue = game?.settings?.get(MODULE_ID, CUSTOM_SPECIES_SETTING_KEY) as
    | Partial<CustomSpeciesSettingsData>
    | undefined;

  const fallback = Data.Empty.CustomSpeciesSettingsData();

  if (!rawValue || typeof rawValue !== 'object') {
    return fallback.species;
  }

  if (!Array.isArray(rawValue.species)) {
    return fallback.species;
  }

  return rawValue.species;
}

async function saveCustomSpeciesDefinitions(species: CustomSpeciesDefinition[]): Promise<void> {
  await game?.settings?.set(MODULE_ID, CUSTOM_SPECIES_SETTING_KEY, {
    version: SETTINGS_SCHEMA_VERSION,
    species,
  });
}

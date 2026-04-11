import type {
  CustomSpeciesDefinition,
  CustomSpeciesSettingsData,
  NPCBuilderSettings,
} from '../../types/module';
import { Data } from './data-service';
import { getDefaultNPCBuilderSettings } from './npc-builder-settings';

/**
 * Foundry settings boundary for species storage.
 *
 * This service owns registration and persistence of the module-native model.
 * Stored data remains a cohesive species object array, not WFRP's split
 * runtime shape.
 */
export const MODULE_ID = 'wfrp4e-species-builder';
export const CUSTOM_SPECIES_SETTING_KEY = 'customSpeciesDefinitions';
export const NPC_BUILDER_SETTINGS_KEY = 'npcBuilderSettings';
export const SETTINGS_SCHEMA_VERSION = 1;

declare global {
  interface SettingConfig {
    'wfrp4e-species-builder.customSpeciesDefinitions': CustomSpeciesSettingsData;
    'wfrp4e-species-builder.npcBuilderSettings': NPCBuilderSettings;
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

  game?.settings?.register(MODULE_ID, NPC_BUILDER_SETTINGS_KEY, {
    name: 'NPC Builder Settings',
    hint: 'Internal storage for WFRP4e NPC Builder settings.',
    scope: 'world',
    config: false,
    default: getDefaultNPCBuilderSettings(),
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

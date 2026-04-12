import type {
  AggregateItemBuilderSettings,
  CustomSpeciesDefinition,
  CustomSpeciesSettingsData,
  EffectToItemBuilderSettings,
  NPCBuilderSettings,
} from '../../../types/module';
import { Data } from '../data-service';
import {
  AGGREGATE_ITEM_BUILDER_SETTINGS_KEY,
  getDefaultAggregateItemBuilderSettings,
} from './aggregate-items';
import {
  EFFECT_TO_ITEM_BUILDER_SETTINGS_KEY,
  getDefaultEffectToItemBuilderSettings,
} from './effect-items';
import { getDefaultNPCBuilderSettings, NPC_BUILDER_SETTINGS_KEY } from './npcs';

/**
 * Foundry settings boundary for module storage.
 */
export const MODULE_ID = 'wfrp4e-species-builder';
export const CUSTOM_SPECIES_SETTING_KEY = 'customSpeciesDefinitions';
export const SETTINGS_SCHEMA_VERSION = 1;

declare global {
  interface SettingConfig {
    'wfrp4e-species-builder.customSpeciesDefinitions': CustomSpeciesSettingsData;
    'wfrp4e-species-builder.npcBuilderSettings': NPCBuilderSettings;
    'wfrp4e-species-builder.aggregateItemBuilderSettings': AggregateItemBuilderSettings;
    'wfrp4e-species-builder.effectToItemBuilderSettings': EffectToItemBuilderSettings;
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

  game?.settings?.register(MODULE_ID, AGGREGATE_ITEM_BUILDER_SETTINGS_KEY, {
    name: 'Aggregate Item Builder Settings',
    hint: 'Internal storage for WFRP4e Aggregate Item Builder settings.',
    scope: 'world',
    config: false,
    default: getDefaultAggregateItemBuilderSettings(),
  });

  game?.settings?.register(MODULE_ID, EFFECT_TO_ITEM_BUILDER_SETTINGS_KEY, {
    name: 'Effect to Item Builder Settings',
    hint: 'Internal storage for WFRP4e Effect to Item Builder settings.',
    scope: 'world',
    config: false,
    default: getDefaultEffectToItemBuilderSettings(),
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

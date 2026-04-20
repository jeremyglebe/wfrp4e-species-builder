import { MODULE_ID } from '.';

import type {
  AggregateItemBuilderSettings as AggregateItemsSettingsConfig,
  CustomSpeciesSettingsData as CustomSpeciesSettingsConfig,
  EffectToItemBuilderSettings as EffectItemsSettingsConfig,
  NPCBuilderSettings as NpcBuilderSettingsConfig,
} from '@/types/module';

import { CUSTOM_SPECIES_SETTING_KEY } from './species';
import { getDefaultNPCBuilderSettings, NPC_BUILDER_SETTINGS_KEY } from './npcs';
import {
  AGGREGATE_ITEM_BUILDER_SETTINGS_KEY,
  getDefaultAggregateItemBuilderSettings,
} from './aggregate-items';
import {
  EFFECT_TO_ITEM_BUILDER_SETTINGS_KEY,
  getDefaultEffectToItemBuilderSettings,
} from './effect-items';
import { FactoryService } from '../factory';

declare global {
  interface SettingConfig {
    'wfrp4e-species-builder.customSpeciesDefinitions': CustomSpeciesSettingsConfig;
    'wfrp4e-species-builder.npcBuilderSettings': NpcBuilderSettingsConfig;
    'wfrp4e-species-builder.aggregateItemBuilderSettings': AggregateItemsSettingsConfig;
    'wfrp4e-species-builder.effectToItemBuilderSettings': EffectItemsSettingsConfig;
  }
}

export function register(): void {
  game?.settings?.register(MODULE_ID, CUSTOM_SPECIES_SETTING_KEY, {
    name: 'Custom Species Definitions',
    hint: 'Internal storage for WFRP4e Species Builder custom species.',
    scope: 'world',
    config: false,
    default: FactoryService.Empty.CustomSpeciesSettingsData(),
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

import { MODULE_NAMESPACE } from '.';

// Types modeling the settings for each of the builders
import type {
  AggregateItemBuilderSettings as AggregateItemsSettingsConfig,
  CustomSpeciesSettingsData as CustomSpeciesSettingsConfig,
  EffectItemsSettingsConfig,
  NPCBuilderSettings as NpcBuilderSettingsConfig,
} from '@/types/module';

// Settings keys for each of the builders, used to register
// their settings under the module's namespace.
import { SETTINGS_KEY as SPECIES_BUILDER_KEY } from './species';
import { SETTINGS_KEY as NPC_BUILDER_KEY } from './npcs';
import { SETTINGS_KEY as AGGREGATE_ITEMS_KEY } from './aggregate-items';
import { SETTINGS_KEY as EFFECT_ITEMS_KEY } from './effect-items';

// Factories for default and empty settings data.
import { FactoryService } from '../factory';

// Prefixed keys for type extension on the SettingConfig global interface.
const SPECIES_BUILDER_PREFIXED_KEY = `${MODULE_NAMESPACE}.${SPECIES_BUILDER_KEY}`;
const NPC_BUILDER_PREFIXED_KEY = `${MODULE_NAMESPACE}.${NPC_BUILDER_KEY}`;
const AGGREGATE_ITEMS_PREFIXED_KEY = `${MODULE_NAMESPACE}.${AGGREGATE_ITEMS_KEY}`;
const EFFECT_ITEMS_PREFIXED_KEY = `${MODULE_NAMESPACE}.${EFFECT_ITEMS_KEY}`;

declare global {
  interface SettingConfig {
    [SPECIES_BUILDER_PREFIXED_KEY]: CustomSpeciesSettingsConfig;
    [NPC_BUILDER_PREFIXED_KEY]: NpcBuilderSettingsConfig;
    [AGGREGATE_ITEMS_PREFIXED_KEY]: AggregateItemsSettingsConfig;
    [EFFECT_ITEMS_PREFIXED_KEY]: EffectItemsSettingsConfig;
  }
}

export function register(): void {
  game?.settings?.register(MODULE_NAMESPACE, SPECIES_BUILDER_KEY, {
    name: 'Custom Species Definitions',
    hint: 'Internal storage for WFRP4e Species Builder custom species.',
    scope: 'world',
    config: false,
    default: FactoryService.Empty.CustomSpeciesSettingsData(),
  });

  game?.settings?.register(MODULE_NAMESPACE, NPC_BUILDER_KEY, {
    name: 'NPC Builder Settings',
    hint: 'Internal storage for WFRP4e NPC Builder settings.',
    scope: 'world',
    config: false,
    default: FactoryService.Default.NPCBuilderSettings(),
  });

  game?.settings?.register(MODULE_NAMESPACE, AGGREGATE_ITEMS_KEY, {
    name: 'Aggregate Item Builder Settings',
    hint: 'Internal storage for WFRP4e Aggregate Item Builder settings.',
    scope: 'world',
    config: false,
    default: FactoryService.Default.AggregateItemBuilderSettings(),
  });

  game?.settings?.register(MODULE_NAMESPACE, EFFECT_ITEMS_KEY, {
    name: 'Effect to Item Builder Settings',
    hint: 'Internal storage for WFRP4e Effect to Item Builder settings.',
    scope: 'world',
    config: false,
    default: FactoryService.Default.EffectItemsSettingsConfig(),
  });
}

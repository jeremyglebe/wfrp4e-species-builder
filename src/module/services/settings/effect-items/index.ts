import type { EffectItemsSettingsConfig } from '../../../../shared/types/module';
import { getAllowedCarrierTypes } from '../aggregate-items';
import { MODULE_NAMESPACE } from '..';
import { FactoryService } from '../../factory';

export const SETTINGS_KEY = 'effectToItemBuilderSettings';

export function loadEffectToItemBuilderSettings(): EffectItemsSettingsConfig {
  const defaults = FactoryService.Default.EffectItemsSettingsConfig();
  const saved = game?.settings?.get(MODULE_NAMESPACE, SETTINGS_KEY) as
    | Partial<EffectItemsSettingsConfig>
    | undefined;

  if (!saved || typeof saved !== 'object') {
    return defaults;
  }

  return foundry.utils.mergeObject(defaults, saved) as EffectItemsSettingsConfig;
}

export async function saveEffectToItemBuilderSettings(
  settings: EffectItemsSettingsConfig,
): Promise<void> {
  await game?.settings?.set(MODULE_NAMESPACE, SETTINGS_KEY, settings);
}

export function getAvailableEffectCarrierTypes(): string[] {
  const docTypes = game.system?.documentTypes?.Item ?? {};
  const systemTypes = Object.keys(docTypes);
  const available = getAllowedCarrierTypes().filter((typeName) => systemTypes.includes(typeName));
  return available.length ? available : ['trait'];
}

import type { EffectToItemBuilderSettings } from '../../../types/module';
import { getAllowedCarrierTypes } from './aggregate-items';
import { MODULE_ID } from './species';

export const EFFECT_TO_ITEM_BUILDER_SETTINGS_KEY = 'effectToItemBuilderSettings';

export function getDefaultEffectToItemBuilderSettings(): EffectToItemBuilderSettings {
  return {
    namePrefix: 'Effect',
    defaultItemType: 'trait',
    defaultFolderId: '',
    fallbackFolderName: 'Effect Items',
    rememberLastFolder: true,
  };
}

export function loadEffectToItemBuilderSettings(): EffectToItemBuilderSettings {
  const defaults = getDefaultEffectToItemBuilderSettings();
  const saved = game?.settings?.get(MODULE_ID, EFFECT_TO_ITEM_BUILDER_SETTINGS_KEY) as
    | Partial<EffectToItemBuilderSettings>
    | undefined;

  if (!saved || typeof saved !== 'object') {
    return defaults;
  }

  return foundry.utils.mergeObject(defaults, saved) as EffectToItemBuilderSettings;
}

export async function saveEffectToItemBuilderSettings(
  settings: EffectToItemBuilderSettings,
): Promise<void> {
  await game?.settings?.set(MODULE_ID, EFFECT_TO_ITEM_BUILDER_SETTINGS_KEY, settings);
}

export function getAvailableEffectCarrierTypes(): string[] {
  const docTypes = game.system?.documentTypes?.Item ?? {};
  const systemTypes = Object.keys(docTypes);
  const available = getAllowedCarrierTypes().filter((typeName) => systemTypes.includes(typeName));
  return available.length ? available : ['trait'];
}

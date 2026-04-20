import type { EffectItemsSettingsConfig as SettingsConfig } from '@/types/module';

export function EffectItemsSettingsConfig(): SettingsConfig {
  return {
    namePrefix: 'Effect',
    defaultItemType: 'trait',
    defaultFolderId: '',
    fallbackFolderName: 'Effect Items',
    rememberLastFolder: true,
  };
}

export default EffectItemsSettingsConfig;

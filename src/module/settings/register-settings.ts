import {
  CUSTOM_SPECIES_SETTING_KEY,
  MODULE_ID,
  type CustomSpeciesSettingsData,
} from '../species/types';
import { getDefaultCustomSpeciesSettingsData } from './species-settings';

declare global {
  interface SettingConfig {
    'wfrp4e-species-builder.customSpeciesDefinitions': CustomSpeciesSettingsData;
  }
}

export function registerSettings(): void {
  game?.settings?.register(MODULE_ID, CUSTOM_SPECIES_SETTING_KEY, {
    name: 'Custom Species Definitions',
    hint: 'Internal storage for WFRP4e Species Builder custom species.',
    scope: 'world',
    config: false,
    default: getDefaultCustomSpeciesSettingsData(),
  });
}

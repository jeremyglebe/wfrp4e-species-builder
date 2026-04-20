import { register } from './register';
import { loadCustomSpeciesDefinitions, saveCustomSpeciesDefinitions } from './species';

export const MODULE_ID = 'wfrp4e-species-builder';

export const SettingsService = {
  register,
  loadCustomSpeciesDefinitions,
  saveCustomSpeciesDefinitions,
} as const;

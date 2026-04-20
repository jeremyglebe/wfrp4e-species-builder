import { register } from './register';
import { loadCustomSpeciesDefinitions, saveCustomSpeciesDefinitions } from './species';

export const MODULE_NAMESPACE = 'wfrp4e-species-builder';

export const SettingsService = {
  register,
  loadCustomSpeciesDefinitions,
  saveCustomSpeciesDefinitions,
} as const;

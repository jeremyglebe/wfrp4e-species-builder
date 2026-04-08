import {
  CUSTOM_SPECIES_SETTING_KEY,
  MODULE_ID,
  type CustomSpeciesDefinition,
  type CustomSpeciesSettingsData,
} from './types';
import { getDefaultCustomSpeciesSettingsData } from '../settings/species-settings';

/**
 * Reads raw species settings from world settings and returns a normalized array.
 *
 * This is intentionally forgiving for now. Future enhancements may include:
 * - migrations
 * - stricter validation
 * - warnings for malformed entries
 */
export function loadCustomSpeciesDefinitions(): CustomSpeciesDefinition[] {
  const rawValue = game?.settings?.get(MODULE_ID, CUSTOM_SPECIES_SETTING_KEY) as
    | Partial<CustomSpeciesSettingsData>
    | undefined;

  const fallback = getDefaultCustomSpeciesSettingsData();

  if (!rawValue || typeof rawValue !== 'object') {
    return fallback.species;
  }

  if (!Array.isArray(rawValue.species)) {
    return fallback.species;
  }

  return rawValue.species;
}

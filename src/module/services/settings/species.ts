import { MODULE_ID } from '.';
import type { CustomSpeciesDefinition, CustomSpeciesSettingsData } from '../../../types/module';
import { FactoryService } from '../factory';

/**
 * Foundry settings boundary for module storage.
 */
export const CUSTOM_SPECIES_SETTING_KEY = 'customSpeciesDefinitions';

export function loadCustomSpeciesDefinitions(): CustomSpeciesDefinition[] {
  const rawValue = game?.settings?.get(MODULE_ID, CUSTOM_SPECIES_SETTING_KEY) as
    | Partial<CustomSpeciesSettingsData>
    | undefined;

  const fallback = FactoryService.Empty.CustomSpeciesSettingsData();

  if (!rawValue || typeof rawValue !== 'object') {
    return fallback.species;
  }

  if (!Array.isArray(rawValue.species)) {
    return fallback.species;
  }

  return rawValue.species;
}

export async function saveCustomSpeciesDefinitions(
  species: CustomSpeciesDefinition[],
): Promise<void> {
  await game?.settings?.set(MODULE_ID, CUSTOM_SPECIES_SETTING_KEY, {
    species,
  });
}

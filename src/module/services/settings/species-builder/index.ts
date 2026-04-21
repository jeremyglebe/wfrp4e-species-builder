import { MODULE_NAMESPACE } from '..';
import type { CustomSpeciesDefinition, CustomSpeciesSettingsData } from '../../../../types/module';
import { FactoryService } from '../../factory';

/**
 * Foundry settings boundary for module storage.
 */
export const SETTINGS_KEY = 'customSpeciesDefinitions';

export function loadCustomSpeciesDefinitions(): CustomSpeciesDefinition[] {
  const rawValue = game?.settings?.get(MODULE_NAMESPACE, SETTINGS_KEY) as
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
  await game?.settings?.set(MODULE_NAMESPACE, SETTINGS_KEY, {
    species,
  });
}

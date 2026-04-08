import {
  CUSTOM_SPECIES_SETTING_KEY,
  MODULE_ID,
  type CustomSpeciesDefinition,
} from '../species/types';

export async function saveCustomSpeciesDefinitions(
  species: CustomSpeciesDefinition[],
): Promise<void> {
  await game?.settings?.set(MODULE_ID, CUSTOM_SPECIES_SETTING_KEY, {
    version: 1,
    species,
  });
}

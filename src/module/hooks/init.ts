import { registerSettings } from '../settings/register-settings';
import { loadCustomSpeciesDefinitions } from '../species/load-custom-species';
import { transformSpeciesDefinitionsToWfrpConfig } from '../species/transform-species';
import { injectCustomSpeciesIntoWfrpConfig } from '../species/inject-species';
import { MODULE_ID } from '../species/types';

Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing module`);

  registerSettings();

  const customSpeciesDefinitions = loadCustomSpeciesDefinitions();

  if (customSpeciesDefinitions.length > 0) {
    const transformedConfig = transformSpeciesDefinitionsToWfrpConfig(customSpeciesDefinitions);

    injectCustomSpeciesIntoWfrpConfig(transformedConfig);

    console.log(`${MODULE_ID} | Injected ${customSpeciesDefinitions.length} custom species`);
  } else {
    console.log(`${MODULE_ID} | No custom species definitions found`);
  }
});

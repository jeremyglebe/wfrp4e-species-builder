import { Injection, MODULE_ID, Settings } from '../services';

/**
 * Module initialization hook.
 *
 * Registers settings, loads module-native species definitions from world
 * storage, then applies them into WFRP runtime config.
 */

Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing module`);

  Settings.register();

  const customSpeciesDefinitions = Settings.loadCustomSpeciesDefinitions();

  if (customSpeciesDefinitions.length > 0) {
    Injection.applySpeciesDefinitions(customSpeciesDefinitions);

    console.log(`${MODULE_ID} | Injected ${customSpeciesDefinitions.length} custom species`);
  } else {
    console.log(`${MODULE_ID} | No custom species definitions found`);
  }
});

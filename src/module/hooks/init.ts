import { InjectionService, MODULE_ID, SettingsService } from '../services';
import { ensureFreshModuleStyles } from '../services/cache';

/**
 * Module initialization hook.
 *
 * Registers settings, loads module-native species definitions from world
 * storage, then applies them into WFRP runtime config.
 */
Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing module`);

  // Cache busting for module css styles- makes sure that when refreshing Foundry, the latest styles are loaded.
  // This is especially important during development, but also ensures that users get the latest styles when updating the module.
  ensureFreshModuleStyles(MODULE_ID);

  // Register all of the module's custom settings
  SettingsService.register();

  initSpeciesBuilder();
});

function initSpeciesBuilder(): void {
  // Load custom species definitions from the world settings
  const customSpeciesDefinitions = SettingsService.loadCustomSpeciesDefinitions();

  if (customSpeciesDefinitions.length > 0) {
    InjectionService.applySpeciesDefinitions(customSpeciesDefinitions);
    console.log(`${MODULE_ID} | Injected ${customSpeciesDefinitions.length} custom species`);
  } else {
    console.log(`${MODULE_ID} | No custom species definitions found`);
  }
}

import SpeciesBuilderApp from '../../vue/apps/SpeciesBuilderApp.vue';
import { Settings } from '../services/settings-service';
import { FoundryVueApplication } from './FoundryVueApplication';

/**
 * Species builder window implementation.
 *
 * This class defines app-specific options and props while generic
 * Foundry/Vue lifecycle logic remains in FoundryVueApplication.
 */
export class SpeciesBuilderApplication extends FoundryVueApplication {
  protected readonly vueRootId = 'wfrp4e-species-builder-root';

  static override DEFAULT_OPTIONS = {
    id: 'wfrp4e-species-builder-app',
    tag: 'section',
    window: {
      title: 'WFRP4e Species Builder',
      resizable: true,
    },
    position: {
      width: 1000,
      height: 750,
    },
  };

  protected override getVueComponent() {
    return SpeciesBuilderApp;
  }

  protected override async getVueProps(): Promise<Record<string, unknown>> {
    return {
      initialSpecies: Settings.loadCustomSpeciesDefinitions(),
      onSave: Settings.saveCustomSpeciesDefinitions,
    };
  }
}

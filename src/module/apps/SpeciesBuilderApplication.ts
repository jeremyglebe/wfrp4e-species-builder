import SpeciesBuilderApp from '../../vue/apps/species-builder/SpeciesBuilderApp.vue';
import { pinia } from '../../vue/pinia';
import { useSpeciesBuilderStore } from '../../vue/stores';
import { SettingsService } from '../services/settings';
import { FoundryVueApplication } from './FoundryVueApplication';

/**
 * Species builder window implementation.
 *
 * This class defines app-specific options and props while generic
 * Foundry/Vue lifecycle logic remains in FoundryVueApplication.
 *
 * On each open, the species store is hydrated with the latest persisted data
 * before the Vue app mounts. The store owns working state; this class owns
 * the Foundry window lifecycle and the "prompt refresh on close" behavior.
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
    // Hydrate the species store with the latest persisted data before mount.
    // The store is accessed via the shared pinia instance so it is available
    // before the Vue app (and its app.use(pinia) call) exists.
    const store = useSpeciesBuilderStore(pinia);
    store.hydrateFromStorage(SettingsService.loadCustomSpeciesDefinitions());
    return {};
  }

  protected override _onClose(): void {
    super._onClose();

    const store = useSpeciesBuilderStore(pinia);
    if (!store.savedSinceOpen) {
      return;
    }

    void this.promptRefreshDialog();
  }

  private async promptRefreshDialog(): Promise<void> {
    const dialogV2 = foundry?.applications?.api?.DialogV2;

    if (dialogV2) {
      const shouldRefresh = await dialogV2.confirm({
        window: {
          title: 'Refresh Foundry?',
        },
        content:
          '<p>Species data was saved during this session.</p><p>Refresh now to rebuild WFRP species config and see changes everywhere?</p>',
        yes: {
          label: 'Refresh Now',
        },
        no: {
          label: 'Later',
        },
      });

      if (shouldRefresh) {
        window.location.reload();
      }

      return;
    }

    if (window.confirm('Species data was saved. Refresh now to apply it everywhere?')) {
      window.location.reload();
    }
  }
}

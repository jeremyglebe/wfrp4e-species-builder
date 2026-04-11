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
  private shouldPromptRefreshOnClose = false;

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
      onSavedSinceOpen: () => {
        this.shouldPromptRefreshOnClose = true;
      },
    };
  }

  protected override _onClose(): void {
    super._onClose();

    if (!this.shouldPromptRefreshOnClose) {
      return;
    }

    this.shouldPromptRefreshOnClose = false;
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

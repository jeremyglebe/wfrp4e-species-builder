import { createApp, type App as VueApp } from 'vue';
import SpeciesBuilderApp from '../../vue/SpeciesBuilderApp.vue';
import { loadCustomSpeciesDefinitions } from '../species/load-custom-species';
import { saveCustomSpeciesDefinitions } from '../settings/save-custom-species';

export class SpeciesBuilderApplication extends foundry.applications.api.ApplicationV2 {
  private vueApp?: VueApp<Element>;

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

  protected override async _renderHTML(): Promise<string> {
    return `<div id="wfrp4e-species-builder-root"></div>`;
  }

  protected override _replaceHTML(result: string, content: HTMLElement): void {
    content.innerHTML = result;
  }

  protected override async _onRender(): Promise<void> {
    const root = this.element?.querySelector('#wfrp4e-species-builder-root');
    if (!root) return;

    if (this.vueApp) {
      this.vueApp.unmount();
      this.vueApp = undefined;
    }

    const initialSpecies = loadCustomSpeciesDefinitions();

    this.vueApp = createApp(SpeciesBuilderApp, {
      initialSpecies,
      onSave: saveCustomSpeciesDefinitions,
    });

    this.vueApp.mount(root);
  }

  protected override _onClose(): void {
    if (this.vueApp) {
      this.vueApp.unmount();
      this.vueApp = undefined;
    }
  }
}

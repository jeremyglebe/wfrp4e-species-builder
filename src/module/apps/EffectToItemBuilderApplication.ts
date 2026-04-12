import EffectToItemBuilderApp from '../../vue/apps/EffectToItemBuilderApp.vue';
import { FoundryVueApplication } from './FoundryVueApplication';

export class EffectToItemBuilderApplication extends FoundryVueApplication {
  protected readonly vueRootId = 'wfrp4e-effect-to-item-builder-root';

  static override DEFAULT_OPTIONS = {
    id: 'wfrp4e-effect-to-item-builder-app',
    tag: 'section',
    window: {
      title: 'WFRP4e Effect to Item Builder',
      resizable: true,
    },
    position: {
      width: 920,
      height: 760,
    },
  };

  protected override getVueComponent() {
    return EffectToItemBuilderApp;
  }
}

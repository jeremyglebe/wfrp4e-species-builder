import AggregateItemBuilderApp from '../../vue/apps/AggregateItemBuilderApp.vue';
import { FoundryVueApplication } from './FoundryVueApplication';

export class AggregateItemBuilderApplication extends FoundryVueApplication {
  protected readonly vueRootId = 'wfrp4e-aggregate-item-builder-root';

  static override DEFAULT_OPTIONS = {
    id: 'wfrp4e-aggregate-item-builder-app',
    tag: 'section',
    window: {
      title: 'WFRP4e Aggregate Item Builder',
      resizable: true,
    },
    position: {
      width: 920,
      height: 760,
    },
  };

  protected override getVueComponent() {
    return AggregateItemBuilderApp;
  }
}

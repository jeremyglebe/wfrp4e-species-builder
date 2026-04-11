import NPCBuilderApp from '../../vue/apps/NPCBuilderApp.vue';
import { FoundryVueApplication } from './FoundryVueApplication';

/**
 * NPC Builder window implementation.
 * Manages the UI and workflow for building NPCs from base actors and careers.
 */
export class NPCBuilderApplication extends FoundryVueApplication {
  protected readonly vueRootId = 'wfrp4e-npc-builder-root';

  static override DEFAULT_OPTIONS = {
    id: 'wfrp4e-npc-builder-app',
    tag: 'section',
    window: {
      title: 'WFRP4e NPC Builder',
      resizable: true,
    },
    position: {
      width: 820,
      height: 700,
    },
  };

  protected override getVueComponent() {
    return NPCBuilderApp;
  }

  protected override async getVueProps(): Promise<Record<string, unknown>> {
    return {
      onClose: () => this.close(),
    };
  }
}

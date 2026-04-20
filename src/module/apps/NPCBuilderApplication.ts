import NpcBuilderApp from '../../vue/apps/npc-builder/NpcBuilderApp.vue';
import { pinia } from '../../vue/pinia';
import { useNpcBuilderStore } from '../../vue/stores';
import { loadNPCBuilderSettings } from '../services/settings/npcs';
import { FoundryVueApplication } from './FoundryVueApplication';

/**
 * NPC Builder window implementation.
 *
 * Manages the UI and workflow for building NPCs from base actors and careers.
 *
 * On each open, the NPC store is hydrated with the latest persisted settings
 * and transient working state is reset to a clean slate. The store owns
 * in-memory state; this class owns the Foundry window lifecycle.
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
    return NpcBuilderApp;
  }

  protected override async getVueProps(): Promise<Record<string, unknown>> {
    // Hydrate the NPC store with current persisted settings and reset
    // transient working state (careers, base actor selection) before mount.
    const store = useNpcBuilderStore(pinia);
    store.hydrateFromStorage(loadNPCBuilderSettings());
    return {
      onClose: () => this.close(),
    };
  }
}

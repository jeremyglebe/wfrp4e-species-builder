import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { BaseActorOverride, CareerEntry, NPCBuilderSettings } from '../../types/module';
import {
  getDefaultNPCBuilderSettings,
  saveNPCBuilderSettings,
} from '../../module/services/settings/npcs';

/**
 * NPC Builder Pinia store.
 *
 * Owns all in-memory working state for the NPC Builder application.
 * This is the single source of truth for the current build session.
 *
 * Persistence responsibilities (loading from / saving to Foundry world
 * settings) are delegated to the settings service in
 * src/module/services/settings/npcs.ts — this store does not call
 * game.settings directly.
 *
 * Lifecycle: hydrateFromStorage() is called by NPCBuilderApplication
 * before the Vue app mounts on each open, reloading persisted settings
 * and resetting transient working state to a clean slate.
 */
export const useNpcBuilderStore = defineStore('npc-builder', () => {
  // ---------------------------------------------------------------------------
  // Working state — resets each time the app opens via hydrateFromStorage()
  // ---------------------------------------------------------------------------

  /** ID of the actor currently selected in the base folder dropdown. */
  const baseActorId = ref('');

  /** Actor dragged directly onto the override zone, takes priority over dropdown. */
  const baseActorOverride = ref<BaseActorOverride | null>(null);

  /** Ordered list of careers queued for the current build. */
  const careers = ref<CareerEntry[]>([]);

  /** Active tab in the NPC Builder UI. */
  const activeTab = ref<'main' | 'skills-talents' | 'traits' | 'trappings' | 'settings'>('main');

  /** Whether the base actor override drop zone is visible. */
  const showBaseOverrideDropZone = ref(true);

  // ---------------------------------------------------------------------------
  // Busy state — managed by the build orchestration logic in the component
  // ---------------------------------------------------------------------------

  /** True while a long-running async operation (e.g. NPC build) is in progress. */
  const isBusy = ref(false);

  /** Human-readable status message shown in the busy overlay. */
  const busyMessage = ref('');

  // ---------------------------------------------------------------------------
  // Persisted settings — loaded from world settings on each open
  // ---------------------------------------------------------------------------

  /** NPC Builder configuration (folder names, behavior flags). */
  const settings = ref<NPCBuilderSettings>(getDefaultNPCBuilderSettings());

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Loads persisted NPC Builder settings into the store and resets all
   * transient working state to a clean default.
   *
   * Called by NPCBuilderApplication.getVueProps() before the Vue app mounts.
   */
  function hydrateFromStorage(savedSettings: NPCBuilderSettings): void {
    settings.value = savedSettings;
    // Reset transient working state so each open starts fresh
    baseActorId.value = '';
    baseActorOverride.value = null;
    careers.value = [];
    activeTab.value = 'main';
    showBaseOverrideDropZone.value = true;
    isBusy.value = false;
    busyMessage.value = '';
  }

  /**
   * Persists the current settings to Foundry world storage.
   *
   * Delegates to the settings service — this store does not write to
   * game.settings directly.
   */
  async function saveToStorage(): Promise<void> {
    await saveNPCBuilderSettings(settings.value);
  }

  /** Sets the base actor dropdown selection and clears any active override. */
  function setBaseActor(id: string): void {
    baseActorId.value = id;
  }

  /** Sets or clears the drag-drop base actor override. */
  function setBaseActorOverride(override: BaseActorOverride | null): void {
    baseActorOverride.value = override;
  }

  /** Appends a career entry to the build queue. */
  function addCareer(entry: CareerEntry): void {
    careers.value.push(entry);
  }

  /** Removes the career at the given queue index. */
  function removeCareer(index: number): void {
    careers.value.splice(index, 1);
  }

  /**
   * Swaps the career at `index` with its neighbour in `direction`.
   * No-ops if the move would go out of bounds.
   */
  function moveCareer(index: number, direction: -1 | 1): void {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= careers.value.length) return;

    const sourceCareer = careers.value[index];
    const targetCareer = careers.value[targetIndex];
    if (sourceCareer && targetCareer) {
      [careers.value[index], careers.value[targetIndex]] = [targetCareer, sourceCareer];
    }
  }

  /**
   * Clears the override, career queue, and resets the override drop zone
   * after a successful build. Settings are intentionally preserved.
   */
  function resetWorkingNpc(): void {
    baseActorOverride.value = null;
    careers.value = [];
    showBaseOverrideDropZone.value = true;
  }

  return {
    // State
    baseActorId,
    baseActorOverride,
    careers,
    activeTab,
    showBaseOverrideDropZone,
    isBusy,
    busyMessage,
    settings,
    // Actions
    hydrateFromStorage,
    saveToStorage,
    setBaseActor,
    setBaseActorOverride,
    addCareer,
    removeCareer,
    moveCareer,
    resetWorkingNpc,
  };
});

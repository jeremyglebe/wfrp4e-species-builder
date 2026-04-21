import { defineStore } from 'pinia';
import { computed, ref, toRaw, watch } from 'vue';
import type {
  CustomSpeciesDefinition,
  CustomSubspeciesDefinition,
} from '../../shared/types/module';
import { SettingsService } from '../../module/services/settings';
import { FactoryService } from '@/module/services/factory';

/**
 * Species Builder Pinia store.
 *
 * Owns all in-memory working state for the Species Builder application.
 * This is the single source of truth for the current editing session.
 *
 * Persistence responsibilities (loading from / saving to Foundry world
 * settings) are delegated to the Settings service in
 * src/module/services/settings/species.ts via saveToStorage(). The store
 * does not call game.settings directly.
 *
 * Lifecycle: hydrateFromStorage() is called by SpeciesBuilderApplication
 * before the Vue app mounts on each open, loading persisted data and
 * resetting transient UI state to a clean slate.
 */
export const useSpeciesBuilderStore = defineStore('species-builder', () => {
  // ---------------------------------------------------------------------------
  // Core working state
  // ---------------------------------------------------------------------------

  /** Full list of custom species definitions being edited this session. */
  const speciesList = ref<CustomSpeciesDefinition[]>([]);

  /**
   * JSON snapshot of speciesList at the last successful save (or on hydration).
   * Used to compute isDirty without requiring deep equality checks.
   */
  const initialSnapshot = ref('');

  // ---------------------------------------------------------------------------
  // Selection state
  // ---------------------------------------------------------------------------

  /** ID of the currently selected species in the list panel. */
  const selectedSpeciesId = ref<string | null>(null);

  /** ID of the currently selected subspecies in the subspecies editor. */
  const selectedSubspeciesId = ref<string | null>(null);

  /**
   * Draft value of the species ID input field.
   * Kept separate from selectedSpecies.id so the ID is only committed on save.
   */
  const selectedSpeciesIdDraft = ref('');

  /**
   * Draft value of the subspecies ID input field.
   * Kept separate from selectedSubspecies.id so the ID is only committed on save.
   */
  const selectedSubspeciesIdDraft = ref('');

  // ---------------------------------------------------------------------------
  // UI state
  // ---------------------------------------------------------------------------

  /** Whether the subspecies editor sub-view panel is open. */
  const isSubspeciesBuilderOpen = ref(false);

  /** Validation error emitted by the SubspeciesBuilder child component. */
  const subspeciesValidationError = ref<string | null>(null);

  /** True while a save operation is in progress. */
  const isSaving = ref(false);

  /**
   * Set to true the first time species are successfully saved during the
   * current open session. SpeciesBuilderApplication reads this in _onClose()
   * to decide whether to show the "Reload to apply changes?" dialog.
   */
  const savedSinceOpen = ref(false);

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  /** The currently selected species object, or null if nothing is selected. */
  const selectedSpecies = computed<CustomSpeciesDefinition | null>(
    () => speciesList.value.find((s) => s.id === selectedSpeciesId.value) ?? null,
  );

  /** All subspecies of the currently selected species, as an array. */
  const selectedSpeciesSubspecies = computed<CustomSubspeciesDefinition[]>(() =>
    Object.values(selectedSpecies.value?.subspecies ?? {}),
  );

  /** The currently selected subspecies object, or null. */
  const selectedSubspecies = computed<CustomSubspeciesDefinition | null>(
    () =>
      selectedSpeciesSubspecies.value.find((sub) => sub.id === selectedSubspeciesId.value) ?? null,
  );

  /**
   * Map of normalized IDs → count, including the in-progress draft ID for the
   * currently selected species. Used to detect duplicate IDs before save.
   */
  const duplicateIds = computed<Map<string, number>>(() => {
    const counts = new Map<string, number>();
    for (const species of speciesList.value) {
      const normalized = (
        species.id === selectedSpecies.value?.id ? selectedSpeciesIdDraft.value : species.id
      ).trim();
      if (!normalized) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
    return counts;
  });

  /** Validation error for the currently selected species, or null. */
  const selectedValidationError = computed<string | null>(() => {
    if (!selectedSpecies.value) return null;
    if (!selectedSpecies.value.name.trim()) return 'Name is required.';
    const normalizedId = selectedSpeciesIdDraft.value.trim();
    if (!normalizedId) return 'ID is required.';
    if ((duplicateIds.value.get(normalizedId) ?? 0) > 1) return 'ID must be unique.';
    return null;
  });

  /** Combined validation error from species or subspecies editor. */
  const validationError = computed<string | null>(
    () => selectedValidationError.value ?? subspeciesValidationError.value,
  );

  /** True if speciesList has changed since the last save or hydration. */
  const isDirty = computed(() => JSON.stringify(speciesList.value) !== initialSnapshot.value);

  /** True if the current state is valid and has unsaved changes. */
  const canSave = computed(
    () => Boolean(selectedSpecies.value) && !validationError.value && isDirty.value,
  );

  /** Status label shown in the editor header. */
  const saveStatusText = computed(() => (isDirty.value ? 'Unsaved changes' : 'All changes saved'));

  // ---------------------------------------------------------------------------
  // Internal watches — sync draft IDs with selection, reset on change
  // ---------------------------------------------------------------------------

  // Keep the species ID draft field in sync with the selected species.
  watch(
    () => selectedSpecies.value?.id,
    () => {
      selectedSpeciesIdDraft.value = selectedSpecies.value?.id ?? '';
    },
    { immediate: true },
  );

  // Keep the subspecies ID draft field in sync with the selected subspecies.
  watch(
    () => selectedSubspecies.value?.id,
    () => {
      selectedSubspeciesIdDraft.value = selectedSubspecies.value?.id ?? '';
    },
    { immediate: true },
  );

  // When the selected species changes, validate / reset the subspecies selection.
  watch(
    () => selectedSpeciesId.value,
    () => {
      const subspecies = selectedSpeciesSubspecies.value;
      if (subspecies.length === 0) {
        selectedSubspeciesId.value = null;
        isSubspeciesBuilderOpen.value = false;
        return;
      }
      if (!subspecies.some((entry) => entry.id === selectedSubspeciesId.value)) {
        selectedSubspeciesId.value = subspecies[0]?.id ?? null;
      }
    },
    { immediate: true },
  );

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Loads a fresh set of species definitions into the store and resets all
   * transient UI state. Called by SpeciesBuilderApplication before mount.
   */
  function hydrateFromStorage(species: CustomSpeciesDefinition[]): void {
    speciesList.value = structuredClone(species);
    initialSnapshot.value = JSON.stringify(speciesList.value);
    selectedSpeciesId.value = speciesList.value[0]?.id ?? null;
    selectedSubspeciesId.value = null;
    isSubspeciesBuilderOpen.value = false;
    subspeciesValidationError.value = null;
    savedSinceOpen.value = false;
  }

  /**
   * Persists the current species list to Foundry world storage via the
   * settings service, then updates the snapshot and saved-since-open flag.
   *
   * Throws if the underlying settings write fails, allowing the caller to
   * perform a UI-level rollback.
   */
  async function saveToStorage(): Promise<void> {
    isSaving.value = true;
    try {
      await SettingsService.saveCustomSpeciesDefinitions(structuredClone(toRaw(speciesList.value)));
      savedSinceOpen.value = true;
      initialSnapshot.value = JSON.stringify(speciesList.value);
    } finally {
      isSaving.value = false;
    }
  }

  /**
   * Selects a species by ID and closes the subspecies editor.
   */
  function setSelectedSpecies(speciesId: string): void {
    selectedSpeciesId.value = speciesId;
    selectedSubspeciesId.value = null;
    isSubspeciesBuilderOpen.value = false;
  }

  /**
   * Creates a new empty species, adds it to the list, and selects it.
   */
  function addSpecies(): void {
    const newSpecies = FactoryService.Empty.CustomSpeciesDefinition();
    speciesList.value.push(newSpecies);
    selectedSpeciesId.value = newSpecies.id;
    selectedSubspeciesId.value = null;
    isSubspeciesBuilderOpen.value = false;
  }

  /**
   * Creates a new empty subspecies for the currently selected species and
   * opens the subspecies editor. Throws if no species is selected.
   */
  function addSubspecies(): void {
    if (!selectedSpecies.value) throw new Error('No species selected.');

    if (!selectedSpecies.value.subspecies) {
      selectedSpecies.value.subspecies = {};
    }

    const newSubspecies = FactoryService.Empty.CustomSubspeciesDefinition();
    selectedSpecies.value.subspecies[newSubspecies.id] = newSubspecies;
    selectedSubspeciesId.value = newSubspecies.id;
    isSubspeciesBuilderOpen.value = true;
  }

  /**
   * Opens the subspecies editor and selects the given subspecies.
   */
  function openSubspeciesBuilder(subspeciesId: string): void {
    selectedSubspeciesId.value = subspeciesId;
    isSubspeciesBuilderOpen.value = true;
  }

  /**
   * Closes the subspecies editor panel.
   */
  function closeSubspeciesBuilder(): void {
    isSubspeciesBuilderOpen.value = false;
  }

  return {
    // State
    speciesList,
    initialSnapshot,
    selectedSpeciesId,
    selectedSubspeciesId,
    selectedSpeciesIdDraft,
    selectedSubspeciesIdDraft,
    isSubspeciesBuilderOpen,
    subspeciesValidationError,
    isSaving,
    savedSinceOpen,
    // Computed
    selectedSpecies,
    selectedSpeciesSubspecies,
    selectedSubspecies,
    duplicateIds,
    selectedValidationError,
    validationError,
    isDirty,
    canSave,
    saveStatusText,
    // Actions
    hydrateFromStorage,
    saveToStorage,
    setSelectedSpecies,
    addSpecies,
    addSubspecies,
    openSubspeciesBuilder,
    closeSubspeciesBuilder,
  };
});

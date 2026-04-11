<template>
  <div class="species-builder application">
    <div class="species-builder__layout">
      <aside class="species-builder__sidebar">
        <div class="species-builder__sidebar-header">
          <div>
            <p class="species-builder__eyebrow">Species Ledger</p>
            <h2>Species</h2>
          </div>

          <button type="button" class="species-builder__button species-builder__button--primary" @click="addSpecies">
            Add Species
          </button>
        </div>

        <div class="species-builder__species-list">
          <button v-for="species in speciesList" :key="species.id" type="button" class="species-builder__species-item"
            :class="{ 'is-selected': selectedSpeciesId === species.id }" @click="selectSpecies(species.id)">
            <div class="species-builder__species-topline">
              <strong>{{ species.name || 'Unnamed Species' }}</strong>
              <span class="species-builder__species-id">{{ species.id || 'missing-id' }}</span>
            </div>

            <div class="species-builder__species-meta">
              <span>Mv {{ species.movement ?? 0 }}</span>
              <span>F {{ species.fate ?? 0 }}</span>
              <span>R {{ species.resilience ?? 0 }}</span>
            </div>
          </button>
        </div>
      </aside>

      <main class="species-builder__editor">
        <template v-if="selectedSpecies">
          <header class="species-builder__editor-header">
            <div>
              <p class="species-builder__eyebrow">Builder</p>
              <h2>{{ selectedSpecies.name || 'Unnamed Species' }}</h2>
              <p class="species-builder__status" :class="{ 'is-dirty': isDirty }">{{ saveStatusText }}</p>
            </div>

            <div class="species-builder__editor-actions">
              <button type="button" class="species-builder__button species-builder__button--ghost" :disabled="isSaving"
                @click="deleteSelectedSpecies">
                Delete
              </button>
              <button type="button" class="species-builder__button species-builder__button--primary"
                :disabled="isSaving || !canSave" @click="save">
                Save
              </button>
            </div>
          </header>

          <p v-if="validationError" class="species-builder__error">
            {{ validationError }}
          </p>

          <section class="species-builder__section species-builder__card">
            <h3>Basics</h3>

            <div class="species-builder__form-grid">
              <label class="species-builder__field">
                <span>Name</span>
                <input v-model="selectedSpecies.name" type="text" />
              </label>

              <label class="species-builder__field">
                <span>ID</span>
                <input v-model="selectedSpecies.id" type="text" @input="syncSelectedSpeciesId" />
              </label>

              <label class="species-builder__field">
                <span>Movement</span>
                <input v-model.number="selectedSpecies.movement" type="number" />
              </label>

              <label class="species-builder__field">
                <span>Fate</span>
                <input v-model.number="selectedSpecies.fate" type="number" />
              </label>

              <label class="species-builder__field">
                <span>Resilience</span>
                <input v-model.number="selectedSpecies.resilience" type="number" />
              </label>

              <label class="species-builder__field">
                <span>Extra</span>
                <input v-model.number="selectedSpecies.extra" type="number" />
              </label>

              <label class="species-builder__field">
                <span>Age Formula</span>
                <input v-model="selectedSpecies.age" type="text" />
              </label>

              <label class="species-builder__field species-builder__field--checkbox">
                <span>Show in Extra Species</span>
                <input v-model="selectedSpecies.extraSpecies" type="checkbox" />
              </label>
            </div>
          </section>

          <section class="species-builder__section species-builder__card">
            <h3>Characteristics</h3>

            <div class="species-builder__form-grid species-builder__characteristics-grid">
              <label v-for="key in characteristicKeys" :key="key" class="species-builder__field">
                <span>{{ key.toUpperCase() }}</span>
                <input v-model="selectedSpecies.characteristics[key]" type="text" />
              </label>
            </div>
          </section>

          <div class="species-builder__split-sections">
            <section class="species-builder__section species-builder__card">
              <h3>Skills</h3>
              <textarea v-model="skillsText" rows="7" placeholder="One skill per line" />
            </section>

            <section class="species-builder__section species-builder__card">
              <h3>Talents</h3>
              <textarea v-model="talentsText" rows="7" placeholder="One talent per line" />
            </section>
          </div>

          <section class="species-builder__section species-builder__card">
            <h3>Traits</h3>
            <textarea v-model="traitsText" rows="5" placeholder="One trait per line" />
          </section>

          <SubspeciesBuilderSection :selected-species="selectedSpecies" :selected-subspecies-id="selectedSubspeciesId"
            :characteristic-keys="characteristicKeys" @update:selected-subspecies-id="setSelectedSubspeciesId"
            @validation-change="handleSubspeciesValidationChange" />
        </template>

        <template v-else>
          <div class="species-builder__empty-state species-builder__card">
            <p>No species selected.</p>
            <button type="button" class="species-builder__button species-builder__button--primary" @click="addSpecies">
              Create First Species
            </button>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRaw, watch } from 'vue';
import type { CustomSpeciesDefinition } from '../../types/module';
import { Data } from '../../module/services';
import SubspeciesBuilderSection from './SubspeciesBuilderSection.vue';

const props = defineProps<{
  initialSpecies: CustomSpeciesDefinition[];
  onSave: (species: CustomSpeciesDefinition[]) => Promise<void>;
  onSavedSinceOpen?: () => void;
}>();

const speciesList = ref<CustomSpeciesDefinition[]>(structuredClone(props.initialSpecies));
const initialSnapshot = ref<string>(serializeSpecies(speciesList.value));
const selectedSpeciesId = ref<string | null>(speciesList.value[0]?.id ?? null);
const selectedSubspeciesId = ref<string | null>(null);
const subspeciesValidationError = ref<string | null>(null);
const isSaving = ref(false);

const characteristicKeys = ['ws', 'bs', 's', 't', 'i', 'ag', 'dex', 'int', 'wp', 'fel'] as const;

const selectedSpecies = computed(() => {
  return speciesList.value.find((species) => species.id === selectedSpeciesId.value) ?? null;
});

const duplicateIds = computed(() => {
  const counts = new Map<string, number>();

  for (const species of speciesList.value) {
    const normalizedId = species.id.trim();
    if (!normalizedId) continue;

    counts.set(normalizedId, (counts.get(normalizedId) ?? 0) + 1);
  }

  return counts;
});

const selectedValidationError = computed(() => {
  if (!selectedSpecies.value) return null;

  if (!selectedSpecies.value.name.trim()) {
    return 'Name is required.';
  }

  const normalizedId = selectedSpecies.value.id.trim();

  if (!normalizedId) {
    return 'ID is required.';
  }

  if ((duplicateIds.value.get(normalizedId) ?? 0) > 1) {
    return 'ID must be unique.';
  }

  return null;
});

const validationError = computed(() => {
  return selectedValidationError.value ?? subspeciesValidationError.value;
});

const isDirty = computed(() => {
  return serializeSpecies(speciesList.value) !== initialSnapshot.value;
});

const canSave = computed(() => {
  return Boolean(selectedSpecies.value) && !validationError.value && isDirty.value;
});

const saveStatusText = computed(() => {
  if (isDirty.value) return 'Unsaved changes';
  return 'All changes saved';
});

const skillsText = computed({
  get: () => selectedSpecies.value?.skills.join('\n') ?? '',
  set: (value: string) => {
    if (!selectedSpecies.value) return;
    selectedSpecies.value.skills = parseLineList(value);
  },
});

const talentsText = computed({
  get: () => selectedSpecies.value?.talents.join('\n') ?? '',
  set: (value: string) => {
    if (!selectedSpecies.value) return;
    selectedSpecies.value.talents = parseLineList(value);
  },
});

const traitsText = computed({
  get: () => selectedSpecies.value?.traits?.join('\n') ?? '',
  set: (value: string) => {
    if (!selectedSpecies.value) return;
    selectedSpecies.value.traits = parseLineList(value);
  },
});

function selectSpecies(speciesId: string): void {
  selectedSpeciesId.value = speciesId;
}

function syncSelectedSpeciesId(): void {
  if (!selectedSpecies.value) return;
  selectedSpeciesId.value = selectedSpecies.value.id;
}

function addSpecies(): void {
  const newSpecies = Data.Empty.CustomSpeciesDefinition();
  speciesList.value.push(newSpecies);
  selectedSpeciesId.value = newSpecies.id;
  selectedSubspeciesId.value = null;
}

async function deleteSelectedSpecies(): Promise<void> {
  if (!selectedSpecies.value) return;

  const speciesName = selectedSpecies.value.name.trim() || selectedSpecies.value.id;
  const confirmed = await requestDeleteConfirmation(speciesName);

  if (!confirmed) return;

  const previousSpecies = structuredClone(toRaw(speciesList.value));
  const previousSelectedSpeciesId = selectedSpeciesId.value;

  const speciesIdToDelete = selectedSpecies.value.id;
  const index = speciesList.value.findIndex((species) => species.id === speciesIdToDelete);

  if (index === -1) return;

  speciesList.value.splice(index, 1);

  if (speciesList.value.length === 0) {
    selectedSpeciesId.value = null;
  } else {
    const nextSpecies = speciesList.value[Math.max(0, index - 1)] ?? speciesList.value[0];
    selectedSpeciesId.value = nextSpecies?.id ?? null;
  }

  try {
    await persistSpeciesToStorage('Species deleted. Reload the world to rebuild WFRP species config.');
  } catch (error) {
    speciesList.value = previousSpecies;
    selectedSpeciesId.value = previousSelectedSpeciesId;
    console.error(error);
    ui.notifications?.error('Failed to save species deletion. Changes were reverted.');
  }
}

async function save(): Promise<void> {
  if (!canSave.value) return;

  await persistSpeciesToStorage('Species saved. Reload the world to rebuild WFRP species config.');
}

function parseLineList(value: string): string[] {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function setSelectedSubspeciesId(value: string | null): void {
  selectedSubspeciesId.value = value;
}

function handleSubspeciesValidationChange(value: string | null): void {
  subspeciesValidationError.value = value;
}

function serializeSpecies(species: CustomSpeciesDefinition[]): string {
  return JSON.stringify(species);
}

async function persistSpeciesToStorage(successMessage: string): Promise<void> {
  isSaving.value = true;

  try {
    await props.onSave(structuredClone(toRaw(speciesList.value)));
    props.onSavedSinceOpen?.();
    initialSnapshot.value = serializeSpecies(speciesList.value);
    ui.notifications?.info(successMessage);
  } finally {
    isSaving.value = false;
  }
}

async function requestDeleteConfirmation(speciesName: string): Promise<boolean> {
  const dialogV2 = foundry?.applications?.api?.DialogV2;
  const escapedSpeciesName = escapeHtml(speciesName || 'Unnamed Species');

  if (dialogV2) {
    const result = await dialogV2.confirm({
      window: {
        title: 'Delete Species?',
      },
      content: `<p>Delete <strong>${escapedSpeciesName}</strong>? This change is saved immediately.</p>`,
      yes: {
        label: 'Delete',
      },
      no: {
        label: 'Cancel',
      },
    });

    return Boolean(result);
  }

  return window.confirm(`Delete ${speciesName || 'Unnamed Species'}? This change is saved immediately.`);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

watch(
  () => props.initialSpecies,
  (newValue) => {
    speciesList.value = structuredClone(newValue);
    initialSnapshot.value = serializeSpecies(speciesList.value);

    if (!speciesList.value.some((species) => species.id === selectedSpeciesId.value)) {
      selectedSpeciesId.value = speciesList.value[0]?.id ?? null;
    }

    selectedSubspeciesId.value = null;
    subspeciesValidationError.value = null;
  },
);
</script>

<style scoped>
.species-builder {
  --sb-bg: #171310;
  --sb-border: #6f5441;
  --sb-border-strong: #9a765f;
  --sb-text: #f1e1ce;
  --sb-text-muted: #d3bb9f;
  --sb-accent: #d9a44f;
  --sb-shadow: 0 10px 24px rgb(0 0 0 / 35%);
  --sb-radius: 10px;

  box-sizing: border-box;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  color: var(--sb-text);
  font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
  background:
    radial-gradient(circle at top right, rgb(189 130 47 / 16%), transparent 48%),
    radial-gradient(circle at bottom left, rgb(179 103 68 / 12%), transparent 42%),
    var(--sb-bg);
}

.species-builder__layout {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
  height: 100%;
  gap: 0.9rem;
  padding: 0.9rem;
}

.species-builder__sidebar,
.species-builder__editor {
  padding: 0.85rem;
  overflow: auto;
  border: 1px solid var(--sb-border);
  border-radius: var(--sb-radius);
  background: linear-gradient(180deg, rgb(58 43 33 / 40%), rgb(35 27 22 / 94%));
  box-shadow: var(--sb-shadow);
}

.species-builder__sidebar-header,
.species-builder__editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.7rem;
  margin-bottom: 0.9rem;
}

.species-builder__editor-header {
  position: sticky;
  top: -0.85rem;
  z-index: 2;
  padding: 0.55rem 0;
  background: linear-gradient(180deg, rgb(35 27 22 / 98%), rgb(35 27 22 / 84%));
  backdrop-filter: blur(4px);
}

.species-builder h2,
.species-builder h3 {
  margin: 0;
  color: #f9ebda;
  font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
  letter-spacing: 0.03em;
}

.species-builder__eyebrow {
  margin: 0 0 0.15rem;
  color: var(--sb-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
}

.species-builder__status {
  margin: 0.25rem 0 0;
  color: var(--sb-text-muted);
  font-size: 0.82rem;
}

.species-builder__status.is-dirty {
  color: var(--sb-accent);
}

.species-builder__species-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.species-builder__species-item {
  all: unset;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  width: 100%;
  text-align: left;
  padding: 0.65rem;
  border: 1px solid var(--sb-border);
  border-radius: 8px;
  color: var(--sb-text);
  background: linear-gradient(180deg, rgb(103 73 52 / 22%), rgb(44 33 26 / 75%));
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease, background-color 0.15s ease;
}

.species-builder__species-item strong,
.species-builder__species-item span {
  line-height: 1.2;
}

.species-builder__species-item:hover {
  border-color: var(--sb-border-strong);
  transform: translateY(-1px);
}

.species-builder__species-item.is-selected {
  border-color: var(--sb-accent);
  box-shadow: 0 0 0 1px rgb(217 164 79 / 55%);
}

.species-builder__species-topline {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.4rem;
}

.species-builder__species-id {
  padding: 0.12rem 0.4rem;
  border-radius: 999px;
  font-size: 0.74rem;
  color: #f0ceb2;
  background: rgb(199 120 87 / 24%);
}

.species-builder__species-meta {
  display: flex;
  gap: 0.35rem;
}

.species-builder__species-meta span {
  border: 1px solid rgb(169 124 87 / 55%);
  border-radius: 999px;
  padding: 0.1rem 0.42rem;
  color: var(--sb-text-muted);
  font-size: 0.72rem;
}

.species-builder__editor-actions {
  display: flex;
  gap: 0.55rem;
  align-items: center;
}

.species-builder__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 0.75rem;
}

.species-builder__characteristics-grid {
  grid-template-columns: repeat(5, minmax(90px, 1fr));
}

.species-builder__section {
  margin-bottom: 0.95rem;
}

.species-builder__section h3 {
  margin-bottom: 0.7rem;
}

.species-builder__section textarea {
  width: 100%;
  min-height: 130px;
  padding: 0.55rem 0.6rem;
  border-radius: 7px;
  border: 1px solid var(--sb-border);
  background: rgb(33 24 19 / 92%);
  color: var(--sb-text);
  font: inherit;
  line-height: 1.35;
  resize: vertical;
}

.species-builder__split-sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 0.95rem;
}

.species-builder__card {
  border: 1px solid rgb(137 103 77 / 72%);
  border-radius: 9px;
  padding: 0.8rem;
  background: linear-gradient(180deg, rgb(90 64 47 / 20%), rgb(46 34 27 / 82%));
}

.species-builder__field {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.species-builder__field span {
  color: var(--sb-text-muted);
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.species-builder__field input {
  width: 100%;
  border: 1px solid var(--sb-border);
  border-radius: 7px;
  padding: 0.42rem 0.5rem;
  color: var(--sb-text);
  background: rgb(33 24 19 / 92%);
  font: inherit;
}

.species-builder__field--checkbox {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.species-builder__field--checkbox span {
  margin: 0;
}

.species-builder__field--checkbox input {
  width: auto;
}

.species-builder__button {
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 0.42rem 0.72rem;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: transform 0.15s ease, filter 0.15s ease, border-color 0.15s ease;
}

.species-builder__button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.species-builder__button:not(:disabled):hover {
  transform: translateY(-1px);
  filter: brightness(1.07);
}

.species-builder__button--primary {
  border-color: rgb(201 145 75 / 70%);
  color: #27190f;
  background: linear-gradient(180deg, #e8ba72, #c28a3d);
}

.species-builder__button--ghost {
  border-color: rgb(205 103 89 / 60%);
  color: #f7d4ca;
  background: rgb(148 60 50 / 26%);
}

.species-builder__error {
  margin: 0 0 0.85rem;
  border: 1px solid rgb(190 94 84 / 70%);
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
  background: rgb(124 40 34 / 28%);
  color: #ffcec7;
  font-size: 0.84rem;
}

.species-builder__empty-state {
  display: grid;
  gap: 0.85rem;
  place-items: start;
}

.species-builder__empty-state p {
  margin: 0;
}

@media (max-width: 980px) {
  .species-builder__layout {
    grid-template-columns: 1fr;
  }

  .species-builder__sidebar {
    max-height: 42vh;
  }

  .species-builder__editor-header {
    top: -0.3rem;
  }

  .species-builder__characteristics-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }

  .species-builder__split-sections {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 620px) {
  .species-builder__form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

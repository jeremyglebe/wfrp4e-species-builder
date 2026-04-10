<template>
  <div class="species-builder application">
    <div class="species-builder__layout">
      <aside class="species-builder__sidebar">
        <div class="species-builder__sidebar-header">
          <h2>Species</h2>
          <button type="button" @click="addSpecies">Add</button>
        </div>

        <div class="species-builder__species-list">
          <button
            v-for="species in speciesList"
            :key="species.id"
            type="button"
            class="species-builder__species-item"
            :class="{ 'is-selected': selectedSpeciesId === species.id }"
            @click="selectSpecies(species.id)"
          >
            <strong>{{ species.name || 'Unnamed Species' }}</strong>
            <div class="species-builder__species-id">{{ species.id }}</div>
          </button>
        </div>
      </aside>

      <main class="species-builder__editor">
        <template v-if="selectedSpecies">
          <header class="species-builder__editor-header">
            <h2>Edit Species</h2>

            <div class="species-builder__editor-actions">
              <button type="button" @click="save">Save</button>
              <button type="button" @click="deleteSelectedSpecies">Delete</button>
            </div>
          </header>

          <div class="species-builder__form-grid">
            <label>
              <span>Name</span>
              <input v-model="selectedSpecies.name" type="text" />
            </label>

            <label>
              <span>ID</span>
              <input v-model="selectedSpecies.id" type="text" />
            </label>

            <label>
              <span>Movement</span>
              <input v-model.number="selectedSpecies.movement" type="number" />
            </label>

            <label>
              <span>Fate</span>
              <input v-model.number="selectedSpecies.fate" type="number" />
            </label>

            <label>
              <span>Resilience</span>
              <input v-model.number="selectedSpecies.resilience" type="number" />
            </label>

            <label>
              <span>Extra</span>
              <input v-model.number="selectedSpecies.extra" type="number" />
            </label>

            <label>
              <span>Age Formula</span>
              <input v-model="selectedSpecies.age" type="text" />
            </label>

            <label class="species-builder__checkbox">
              <input v-model="selectedSpecies.extraSpecies" type="checkbox" />
              <span>Show in Extra Species</span>
            </label>
          </div>

          <section class="species-builder__section">
            <h3>Characteristics</h3>

            <div class="species-builder__form-grid species-builder__characteristics-grid">
              <label v-for="key in characteristicKeys" :key="key">
                <span>{{ key.toUpperCase() }}</span>
                <input v-model="selectedSpecies.characteristics[key]" type="text" />
              </label>
            </div>
          </section>

          <section class="species-builder__section">
            <h3>Skills</h3>
            <textarea v-model="skillsText" rows="5" placeholder="One skill per line" />
          </section>

          <section class="species-builder__section">
            <h3>Talents</h3>
            <textarea v-model="talentsText" rows="5" placeholder="One talent per line" />
          </section>

          <section class="species-builder__section">
            <h3>Traits</h3>
            <textarea v-model="traitsText" rows="4" placeholder="One trait per line" />
          </section>
        </template>

        <template v-else>
          <div class="species-builder__empty-state">
            <p>No species selected.</p>
            <button type="button" @click="addSpecies">Create First Species</button>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRaw, watch } from 'vue';
import type { CustomSpeciesDefinition } from '../module/species/types';
import { createEmptySpeciesDefinition } from '../module/species/factories';

const props = defineProps<{
  initialSpecies: CustomSpeciesDefinition[];
  onSave: (species: CustomSpeciesDefinition[]) => Promise<void>;
}>();

const speciesList = ref<CustomSpeciesDefinition[]>(structuredClone(props.initialSpecies));

const selectedSpeciesId = ref<string | null>(speciesList.value[0]?.id ?? null);

const characteristicKeys = ['ws', 'bs', 's', 't', 'i', 'ag', 'dex', 'int', 'wp', 'fel'] as const;

const selectedSpecies = computed(() => {
  return speciesList.value.find((species) => species.id === selectedSpeciesId.value) ?? null;
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

function addSpecies(): void {
  const newSpecies = createEmptySpeciesDefinition();
  speciesList.value.push(newSpecies);
  selectedSpeciesId.value = newSpecies.id;
}

function deleteSelectedSpecies(): void {
  if (!selectedSpecies.value) return;

  const speciesIdToDelete = selectedSpecies.value.id;
  const index = speciesList.value.findIndex((species) => species.id === speciesIdToDelete);

  if (index === -1) return;

  speciesList.value.splice(index, 1);

  if (speciesList.value.length === 0) {
    selectedSpeciesId.value = null;
    return;
  }

  const nextSpecies = speciesList.value[Math.max(0, index - 1)];
  selectedSpeciesId.value = nextSpecies.id;
}

async function save(): Promise<void> {
  await props.onSave(structuredClone(toRaw(speciesList.value)));

  ui.notifications?.info('Species saved. Reload the world to rebuild WFRP species config.');
}

function parseLineList(value: string): string[] {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

watch(
  () => props.initialSpecies,
  (newValue) => {
    speciesList.value = structuredClone(newValue);

    if (!speciesList.value.some((species) => species.id === selectedSpeciesId.value)) {
      selectedSpeciesId.value = speciesList.value[0]?.id ?? null;
    }
  },
);
</script>

<style scoped>
.species-builder {
  height: 100%;
}

.species-builder__layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  height: 100%;
  gap: 0.5rem;
}

.species-builder__sidebar,
.species-builder__editor {
  padding: 0.75rem;
  overflow: auto;
}

.species-builder__sidebar-header,
.species-builder__editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.species-builder__species-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.species-builder__species-item {
  text-align: left;
  padding: 0.5rem;
}

.species-builder__species-item.is-selected {
  outline: 2px solid var(--color-border-highlight, #a88);
}

.species-builder__species-id {
  font-size: 0.8rem;
  opacity: 0.7;
}

.species-builder__editor-actions {
  display: flex;
  gap: 0.5rem;
}

.species-builder__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.species-builder__characteristics-grid {
  grid-template-columns: repeat(5, minmax(90px, 1fr));
}

.species-builder__section {
  margin-bottom: 1rem;
}

.species-builder__section h3 {
  margin-bottom: 0.5rem;
}

.species-builder__section textarea {
  width: 100%;
  resize: vertical;
}

.species-builder__checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.species-builder__empty-state {
  padding: 1rem;
}
</style>

<template>
  <div v-if="selectedSubspecies" class="species-builder__drilldown-content">
    <div class="species-builder__form-grid">
      <label class="species-builder__field">
        <span>Name</span>
        <input v-model="selectedSubspecies.name" type="text" />
      </label>

      <label class="species-builder__field">
        <span>ID</span>
        <input
          :value="selectedSubspeciesIdDraft"
          type="text"
          @input="
            emit('update:selected-subspecies-id-draft', ($event.target as HTMLInputElement).value)
          "
        />
      </label>

      <label class="species-builder__field">
        <span>Movement Override</span>
        <input v-model="subspeciesMovementText" type="number" placeholder="Use species value" />
      </label>

      <label class="species-builder__field">
        <span>Fate Override</span>
        <input v-model="subspeciesFateText" type="number" placeholder="Use species value" />
      </label>

      <label class="species-builder__field">
        <span>Resilience Override</span>
        <input v-model="subspeciesResilienceText" type="number" placeholder="Use species value" />
      </label>

      <label class="species-builder__field">
        <span>Extra Override</span>
        <input v-model="subspeciesExtraText" type="number" placeholder="Use species value" />
      </label>
    </div>

    <div class="species-builder__subspecies-override-toggle">
      <p class="species-builder__eyebrow">Characteristics Override</p>
      <button
        v-if="!subspeciesHasCharacteristicsOverride"
        type="button"
        class="species-builder__button species-builder__button--primary"
        @click="enableSubspeciesCharacteristicsOverride"
      >
        Enable Override
      </button>
      <button
        v-else
        type="button"
        class="species-builder__button species-builder__button--ghost"
        @click="clearSubspeciesCharacteristicsOverride"
      >
        Use Species Defaults
      </button>
    </div>

    <div
      v-if="subspeciesHasCharacteristicsOverride"
      class="species-builder__form-grid species-builder__characteristics-grid"
    >
      <label
        v-for="key in characteristicKeys"
        :key="`subspecies-${key}`"
        class="species-builder__field"
      >
        <span>{{ key.toUpperCase() }}</span>
        <input v-model="selectedSubspecies.characteristics![key]" type="text" />
      </label>
    </div>

    <div class="species-builder__split-sections">
      <section class="species-builder__section species-builder__card">
        <h3>Skills Override</h3>
        <DocumentDrop
          label="Drop skill items here"
          :accepted-drag-types="['Item']"
          :resolve-document="true"
          @drop-document="handleSubspeciesDocumentDrop('skills', $event)"
        />
        <textarea
          v-model="subspeciesSkillsText"
          rows="5"
          placeholder="Leave blank to use species skills"
        />
      </section>

      <section class="species-builder__section species-builder__card">
        <h3>Talents Override</h3>
        <DocumentDrop
          label="Drop talent items here"
          :accepted-drag-types="['Item']"
          :resolve-document="true"
          @drop-document="handleSubspeciesDocumentDrop('talents', $event)"
        />
        <textarea
          v-model="subspeciesTalentsText"
          rows="5"
          placeholder="Leave blank to use species talents"
        />
      </section>
    </div>

    <section class="species-builder__section species-builder__card">
      <h3>Traits Override</h3>
      <DocumentDrop
        label="Drop trait items here"
        :accepted-drag-types="['Item']"
        :resolve-document="true"
        @drop-document="handleSubspeciesDocumentDrop('traits', $event)"
      />
      <textarea
        v-model="subspeciesTraitsText"
        rows="4"
        placeholder="Leave blank to use species traits"
      />
    </section>

    <div class="species-builder__drilldown-actions">
      <button
        type="button"
        class="species-builder__button species-builder__button--ghost"
        @click="$emit('delete')"
      >
        Delete Subspecies
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRaw, watch } from 'vue';
import DocumentDrop from '../../../components/DocumentDrop.vue';
import type {
  CustomSpeciesDefinition,
  CustomSubspeciesDefinition,
  SpeciesCharacteristics,
} from '../../../../shared/types/module';

const props = defineProps<{
  selectedSpecies: CustomSpeciesDefinition;
  selectedSubspecies: CustomSubspeciesDefinition | null;
  selectedSubspeciesIdDraft: string;
  characteristicKeys: readonly (keyof SpeciesCharacteristics)[];
}>();

interface DocumentDropPayload {
  dragData: Record<string, unknown>;
  document: ClientDocument | null;
}

const emit = defineEmits<{
  delete: [];
  'validation-change': [value: string | null];
  'update:selected-subspecies-id-draft': [value: string];
}>();

const duplicateSubspeciesIds = computed(() => {
  const counts = new Map<string, number>();

  for (const subspecies of Object.values(props.selectedSpecies.subspecies ?? {})) {
    const normalizedId = subspecies.id.trim();
    if (!normalizedId) continue;

    counts.set(normalizedId, (counts.get(normalizedId) ?? 0) + 1);
  }

  return counts;
});

const selectedSubspeciesValidationError = computed(() => {
  if (!props.selectedSubspecies) return null;

  if (!props.selectedSubspecies.name.trim()) {
    return 'Subspecies name is required.';
  }

  const normalizedId = props.selectedSubspeciesIdDraft.trim();

  if (!normalizedId) {
    return 'Subspecies ID is required.';
  }

  if ((duplicateSubspeciesIds.value.get(normalizedId) ?? 0) > 1) {
    return 'Subspecies ID must be unique within the species.';
  }

  return null;
});

const subspeciesHasCharacteristicsOverride = computed(() => {
  return Boolean(props.selectedSubspecies?.characteristics);
});

const subspeciesSkillsText = makeOptionalLineListComputed('skills');
const subspeciesTalentsText = makeOptionalLineListComputed('talents');
const subspeciesTraitsText = makeOptionalLineListComputed('traits');
const subspeciesMovementText = makeOptionalNumberComputed('movement');
const subspeciesFateText = makeOptionalNumberComputed('fate');
const subspeciesResilienceText = makeOptionalNumberComputed('resilience');
const subspeciesExtraText = makeOptionalNumberComputed('extra');

function enableSubspeciesCharacteristicsOverride(): void {
  if (!props.selectedSubspecies) return;
  props.selectedSubspecies.characteristics = structuredClone(
    toRaw(props.selectedSpecies.characteristics),
  );
}

function clearSubspeciesCharacteristicsOverride(): void {
  if (!props.selectedSubspecies) return;
  delete props.selectedSubspecies.characteristics;
}

function parseLineList(value: string): string[] {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const normalized = String(value ?? '').trim();
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function setOptionalSubspeciesLineList(
  field: 'skills' | 'talents' | 'traits',
  value: string,
): void {
  if (!props.selectedSubspecies) return;

  const parsed = parseLineList(value);

  if (parsed.length === 0) {
    delete props.selectedSubspecies[field];
    return;
  }

  props.selectedSubspecies[field] = parsed;
}

function makeOptionalLineListComputed(field: 'skills' | 'talents' | 'traits') {
  return computed({
    get: () => props.selectedSubspecies?.[field]?.join('\n') ?? '',
    set: (value: string) => {
      setOptionalSubspeciesLineList(field, value);
    },
  });
}

function setOptionalSubspeciesNumber(
  field: 'movement' | 'fate' | 'resilience' | 'extra',
  value: string | number,
): void {
  if (!props.selectedSubspecies) return;

  const parsed = parseOptionalNumber(value);

  if (parsed === undefined) {
    delete props.selectedSubspecies[field];
    return;
  }

  props.selectedSubspecies[field] = parsed;
}

function makeOptionalNumberComputed(field: 'movement' | 'fate' | 'resilience' | 'extra') {
  return computed({
    get: () => {
      const value = props.selectedSubspecies?.[field];
      return value === undefined ? '' : String(value);
    },
    set: (value: string | number) => {
      setOptionalSubspeciesNumber(field, value);
    },
  });
}

function appendUniqueString(target: string[] | undefined, value: string): string[] {
  const normalized = value.trim();
  if (!normalized) return target ?? [];

  const existing = target ?? [];
  if (existing.includes(normalized)) return existing;

  return [...existing, normalized];
}

function getDroppedItemName(document: ClientDocument | null): string | null {
  if (!document || !('name' in document)) return null;
  return String(document.name ?? '').trim() || null;
}

function getDroppedItemType(document: ClientDocument | null): string | null {
  if (!document || !('type' in document)) return null;
  return String(document.type ?? '').trim() || null;
}

function handleSubspeciesDocumentDrop(
  target: 'skills' | 'talents' | 'traits',
  payload: DocumentDropPayload,
): void {
  if (!props.selectedSubspecies || !payload.document) return;

  const itemName = getDroppedItemName(payload.document);
  const itemType = getDroppedItemType(payload.document);

  if (!itemName || !itemType) return;

  const allowedType = target === 'skills' ? 'skill' : target === 'talents' ? 'talent' : 'trait';

  if (itemType !== allowedType) {
    ui.notifications?.warn(`Dropped ${itemType} cannot be added to subspecies ${target}.`);
    return;
  }

  props.selectedSubspecies[target] = appendUniqueString(props.selectedSubspecies[target], itemName);
}

watch(
  () => selectedSubspeciesValidationError.value,
  (value) => {
    emit('validation-change', value);
  },
  { immediate: true },
);
</script>

<style scoped>
.species-builder__drilldown-content {
  display: grid;
  gap: 0.85rem;
}

.species-builder__drilldown-actions {
  display: flex;
  justify-content: flex-end;
}

.species-builder__subspecies-override-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.65rem;
}

.species-builder__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 0.75rem;
}

.species-builder__characteristics-grid {
  grid-template-columns: repeat(5, minmax(90px, 1fr));
}

.species-builder__field {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.species-builder__field span {
  color: #d3bb9f;
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.species-builder__field input {
  width: 100%;
  border: 1px solid #6f5441;
  border-radius: 7px;
  padding: 0.42rem 0.5rem;
  color: #f1e1ce;
  background: rgb(33 24 19 / 92%);
  font: inherit;
}

.species-builder__section textarea {
  width: 100%;
  min-height: 130px;
  padding: 0.55rem 0.6rem;
  border-radius: 7px;
  border: 1px solid #6f5441;
  background: rgb(33 24 19 / 92%);
  color: #f1e1ce;
  font: inherit;
  line-height: 1.35;
  resize: vertical;
}

.species-builder__split-sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 0.95rem;
}

.species-builder__button {
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 0.42rem 0.72rem;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition:
    transform 0.15s ease,
    filter 0.15s ease,
    border-color 0.15s ease;
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

.species-builder__eyebrow {
  margin: 0 0 0.15rem;
  color: #d3bb9f;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
}

.species-builder__section {
  margin-bottom: 0.95rem;
}

.species-builder__section h3 {
  margin-bottom: 0.7rem;
  color: #f9ebda;
  font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
  letter-spacing: 0.03em;
}

.species-builder__card {
  border: 1px solid rgb(137 103 77 / 72%);
  border-radius: 9px;
  padding: 0.8rem;
  background: linear-gradient(180deg, rgb(90 64 47 / 20%), rgb(46 34 27 / 82%));
}

@media (max-width: 980px) {
  .species-builder__split-sections {
    grid-template-columns: 1fr;
  }

  .species-builder__characteristics-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}

@media (max-width: 620px) {
  .species-builder__form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

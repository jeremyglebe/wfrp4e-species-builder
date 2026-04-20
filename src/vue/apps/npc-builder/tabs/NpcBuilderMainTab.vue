<template>
  <section class="npc-builder__build-grid">
    <div class="npc-builder__build-main">
      <div class="npc-builder__section">
        <div class="npc-builder__section-title">1. Base Statblock</div>
        <div class="npc-builder__hint">
          Choose a base actor from your configured base folder.
        </div>

        <div class="npc-builder__form-group">
          <label>From Base Folder:</label>
          <select v-model="baseActorId" class="npc-builder__select" :disabled="isBusy"
            @change="handleBaseActorSelectionChange">
            <option value="">-- Select Actor --</option>
            <option v-for="actor in baseActors" :key="actor.id" :value="actor.id">
              {{ actor.name }}
            </option>
          </select>
        </div>

        <div class="npc-builder__override-header">
          <div>
            <strong>Base Statblock Override</strong>
            <div class="npc-builder__hint">Optional override for the dropdown selection.</div>
          </div>
          <button type="button" class="npc-builder__button npc-builder__button--small" :disabled="isBusy"
            @click="toggleBaseOverrideDropZone">
            {{ showBaseOverrideDropZone ? 'Collapse' : 'Expand' }}
          </button>
        </div>

        <div v-if="showBaseOverrideDropZone" class="npc-builder__form-group">
          <label>Override (Drag Actor Here):</label>
          <div class="npc-builder__drop-zone" @dragover.prevent @drop="handleBaseActorDrop">
            <div v-if="baseActorOverride" class="npc-builder__override-display">
              <img :src="baseActorOverride.img || ''" class="npc-builder__override-img" />
              <div class="npc-builder__override-info">
                <strong>{{ baseActorOverride.name }}</strong>
                <div class="npc-builder__override-label">Override active</div>
              </div>
              <button type="button" class="npc-builder__button npc-builder__button--ghost"
                @click="setBaseActorOverride(null)">
                Clear
              </button>
            </div>
            <div v-else class="npc-builder__drop-placeholder">
              Drop an Actor here to override the dropdown selection.
            </div>
          </div>
        </div>
      </div>

      <div class="npc-builder__section">
        <div class="npc-builder__section-title">2. Careers</div>
        <div class="npc-builder__hint">
          Final actor name and image come from the last career in the list.
        </div>

        <div class="npc-builder__form-group">
          <label>Drop Career Items Here:</label>
          <div class="npc-builder__drop-zone" @dragover.prevent @drop="handleCareerDrop">
            <div v-if="careers.length" class="npc-builder__drop-hint">
              Drop additional Career Items Here
            </div>
            <div v-else class="npc-builder__drop-placeholder">
              Drop Career Items Here
            </div>
          </div>
        </div>

        <div class="npc-builder__form-group">
          <label>Queued Careers:</label>
          <div class="npc-builder__career-list">
            <div v-if="careers.length === 0" class="npc-builder__empty">No careers added yet.</div>
            <div v-for="(career, index) in careers" :key="`${career.uuid}-${index}`" class="npc-builder__career-row">
              <img :src="career.img || ''" class="npc-builder__career-img" />
              <div class="npc-builder__career-info">
                <strong>{{ career.name }}</strong>
                <div class="npc-builder__career-meta">
                  Group: {{ career.careergroup || '-' }} | Level: {{ career.level ?? '-' }}
                  <span v-if="index === careers.length - 1" class="npc-builder__final-label">| Final
                    Career</span>
                </div>
              </div>

              <div class="npc-builder__career-controls">
                <div class="npc-builder__quantity-control">
                  <label>Qty</label>
                  <input :value="career.quantity" type="number" min="1" class="npc-builder__quantity-input"
                    @input="onCareerQuantityInput(index, $event)" />
                </div>

                <div class="npc-builder__button-group">
                  <button type="button" class="npc-builder__button npc-builder__button--small"
                    @click="moveCareer(index, -1)" :disabled="index === 0 || isBusy">
                    ↑
                  </button>
                  <button type="button" class="npc-builder__button npc-builder__button--small"
                    @click="moveCareer(index, 1)" :disabled="index === careers.length - 1 || isBusy">
                    ↓
                  </button>
                  <button type="button" class="npc-builder__button npc-builder__button--small"
                    @click="removeCareer(index)" :disabled="isBusy">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="npc-builder__build-side">
      <div class="npc-builder__section">
        <div class="npc-builder__section-title">Build Summary</div>
        <div class="npc-builder__summary-top">
          <div class="npc-builder__summary-image">
            <img v-if="finalCareer?.img" :src="finalCareer.img" alt="Final career preview" />
            <div v-else class="npc-builder__drop-placeholder">No Preview</div>
          </div>
          <div class="npc-builder__summary-info">
            <div class="npc-builder__summary-label">Final Name</div>
            <div class="npc-builder__summary-value">{{ previewName }}</div>
            <div class="npc-builder__summary-label">Preview Note</div>
            <div class="npc-builder__summary-note">{{ previewImageNote }}</div>
          </div>
        </div>

        <div class="npc-builder__summary-grid">
          <div class="npc-builder__summary-card">
            <div class="npc-builder__summary-label">Base Actor</div>
            <div class="npc-builder__summary-value">{{ baseActorSummary?.name || 'None selected' }}</div>
            <div class="npc-builder__summary-note">{{ baseActorSummary?.source || '' }}</div>
          </div>
          <div class="npc-builder__summary-card">
            <div class="npc-builder__summary-label">Career Rows</div>
            <div class="npc-builder__summary-value">{{ careers.length }}</div>
            <div class="npc-builder__summary-note">Total instances: {{ totalCareerInstances }}</div>
          </div>
        </div>
      </div>

      <div class="npc-builder__section">
        <div class="npc-builder__section-title">Quick Traits</div>
        <div class="npc-builder__hint">
          Source folder: {{ settings.quickTraitsFolderName || 'NPC Builder Quick Traits' }}
        </div>

        <div class="npc-builder__alloc-actions">
          <span>Add</span>
          <input v-model.number="randomTraitCount" type="number" min="1" class="npc-builder__quantity-input"
            style="width: 64px;" />
          <span>Random Traits</span>
          <button type="button" class="npc-builder__button npc-builder__button--small"
            :disabled="isBusy || quickTraitOptions.length === 0" @click="onRandomTraits">
            +
          </button>
        </div>

        <div v-if="quickTraitOptions.length === 0" class="npc-builder__empty">
          No quick traits found in the configured folder.
        </div>

        <div v-else class="npc-builder__button-group" style="flex-wrap: wrap; gap: 6px;">
          <button v-for="option in quickTraitOptions" :key="option.key" type="button"
            class="npc-builder__button npc-builder__button--small"
            :class="{ 'npc-builder__button--ghost': hasUserTrait(option.name) }" :disabled="isBusy"
            @click="onQuickAddTrait(option.uuid)">
            {{ option.name }}
            <span v-if="hasUserTrait(option.name)"> (Added)</span>
          </button>
        </div>
      </div>

      <div class="npc-builder__section">
        <div class="npc-builder__section-title">Build</div>
        <div class="npc-builder__hint">Fast-path build remains on Main for current workflow.</div>
        <button type="button" class="npc-builder__button npc-builder__button--primary" @click="onBuildNpc"
          :disabled="isBusy">
          Build NPC
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import type { BaseActorOption, CareerEntry } from '../../../../types/module';
import { getActorFolderByName } from '../../../../module/services/settings/npcs';
import { getSpeciesName } from '../../../../module/services/npc-builder-naming';
import { CareerIndexService } from '../../../../module/services/career-index-service';
import { useNpcBuilderStore } from '../../../stores';

/**
 * Main tab: preserves the current fast workflow (base actor + careers + build)
 * and keeps the at-a-glance summary visible while preparing the app for future
 * feature tabs.
 */
const props = defineProps<{
  onBuildNpc: () => Promise<void>;
}>();

const store = useNpcBuilderStore();
const {
  removeCareer,
  moveCareer,
  setBaseActorOverride,
  addOrIncrementCareer,
  setCareerQuantity,
  toggleQuickTraitByUuid,
  addRandomQuickTraits,
  hasUserTrait,
} = store;

const {
  baseActorId,
  baseActorOverride,
  careers,
  showBaseOverrideDropZone,
  settings,
  isBusy,
  quickTraitOptions,
} = storeToRefs(store);

const randomTraitCount = ref(1);

const careerIndex = new CareerIndexService({
  getCareerGroup: (item) => getCareerGroup(item),
  getCareerLevel: (item) => getCareerLevel(item),
});

const baseActors = computed<BaseActorOption[]>(() => {
  const baseFolder = getActorFolderByName(settings.value.baseFolderName);
  if (!baseFolder) {
    return [];
  }

  return (game.actors?.contents ?? [])
    .filter((actor: any) => actor.folder?.id === baseFolder.id)
    .map((actor: any) => ({
      id: actor.id,
      name: actor.name,
      img: actor.img,
      species: getSpeciesName(actor),
    }))
    .sort((a: BaseActorOption, b: BaseActorOption) => a.name.localeCompare(b.name));
});

const finalCareer = computed(() => {
  return careers.value.length ? careers.value[careers.value.length - 1] : null;
});

const selectedBaseActor = computed(() => {
  return baseActors.value.find((actor) => actor.id === baseActorId.value) ?? null;
});

const baseActorSummary = computed(() => {
  if (baseActorOverride.value) {
    return {
      name: baseActorOverride.value.name,
      img: baseActorOverride.value.img || '',
      source: 'Override',
    };
  }

  if (selectedBaseActor.value) {
    return {
      name: selectedBaseActor.value.name,
      img: selectedBaseActor.value.img,
      source: 'Base Folder',
    };
  }

  return null;
});

const previewName = computed(() => {
  if (!finalCareer.value) {
    return 'No final career selected yet';
  }

  const previewSpecies = baseActorOverride.value?.species || selectedBaseActor.value?.species || '';
  if (!settings.value.includeSpeciesInName) {
    return finalCareer.value.name;
  }

  return previewSpecies ? `${previewSpecies} ${finalCareer.value.name}` : `[Species] ${finalCareer.value.name}`;
});

const previewImageNote = computed(() => {
  return settings.value.enhanceImage
    ? 'Live preview uses source image only. Enhancement is applied during build.'
    : 'Live preview uses source image.';
});

const totalCareerInstances = computed(() => {
  return careers.value.reduce((sum, career) => {
    return sum + (Number.isFinite(career.quantity) ? career.quantity : 1);
  }, 0);
});

function onQuickAddTrait(uuid: string): void {
  const result = toggleQuickTraitByUuid(uuid);
  if (!result) {
    ui.notifications?.warn('Could not add selected trait.');
  }
}

function onRandomTraits(): void {
  const requestedCount = Math.max(1, Math.floor(Number(randomTraitCount.value) || 1));
  const added = addRandomQuickTraits(requestedCount);
  if (!added.length) {
    ui.notifications?.warn('No matching traits available to add.');
    return;
  }

  ui.notifications?.info(`Added ${added.length} random trait${added.length === 1 ? '' : 's'}.`);
}

function handleBaseActorSelectionChange(): void {
  if (baseActorId.value) {
    setBaseActorOverride(null);
    showBaseOverrideDropZone.value = false;
  }
}

function toggleBaseOverrideDropZone(): void {
  showBaseOverrideDropZone.value = !showBaseOverrideDropZone.value;
}

function getCareerGroup(item: any): string {
  return item?.system?.careergroup?.value?.toString().trim() ?? '';
}

function getCareerLevel(item: any): number | null {
  const rawLevel = item?.system?.level?.value;
  const numericLevel = Number(rawLevel);
  return Number.isFinite(numericLevel) ? numericLevel : null;
}

function makeCareerEntry(careerItem: any, quantity = 1): CareerEntry {
  return {
    name: careerItem.name,
    uuid: careerItem.uuid,
    img: careerItem.img || '',
    careergroup: getCareerGroup(careerItem),
    level: getCareerLevel(careerItem),
    quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
  };
}

function onCareerQuantityInput(index: number, event: Event): void {
  const input = event.target as HTMLInputElement | null;
  if (!input) return;
  const quantity = Number(input.value);
  setCareerQuantity(index, quantity);
}

async function handleBaseActorDrop(event: DragEvent): Promise<void> {
  if (isBusy.value) return;
  event.preventDefault();

  let draggedItemData: any;
  try {
    draggedItemData = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
  } catch {
    ui.notifications?.warn('Could not read dropped data.');
    return;
  }

  let droppedActor: any | null = null;

  if (draggedItemData.type === 'Actor' && draggedItemData.uuid) {
    droppedActor = await fromUuid(draggedItemData.uuid);
  } else if (draggedItemData.type === 'Actor' && draggedItemData.id) {
    droppedActor = game.actors?.get(draggedItemData.id) ?? null;
  } else if (draggedItemData.type === 'Token' && draggedItemData.uuid) {
    const tokenDocument = await fromUuid(draggedItemData.uuid);
    droppedActor = (tokenDocument as any)?.actor ?? null;
  }

  if (!droppedActor || droppedActor.documentName !== 'Actor') {
    ui.notifications?.warn('Drop an Actor here.');
    return;
  }

  setBaseActorOverride({
    id: droppedActor.id ?? '',
    uuid: droppedActor.uuid,
    name: droppedActor.name,
    img: droppedActor.img || '',
    species: getSpeciesName(droppedActor),
  });
}

async function handleCareerDrop(event: DragEvent): Promise<void> {
  if (isBusy.value) return;
  event.preventDefault();

  let draggedItemData: any;
  try {
    draggedItemData = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
  } catch {
    ui.notifications?.warn('Could not read dropped data.');
    return;
  }

  if (draggedItemData.type !== 'Item') {
    ui.notifications?.warn('Only Item drops are supported here.');
    return;
  }

  const droppedCareerItem = await fromUuid(draggedItemData.uuid);
  if (!droppedCareerItem) {
    ui.notifications?.error('Could not resolve dropped item.');
    return;
  }

  if ((droppedCareerItem as any).type !== 'career') {
    ui.notifications?.warn('Only Career items can be dropped here.');
    return;
  }

  const droppedCareerEntry = makeCareerEntry(droppedCareerItem, 1);

  if (!settings.value.autoAddLowerCareers) {
    const beforeLength = careers.value.length;
    addOrIncrementCareer(droppedCareerEntry, 1);
    if (careers.value.length === beforeLength) {
      const existing = careers.value.find((career) => career.uuid === droppedCareerEntry.uuid);
      if (existing) {
        ui.notifications?.info(`Increased "${existing.name}" quantity to ${existing.quantity}.`);
      }
    }
    return;
  }

  isBusy.value = true;
  try {
    const lowerCareersFound = await careerIndex.getLowerCareersFor(droppedCareerItem, careers.value);

    for (const indexedCareer of lowerCareersFound) {
      addOrIncrementCareer(
        {
          name: indexedCareer.name,
          uuid: indexedCareer.uuid,
          img: indexedCareer.img || '',
          careergroup: indexedCareer.careergroup,
          level: indexedCareer.level,
          quantity: 1,
        },
        1,
      );
    }

    addOrIncrementCareer(droppedCareerEntry, 1);

    if (lowerCareersFound.length) {
      ui.notifications?.info(`Added ${lowerCareersFound.length} lower career(ies) before "${droppedCareerEntry.name}".`);
    }
  } finally {
    isBusy.value = false;
  }
}
</script>

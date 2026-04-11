<template>
  <div class="npc-builder application">
    <div v-if="isBusy" class="npc-builder__overlay">
      <div class="npc-builder__busy-dialog">
        <div class="npc-builder__busy-title">Working...</div>
        <div class="npc-builder__busy-message">{{ busyMessage || 'Please wait.' }}</div>
      </div>
    </div>

    <div class="npc-builder__content">
      <!-- Settings Section -->
      <div class="npc-builder__section">
        <div class="npc-builder__section-title">Folder Settings</div>

        <div class="npc-builder__form-group">
          <label>Base Folder Name:</label>
          <div class="npc-builder__input-row">
            <input v-model="settings.baseFolderName" type="text" class="npc-builder__input" />
            <button type="button" class="npc-builder__button npc-builder__button--primary" @click="saveFolderSettings"
              :disabled="isBusy">
              Save
            </button>
          </div>
          <div class="npc-builder__status">
            <span :style="{ color: baseFolderFound ? '#888' : '#d35400' }">
              {{ baseFolderFound ? '✓ Found' : '✗ Not found yet' }}
            </span>
          </div>
        </div>

        <div class="npc-builder__form-group">
          <label>Output Folder Name:</label>
          <input v-model="settings.outputFolderName" type="text" class="npc-builder__input" />
          <div class="npc-builder__status">
            <span :style="{ color: outputFolderFound ? '#888' : '#d35400' }">
              {{ outputFolderFound ? '✓ Found' : '✗ Not found yet' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Base Actor Selection -->
      <div class="npc-builder__section">
        <div class="npc-builder__section-title">Base Statblock</div>

        <div class="npc-builder__form-group">
          <label>From Base Folder:</label>
          <select v-model="baseActorId" class="npc-builder__select" :disabled="isBusy">
            <option value="">-- Select Actor --</option>
            <option v-for="actor in baseActors" :key="actor.id" :value="actor.id">
              {{ actor.name }}
            </option>
          </select>
        </div>

        <div class="npc-builder__form-group">
          <label>Override (Drag Actor Here):</label>
          <div class="npc-builder__drop-zone" @dragover.prevent @drop="handleBaseActorDrop">
            <div v-if="baseActorOverride" class="npc-builder__override-display">
              <img :src="baseActorOverride.img || ''" class="npc-builder__override-img" />
              <div class="npc-builder__override-info">
                <strong>{{ baseActorOverride.name }}</strong>
                <div class="npc-builder__override-label">Override active</div>
              </div>
              <button type="button" class="npc-builder__button npc-builder__button--ghost"
                @click="baseActorOverride = null">
                Clear
              </button>
            </div>
            <div v-else class="npc-builder__drop-placeholder">
              Drop an Actor here to override the dropdown selection.
            </div>
          </div>
        </div>
      </div>

      <!-- Options -->
      <div class="npc-builder__section">
        <div class="npc-builder__section-title">Options</div>

        <label class="npc-builder__checkbox">
          <input v-model="settings.includeSpeciesInName" type="checkbox" />
          <span>Include Species / Ancestry / Race in Actor Name</span>
        </label>

        <label class="npc-builder__checkbox">
          <input v-model="settings.autoAddLowerCareers" type="checkbox" />
          <span>Auto-add lower careers from same career group</span>
        </label>
        <div class="npc-builder__hint">
          Searches world items and all item compendiums. Lower careers are inserted before the dropped career.
        </div>

        <label class="npc-builder__checkbox">
          <input v-model="settings.enhanceImage" type="checkbox" />
          <span>Enhance Image?</span>
        </label>

        <label class="npc-builder__checkbox">
          <input v-model="settings.circularToken" type="checkbox" />
          <span>Circular Token?</span>
        </label>
      </div>

      <!-- Career Queue -->
      <div class="npc-builder__section">
        <div class="npc-builder__section-title">Careers</div>

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
          <div class="npc-builder__hint">
            Final actor name and image come from the <b>last</b> career in the list.
          </div>
        </div>

        <div class="npc-builder__form-group">
          <label>Queued Careers:</label>
          <div class="npc-builder__career-list">
            <div v-if="careers.length === 0" class="npc-builder__empty">
              No careers added yet.
            </div>
            <div v-for="(career, index) in careers" :key="`${career.uuid}-${index}`" class="npc-builder__career-row">
              <img :src="career.img || ''" class="npc-builder__career-img" />
              <div class="npc-builder__career-info">
                <strong>{{ career.name }}</strong>
                <div class="npc-builder__career-meta">
                  Group: {{ career.careergroup || '-' }} | Level: {{ career.level ?? '-' }}
                  <span v-if="index === careers.length - 1" class="npc-builder__final-label">| Final Career</span>
                </div>
              </div>

              <div class="npc-builder__career-controls">
                <div class="npc-builder__quantity-control">
                  <label>Qty</label>
                  <input v-model.number="career.quantity" type="number" min="1" class="npc-builder__quantity-input" />
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

    <!-- Footer Actions -->
    <div class="npc-builder__footer">
      <button type="button" class="npc-builder__button npc-builder__button--primary" @click="buildNPC"
        :disabled="isBusy">
        Build NPC
      </button>
      <button type="button" class="npc-builder__button npc-builder__button--ghost" @click="close" :disabled="isBusy">
        Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { x8 } from '@upscalerjs/esrgan-thick';
import type { BaseActorOption, BaseActorOverride, CareerEntry, NPCBuilderSettings } from '../../types/module';
import {
  getActorFolderByName,
  getOrCreateActorFolderByName,
  loadNPCBuilderSettings,
  normalizeFolderName,
  saveNPCBuilderSettings,
} from '../../module/services/npc-builder-settings';
import { buildFinalName } from '../../module/services/npc-builder-naming';
import { CareerIndexService } from '../../module/services/career-index-service';

type CloseCallback = () => void;

const props = defineProps<{
  onClose?: CloseCallback;
}>();

const baseActorId = ref('');
const baseActorOverride = ref<BaseActorOverride | null>(null);
const careers = ref<CareerEntry[]>([]);
const settings = ref<NPCBuilderSettings>(loadNPCBuilderSettings());
const isBusy = ref(false);
const busyMessage = ref('');
let upscalerInstance: any = null;

const careerIndex = new CareerIndexService({
  getCareerGroup: (item) => getCareerGroup(item),
  getCareerLevel: (item) => getCareerLevel(item),
});

const baseActors = computed(() => {
  const baseFolder = getActorFolderByName(settings.value.baseFolderName);
  if (!baseFolder) {
    return [];
  }

  return (game.actors?.contents ?? [])
    .filter((actor: any) => actor.folder?.id === baseFolder.id)
    .map((actor: any) => ({ id: actor.id, name: actor.name, img: actor.img }))
    .sort((a: BaseActorOption, b: BaseActorOption) => a.name.localeCompare(b.name));
});

const baseFolderFound = computed(() => {
  return Boolean(getActorFolderByName(settings.value.baseFolderName));
});

const outputFolderFound = computed(() => {
  return Boolean(getActorFolderByName(settings.value.outputFolderName));
});

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

function findCareerIndexByUuid(uuid: string): number {
  return careers.value.findIndex((career) => career.uuid === uuid);
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

  baseActorOverride.value = {
    id: droppedActor.id ?? '',
    uuid: droppedActor.uuid,
    name: droppedActor.name,
    img: droppedActor.img || '',
  };
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

  await addCareerToQueue(droppedCareerItem);
}

async function addCareerToQueue(item: any): Promise<void> {
  const existingCareerIndex = findCareerIndexByUuid(item.uuid);

  if (existingCareerIndex >= 0) {
    const existingCareer = careers.value[existingCareerIndex];
    if (existingCareer) {
      existingCareer.quantity = Math.max(
        1,
        Math.floor(Number(existingCareer.quantity) || 1) + 1,
      );
      ui.notifications?.info(`Increased "${item.name}" quantity to ${existingCareer.quantity}.`);
    }
    return;
  }

  const droppedCareerEntry = makeCareerEntry(item, 1);

  if (!settings.value.autoAddLowerCareers) {
    careers.value.push(droppedCareerEntry);
    return;
  }

  isBusy.value = true;
  busyMessage.value = `Searching for lower careers in group "${getCareerGroup(item) || 'Unknown'}"...`;

  try {
    const lowerCareersFound = await careerIndex.getLowerCareersFor(item, careers.value);
    const lowerCareerEntries = lowerCareersFound.map((indexedCareer) => ({
      name: indexedCareer.name,
      uuid: indexedCareer.uuid,
      img: indexedCareer.img || '',
      careergroup: indexedCareer.careergroup,
      level: indexedCareer.level,
      quantity: 1,
    }));

    for (const lowerCareerEntry of lowerCareerEntries) {
      const existingIndex = findCareerIndexByUuid(lowerCareerEntry.uuid);
      if (existingIndex >= 0) {
        const existing = careers.value[existingIndex];
        if (existing) {
          existing.quantity += 1;
        }
      } else {
        careers.value.push(lowerCareerEntry);
      }
    }

    careers.value.push(droppedCareerEntry);

    if (lowerCareerEntries.length) {
      ui.notifications?.info(`Added ${lowerCareerEntries.length} lower career(ies) before "${item.name}".`);
    }
  } finally {
    isBusy.value = false;
    busyMessage.value = '';
  }
}

function removeCareer(index: number): void {
  careers.value.splice(index, 1);
}

function moveCareer(index: number, direction: -1 | 1): void {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= careers.value.length) return;

  const sourceCareer = careers.value[index];
  const targetCareer = careers.value[targetIndex];
  if (sourceCareer && targetCareer) {
    [careers.value[index], careers.value[targetIndex]] = [targetCareer, sourceCareer];
  }
}

async function saveFolderSettings(): Promise<void> {
  settings.value.baseFolderName = normalizeFolderName(settings.value.baseFolderName);
  settings.value.outputFolderName = normalizeFolderName(settings.value.outputFolderName);
  await saveNPCBuilderSettings(settings.value);

  if (settings.value.baseFolderName) {
    await getOrCreateActorFolderByName(settings.value.baseFolderName);
  }

  ui.notifications?.info('NPC Builder folder settings saved.');
}

async function resolveBaseActor(): Promise<any | null> {
  if (baseActorOverride.value?.uuid) {
    const overrideActor = await fromUuid(baseActorOverride.value.uuid);
    if (overrideActor?.documentName === 'Actor') {
      return overrideActor;
    }
  }

  if (baseActorId.value) {
    const selectedActor = game.actors?.get(baseActorId.value);
    if (selectedActor) {
      return selectedActor;
    }
  }

  return null;
}

async function getUpscalerLazy(): Promise<any> {
  if (!upscalerInstance) {
    // Dynamically import Upscaler only when needed for image enhancement
    const { default: Upscaler } = await import('upscaler');
    upscalerInstance = new Upscaler({
      model: x8,
    });
  }
  return upscalerInstance;
}

async function upscaleAndApplyActorImage(actor: any, imageSource: string): Promise<void> {
  if (!actor || !imageSource) return;

  try {
    const upscaler = await getUpscalerLazy();
    const upscaledImageSource = await upscaler.upscale(imageSource);

    if (!upscaledImageSource || upscaledImageSource === imageSource) {
      return;
    }

    let circularTokenSource = upscaledImageSource;
    if (settings.value.circularToken) {
      try {
        circularTokenSource = await buildCircularTokenImage(upscaledImageSource);
      } catch (error) {
        console.warn('NPC Builder token circle crop failed after upscale:', error);
      }
    }

    await actor.update({
      img: upscaledImageSource,
      'prototypeToken.texture.src': circularTokenSource,
    });

    ui.notifications?.info(`Enhanced token image for "${actor.name}".`);
  } catch (error) {
    console.warn('NPC Builder upscaling failed:', error);
    ui.notifications?.warn('Could not upscale token image, using original icon.');
  }
}

async function buildNPC(): Promise<void> {
  const baseActorToUse = await resolveBaseActor();
  if (!baseActorToUse) {
    ui.notifications?.error('Select a base actor or drop an override actor.');
    return;
  }

  if (!careers.value.length) {
    ui.notifications?.error('Add at least one career.');
    return;
  }

  isBusy.value = true;
  busyMessage.value = 'Creating actor and embedding careers...';

  try {
    const finalCareerEntry = careers.value[careers.value.length - 1];
    const normalizedBaseFolderName = normalizeFolderName(settings.value.baseFolderName);
    const normalizedOutputFolderName = normalizeFolderName(settings.value.outputFolderName);

    if (normalizedBaseFolderName) {
      await getOrCreateActorFolderByName(normalizedBaseFolderName);
    }

    let outputFolderToUse: any | null = null;
    if (normalizedOutputFolderName) {
      outputFolderToUse = await getOrCreateActorFolderByName(normalizedOutputFolderName);
    }

    const newActorData = baseActorToUse.toObject();
    delete newActorData._id;

    if (outputFolderToUse) {
      newActorData.folder = outputFolderToUse.id;
    }

    const createdActor = await Actor.create(newActorData);
    if (!createdActor) {
      throw new Error('Failed to create actor.');
    }

    for (const careerEntryInQueue of careers.value) {
      const careerItemToEmbed = await fromUuid(careerEntryInQueue.uuid);
      if (!careerItemToEmbed) continue;

      const careerItemData: any = careerItemToEmbed.toObject();
      delete (careerItemData as any)._id;

      const careerQuantity = Math.max(1, Math.floor(Number(careerEntryInQueue.quantity) || 1));
      for (let addCount = 0; addCount < careerQuantity; addCount++) {
        await createdActor.createEmbeddedDocuments('Item', [careerItemData]);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    const finalCareerItem = finalCareerEntry ? await fromUuid(finalCareerEntry.uuid) : null;
    const finalCareerName = (finalCareerItem as any)?.name || finalCareerEntry?.name || createdActor.name;
    const finalCareerImage = (finalCareerItem as any)?.img || finalCareerEntry?.img || createdActor.img;

    const finalNPCName = buildFinalName(createdActor, finalCareerName, settings.value.includeSpeciesInName);

    let finalTokenTexture = finalCareerImage;
    if (settings.value.circularToken) {
      try {
        finalTokenTexture = await buildCircularTokenImage(finalCareerImage);
      } catch (error) {
        console.warn('NPC Builder token circle crop failed:', error);
      }
    }

    const updateDataForActor = {
      name: finalNPCName,
      img: finalCareerImage,
      prototypeToken: {
        name: finalNPCName,
        texture: { src: finalTokenTexture },
      },
    };

    await createdActor.update(updateDataForActor);
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (createdActor.sheet) {
      createdActor.sheet.render(true);
    }
    ui.notifications?.info(`Created NPC "${finalNPCName}".`);

    // Asynchronously enhance the image if enabled (non-blocking)
    if (settings.value.enhanceImage) {
      void upscaleAndApplyActorImage(createdActor, finalCareerImage);
    }

    baseActorOverride.value = null;
    careers.value = [];
  } catch (error) {
    console.error('NPC Builder error:', error);
    ui.notifications?.error('Failed to build NPC. Check the console for details.');
  } finally {
    isBusy.value = false;
    busyMessage.value = '';
  }
}

async function buildCircularTokenImage(imageSource: string): Promise<string> {
  const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${imageSource}`));
    img.src = imageSource;
  });

  const sourceSize = Math.min(imageElement.naturalWidth, imageElement.naturalHeight);
  if (!sourceSize || !Number.isFinite(sourceSize)) {
    throw new Error('Image has invalid dimensions.');
  }

  const tokenTextureSize = Math.max(128, Math.min(512, sourceSize));
  const sourceX = (imageElement.naturalWidth - sourceSize) / 2;
  const sourceY = (imageElement.naturalHeight - sourceSize) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = tokenTextureSize;
  canvas.height = tokenTextureSize;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create canvas context.');
  }

  context.clearRect(0, 0, tokenTextureSize, tokenTextureSize);
  context.beginPath();
  context.arc(tokenTextureSize / 2, tokenTextureSize / 2, tokenTextureSize / 2, 0, Math.PI * 2);
  context.closePath();
  context.clip();

  context.drawImage(imageElement, sourceX, sourceY, sourceSize, sourceSize, 0, 0, tokenTextureSize, tokenTextureSize);

  try {
    return canvas.toDataURL('image/webp', 0.92);
  } catch {
    return canvas.toDataURL('image/png');
  }
}

function close(): void {
  props.onClose?.();
}

watch(
  () => settings.value,
  (newSettings) => {
    void saveNPCBuilderSettings(newSettings);
  },
  { deep: true },
);
</script>

<style scoped>
.npc-builder {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #f1e1ce;
  font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
  background: linear-gradient(180deg, rgb(58 43 33 / 40%), rgb(35 27 22 / 94%));
  overflow: hidden;
}

.npc-builder__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.npc-builder__busy-dialog {
  background: #222;
  border: 1px solid #666;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.4);
  text-align: center;
  min-width: 260px;
}

.npc-builder__busy-title {
  font-size: 18px;
  margin-bottom: 8px;
}

.npc-builder__busy-message {
  font-size: 13px;
  color: #bbb;
}

.npc-builder__content {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.npc-builder__section {
  border: 1px solid rgb(137 103 77 / 72%);
  border-radius: 8px;
  padding: 12px;
  background: linear-gradient(180deg, rgb(90 64 47 / 20%), rgb(46 34 27 / 82%));
}

.npc-builder__section-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #f9ebda;
  font-size: 14px;
  letter-spacing: 0.05em;
}

.npc-builder__form-group {
  margin-bottom: 10px;
}

.npc-builder__form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #d3bb9f;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.npc-builder__input,
.npc-builder__select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #6f5441;
  border-radius: 4px;
  background: rgb(33 24 19 / 92%);
  color: #f1e1ce;
  font: inherit;
  box-sizing: border-box;
}

.npc-builder__input-row {
  display: flex;
  gap: 6px;
}

.npc-builder__input-row .npc-builder__input {
  flex: 1 1 auto;
}

.npc-builder__status {
  font-size: 11px;
  margin-top: 2px;
}

.npc-builder__drop-zone {
  border: 2px dashed #888;
  padding: 10px;
  min-height: 60px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.npc-builder__drop-placeholder,
.npc-builder__drop-hint {
  color: #888;
  font-size: 13px;
  text-align: center;
}

.npc-builder__override-display {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.npc-builder__override-img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border: 1px solid #666;
  border-radius: 4px;
  flex: 0 0 auto;
}

.npc-builder__override-info {
  flex: 1 1 auto;
  min-width: 0;
}

.npc-builder__override-label {
  font-size: 11px;
  color: #888;
}

.npc-builder__checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  cursor: pointer;
}

.npc-builder__checkbox input {
  cursor: pointer;
}

.npc-builder__hint {
  font-size: 11px;
  color: #888;
  margin-left: 22px;
  margin-bottom: 6px;
}

.npc-builder__career-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
}

.npc-builder__empty {
  color: #888;
  font-size: 13px;
  padding: 10px;
  text-align: center;
}

.npc-builder__career-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid rgb(137 103 77 / 50%);
  border-radius: 4px;
  background: rgba(33, 24, 19, 0.5);
}

.npc-builder__career-img {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border: 1px solid #666;
  border-radius: 3px;
  flex: 0 0 auto;
}

.npc-builder__career-info {
  flex: 1 1 auto;
  min-width: 0;
}

.npc-builder__career-info strong {
  display: block;
  font-size: 12px;
}

.npc-builder__career-meta {
  font-size: 10px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.npc-builder__final-label {
  font-weight: bold;
  color: #d9a44f;
}

.npc-builder__career-controls {
  display: flex;
  gap: 6px;
  align-items: center;
  flex: 0 0 auto;
}

.npc-builder__quantity-control {
  display: flex;
  align-items: center;
  gap: 3px;
}

.npc-builder__quantity-control label {
  font-size: 10px;
  color: #888;
  margin: 0;
}

.npc-builder__quantity-input {
  width: 50px !important;
  padding: 4px 6px !important;
  text-align: center;
  font-size: 12px;
}

.npc-builder__button-group {
  display: flex;
  gap: 2px;
}

.npc-builder__button {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: transform 0.15s ease, filter 0.15s ease, border-color 0.15s ease;
}

.npc-builder__button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.npc-builder__button:not(:disabled):hover {
  transform: translateY(-1px);
  filter: brightness(1.07);
}

.npc-builder__button--primary {
  border-color: rgb(201 145 75 / 70%);
  color: #27190f;
  background: linear-gradient(180deg, #e8ba72, #c28a3d);
}

.npc-builder__button--ghost {
  border-color: rgb(205 103 89 / 60%);
  color: #f7d4ca;
  background: rgb(148 60 50 / 26%);
}

.npc-builder__button--small {
  padding: 3px 6px;
  font-size: 11px;
  border-color: rgb(205 103 89 / 60%);
  color: #d3bb9f;
  background: rgb(100 60 50 / 20%);
}

.npc-builder__footer {
  padding: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex: 0 0 auto;
}
</style>

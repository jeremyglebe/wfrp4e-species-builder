<template>
  <div class="npc-builder application">
    <div v-if="isBusy" class="npc-builder__overlay">
      <div class="npc-builder__busy-dialog">
        <div class="npc-builder__busy-title">Working...</div>
        <div class="npc-builder__busy-message">{{ busyMessage || 'Please wait.' }}</div>
      </div>
    </div>

    <div v-if="unresolvedDialog" class="npc-builder__overlay">
      <div class="npc-builder__unresolved-dialog">
        <div class="npc-builder__unresolved-title">Unresolved Trappings</div>
        <p class="npc-builder__unresolved-copy">
          The following career-derived trappings could not be matched to any item in the compendium
          or world. You can ignore them (skip creating them), create blank placeholder items, or
          cancel the build to review the Trappings tab.
        </p>
        <ul class="npc-builder__unresolved-list">
          <li v-for="entry in unresolvedDialog.entries" :key="entry.key" class="npc-builder__unresolved-item">
            <span class="npc-builder__unresolved-name">{{ entry.name }}</span>
            <span class="npc-builder__unresolved-src">{{ entry.sourceSummary }}</span>
          </li>
        </ul>
        <div class="npc-builder__unresolved-actions">
          <button type="button" class="npc-builder__button" @click="onUnresolvedChoice('ignore')">
            Ignore Unresolved
          </button>
          <button type="button" class="npc-builder__button npc-builder__button--ghost"
            @click="onUnresolvedChoice('blanks')">
            Create Blank Items
          </button>
          <button type="button" class="npc-builder__button npc-builder__button--ghost"
            @click="onUnresolvedChoice('cancel')">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <div class="npc-builder__tabs">
      <button type="button" class="npc-builder__tab" :class="{ 'is-active': activeTab === 'main' }"
        @click="activeTab = 'main'" :disabled="isBusy">
        Main
      </button>
      <button type="button" class="npc-builder__tab" :class="{ 'is-active': activeTab === 'skills-talents' }"
        @click="activeTab = 'skills-talents'" :disabled="isBusy">
        Skills & Talents
      </button>
      <button type="button" class="npc-builder__tab" :class="{ 'is-active': activeTab === 'traits' }"
        @click="activeTab = 'traits'" :disabled="isBusy">
        Traits
      </button>
      <button type="button" class="npc-builder__tab" :class="{ 'is-active': activeTab === 'trappings' }"
        @click="activeTab = 'trappings'" :disabled="isBusy">
        Trappings
      </button>
      <button type="button" class="npc-builder__tab" :class="{ 'is-active': activeTab === 'settings' }"
        @click="activeTab = 'settings'" :disabled="isBusy">
        Settings
      </button>
    </div>

    <div class="npc-builder__content">
      <NpcBuilderMainTab v-if="activeTab === 'main'" :on-build-npc="buildNPC" />

      <NpcBuilderSkillsTalentsTab v-else-if="activeTab === 'skills-talents'" />
      <NpcBuilderTraitsTab v-else-if="activeTab === 'traits'" />
      <NpcBuilderTrappingsTab v-else-if="activeTab === 'trappings'" />
      <NpcBuilderSettingsTab v-else />
    </div>

    <div class="npc-builder__footer">
      <button type="button" class="npc-builder__button npc-builder__button--ghost" @click="close" :disabled="isBusy">
        Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { x8 } from '@upscalerjs/esrgan-thick';
import {
  getOrCreateActorFolderByName,
  normalizeFolderName,
} from '../../../module/services/settings/npcs';
import { buildFinalName } from '../../../module/services/npc-builder-naming';
import { useNpcBuilderStore } from '../../stores';
import type { NpcBuilderTrappingEntry } from '../../stores/npc-builder-store';
import NpcBuilderMainTab from './tabs/NpcBuilderMainTab.vue';
import NpcBuilderSkillsTalentsTab from './tabs/NpcBuilderSkillsTalentsTab.vue';
import NpcBuilderTraitsTab from './tabs/NpcBuilderTraitsTab.vue';
import NpcBuilderTrappingsTab from './tabs/NpcBuilderTrappingsTab.vue';
import NpcBuilderSettingsTab from './tabs/NpcBuilderSettingsTab.vue';

type CloseCallback = () => void;

const props = defineProps<{
  onClose?: CloseCallback;
}>();

/**
 * NPC Builder app shell.
 *
 * Responsibilities:
 * - owns top-level tab layout and tab routing
 * - runs build orchestration and drag/drop resolution
 * - keeps shared Pinia state synchronized to persistence
 */
const store = useNpcBuilderStore();

const {
  baseActorId,
  baseActorOverride,
  careers,
  activeTab,
  settings,
  isBusy,
  busyMessage,
  skills,
  talents,
  characteristics,
  trappings,
} =
  storeToRefs(store);

const careersSignature = computed(() => {
  return careers.value
    .map((career) => `${career.uuid}:${Math.max(1, Math.floor(Number(career.quantity) || 1))}`)
    .join('|');
});

const builderSettingsSignature = computed(() => {
  return [
    settings.value.allowUpgradeBaseSkills,
    settings.value.allowUpgradeBaseCharacteristics,
    settings.value.allowUpgradeBaseTalents,
    settings.value.allowUpgradeBaseTrappings,
  ].join('|');
});

let advancementHydrationToken = 0;

let upscalerInstance: any = null;

// ---------------------------------------------------------------------------
// Unresolved trappings dialog state
// ---------------------------------------------------------------------------

interface UnresolvedDialogState {
  entries: NpcBuilderTrappingEntry[];
  resolve: (choice: 'ignore' | 'blanks' | 'cancel') => void;
}

const unresolvedDialog = ref<UnresolvedDialogState | null>(null);

function promptUnresolvedTrappings(entries: NpcBuilderTrappingEntry[]): Promise<'ignore' | 'blanks' | 'cancel'> {
  return new Promise((resolve) => {
    unresolvedDialog.value = { entries, resolve };
  });
}

function onUnresolvedChoice(choice: 'ignore' | 'blanks' | 'cancel'): void {
  unresolvedDialog.value?.resolve(choice);
  unresolvedDialog.value = null;
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

function toSafeNonNegativeInteger(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function readNumberFromPaths(source: any, paths: string[]): number | null {
  for (const path of paths) {
    const segments = path.split('.');
    let current: any = source;
    for (const segment of segments) {
      current = current?.[segment];
    }
    if (typeof current === 'number' && Number.isFinite(current)) {
      return current;
    }
    if (typeof current === 'string' && current.trim().length > 0) {
      const numeric = Number(current);
      if (Number.isFinite(numeric)) return numeric;
    }
  }
  return null;
}

interface ActorAdvancementSnapshot {
  skills: Record<string, number>;
  talents: Record<string, number>;
  characteristics: Record<string, number>;
}

function captureActorAdvancementSnapshot(actor: any): ActorAdvancementSnapshot {
  const snapshot: ActorAdvancementSnapshot = {
    skills: {},
    talents: {},
    characteristics: {},
  };

  const actorCharacteristics = actor?.system?.characteristics;
  if (actorCharacteristics && typeof actorCharacteristics === 'object') {
    for (const [key, value] of Object.entries(actorCharacteristics as Record<string, any>)) {
      const normalizedKey = String(key).toUpperCase().trim();
      if (!normalizedKey) continue;
      const advances = readNumberFromPaths(value, [
        'advances.value',
        'advances',
        'advance.value',
        'advance',
      ]);
      snapshot.characteristics[normalizedKey] = toSafeNonNegativeInteger(advances ?? 0);
    }
  }

  for (const item of actor?.items?.contents ?? []) {
    const type = String(item?.type ?? '').toLowerCase();
    const name = String(item?.name ?? '').trim();
    if (!name) continue;

    if (type === 'skill') {
      const advances = readNumberFromPaths(item?.system, [
        'advances.value',
        'advances',
        'level.value',
        'level',
      ]);
      const next = toSafeNonNegativeInteger(advances ?? 0);
      snapshot.skills[name] = Math.max(snapshot.skills[name] ?? 0, next);
    }

    if (type === 'talent') {
      const rank = readNumberFromPaths(item?.system, [
        'advances.value',
        'advances',
        'rank.value',
        'rank',
        'level.value',
        'level',
      ]);
      const next = Math.max(1, toSafeNonNegativeInteger(rank ?? 1, 1));
      snapshot.talents[name] = Math.max(snapshot.talents[name] ?? 1, next);
    }
  }

  return snapshot;
}

async function applyBuilderAdvancementValuesToActor(
  actor: any,
  baseSnapshot: ActorAdvancementSnapshot,
): Promise<void> {
  if (!actor) return;

  const itemUpdates: Array<Record<string, unknown>> = [];
  const characteristicUpdates: Record<string, number> = {};

  const skillsByName = new Map<string, any[]>();
  const talentsByName = new Map<string, any[]>();

  for (const item of actor.items?.contents ?? []) {
    const type = String(item?.type ?? '').toLowerCase();
    const name = String(item?.name ?? '').trim();
    if (!name) continue;
    if (type === 'skill') {
      const existing = skillsByName.get(name) ?? [];
      existing.push(item);
      skillsByName.set(name, existing);
    }
    if (type === 'talent') {
      const existing = talentsByName.get(name) ?? [];
      existing.push(item);
      talentsByName.set(name, existing);
    }
  }

  for (const [name, entry] of Object.entries(skills.value)) {
    const targetAdvances = (baseSnapshot.skills[name] ?? 0) + toSafeNonNegativeInteger(entry.current);

    const matchingSkills = skillsByName.get(name) ?? [];
    for (const skillItem of matchingSkills) {
      itemUpdates.push({
        _id: skillItem.id,
        'system.advances.value': targetAdvances,
      });
    }
  }

  for (const [name, entry] of Object.entries(talents.value)) {
    const targetRank = Math.max(1, toSafeNonNegativeInteger(entry.current, 1));

    const matchingTalents = talentsByName.get(name) ?? [];
    for (const talentItem of matchingTalents) {
      itemUpdates.push({
        _id: talentItem.id,
        'system.advances.value': targetRank,
      });
    }
  }

  const actorCharacteristics = actor?.system?.characteristics;
  const actorCharacteristicKeys = Object.keys(actorCharacteristics ?? {});
  const characteristicKeyByUpper = new Map(
    actorCharacteristicKeys.map((key) => [String(key).toUpperCase(), key]),
  );

  for (const [characteristicName, entry] of Object.entries(characteristics.value)) {
    const actorKey = characteristicKeyByUpper.get(characteristicName.toUpperCase());
    if (!actorKey) continue;

    const baseAdvances = baseSnapshot.characteristics[characteristicName.toUpperCase()] ?? 0;
    const nextAdvances = baseAdvances + toSafeNonNegativeInteger(entry.current);
    const characteristicData = actorCharacteristics?.[actorKey];
    const usesNestedAdvanceValue =
      characteristicData &&
      typeof characteristicData === 'object' &&
      characteristicData.advances &&
      typeof characteristicData.advances === 'object' &&
      'value' in characteristicData.advances;

    if (usesNestedAdvanceValue) {
      characteristicUpdates[`system.characteristics.${actorKey}.advances.value`] = nextAdvances;
    } else {
      characteristicUpdates[`system.characteristics.${actorKey}.advances`] = nextAdvances;
    }
  }

  if (itemUpdates.length) {
    await actor.updateEmbeddedDocuments('Item', itemUpdates);
  }
  if (Object.keys(characteristicUpdates).length) {
    await actor.update(characteristicUpdates);
  }
}

async function syncAdvancementsFromBuildInputs(): Promise<void> {
  const token = ++advancementHydrationToken;
  const baseActor = await resolveBaseActor();

  if (token !== advancementHydrationToken) {
    return;
  }

  await store.hydrateAdvancements(baseActor, true);
  await store.hydrateTrappings(baseActor);
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

function getTrappingItemTypes(): string[] {
  const configured = (game as any)?.wfrp4e?.config?.trappingItems;
  if (Array.isArray(configured) && configured.length) {
    return configured.map((value) => String(value).toLowerCase());
  }
  return ['trapping', 'armour', 'weapon', 'container', 'ammunition', 'money'];
}

function buildFallbackTrappingData(name: string, quantity: number): Record<string, unknown> {
  return {
    name,
    type: 'trapping',
    img: 'systems/wfrp4e/icons/blank.png',
    system: {
      quantity: { value: quantity },
      trappingType: { value: 'misc' },
      worn: false,
    },
  };
}

async function resolveTrappingSourceDataByName(name: string): Promise<Record<string, unknown> | null> {
  const normalizedName = String(name ?? '').trim();
  if (!normalizedName) return null;

  const utility = (game as any)?.wfrp4e?.utility;
  if (typeof utility?.findItem === 'function') {
    try {
      const item = await utility.findItem(normalizedName, getTrappingItemTypes());
      return (item?.toObject?.() as Record<string, unknown> | undefined) ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

function withTrappingQuantity(
  sourceData: Record<string, unknown> | null,
  name: string,
  quantity: number,
  itemType: string,
): Record<string, unknown> {
  const next = sourceData ? foundry.utils.deepClone(sourceData) : buildFallbackTrappingData(name, quantity);
  delete (next as any)._id;
  next.name = name;
  next.type = String((next as any).type ?? itemType ?? 'trapping').toLowerCase();
  (next as any).system ??= {};
  (next as any).system.quantity ??= { value: quantity };
  if (typeof (next as any).system.quantity === 'object') {
    (next as any).system.quantity.value = quantity;
  } else {
    (next as any).system.quantity = { value: quantity };
  }
  return next;
}

async function applyBuilderTrappingsToActor(actor: any): Promise<void> {
  if (!actor) return;

  const allowedTypes = new Set(getTrappingItemTypes());
  const existingItems = (actor.items?.contents ?? []).filter((item: any) => {
    return allowedTypes.has(String(item?.type ?? '').toLowerCase());
  });

  const itemUpdates: Array<Record<string, unknown>> = [];
  const itemCreates: Record<string, unknown>[] = [];
  const itemDeletes: string[] = [];

  for (const entry of Object.values(trappings.value)) {
    const matchName = String(entry.originalName || entry.name).trim().toLowerCase();
    const matches = existingItems.filter((item: any) => {
      return (
        String(item?.type ?? '').toLowerCase() === entry.itemType &&
        String(item?.name ?? '').trim().toLowerCase() === matchName
      );
    });

    if (entry.sourceKind === 'base') {
      if (entry.ignored) {
        itemDeletes.push(...matches.map((item: any) => String(item.id)));
        continue;
      }

      const targetData = withTrappingQuantity(entry.sourceData, entry.name, entry.quantity, entry.itemType);
      if (matches[0]) {
        itemUpdates.push({
          _id: matches[0].id,
          name: entry.name,
          'system.quantity.value': entry.quantity,
        });
      } else {
        itemCreates.push(targetData);
      }
      continue;
    }

    if (entry.sourceKind === 'career' && entry.ignoredFromCareer) {
      continue;
    }

    if (entry.sourceKind === 'user' && entry.ignored) {
      continue;
    }

    let sourceData = entry.sourceData;
    if (!sourceData && entry.sourceKind === 'career') {
      sourceData = await resolveTrappingSourceDataByName(entry.name);
    }
    itemCreates.push(withTrappingQuantity(sourceData, entry.name, entry.quantity, entry.itemType));
  }

  if (itemDeletes.length) {
    await actor.deleteEmbeddedDocuments('Item', itemDeletes);
  }
  if (itemUpdates.length) {
    await actor.updateEmbeddedDocuments('Item', itemUpdates);
  }
  if (itemCreates.length) {
    await actor.createEmbeddedDocuments('Item', itemCreates);
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

  // Check whether any career-derived trappings could not be resolved.
  const unresolvedEntries = Object.values(trappings.value).filter(
    (entry) => entry.sourceKind === 'career' && entry.resolved === false && !entry.ignoredFromCareer,
  );

  if (unresolvedEntries.length > 0) {
    const choice = await promptUnresolvedTrappings(unresolvedEntries);
    if (choice === 'cancel') {
      return;
    }
    if (choice === 'ignore') {
      store.ignoreUnresolvedCareerTrappings();
    }
    // 'blanks' falls through — unresolved items will be created as blank trapping items.
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

    const baseAdvancementSnapshot = captureActorAdvancementSnapshot(createdActor);

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

    busyMessage.value = 'Applying advancement edits...';
    await applyBuilderAdvancementValuesToActor(createdActor, baseAdvancementSnapshot);

    busyMessage.value = 'Applying trappings...';
    await applyBuilderTrappingsToActor(createdActor);

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

    store.resetWorkingNpc();
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

  context.drawImage(
    imageElement,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    tokenTextureSize,
    tokenTextureSize,
  );

  try {
    return canvas.toDataURL('image/webp', 0.92);
  } catch {
    return canvas.toDataURL('image/png');
  }
}

function close(): void {
  props.onClose?.();
}

// Auto-save settings to world storage whenever any setting value changes.
watch(
  settings,
  () => {
    void store.saveToStorage();
  },
  { deep: true },
);

watch(
  [baseActorId, baseActorOverride, careersSignature, builderSettingsSignature],
  () => {
    void syncAdvancementsFromBuildInputs();
  },
  { immediate: true },
);
</script>

<style>
.npc-builder {
  box-sizing: border-box;
  position: relative;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  color: #f1e1ce;
  font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
  background: linear-gradient(180deg, rgb(58 43 33 / 40%), rgb(35 27 22 / 94%));
  overflow: hidden;
}

.npc-builder :is(input, textarea, button):focus-visible {
  outline: 2px solid rgb(234 181 98 / 75%);
  outline-offset: 1px;
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

.npc-builder__tabs {
  display: flex;
  gap: 6px;
  align-items: flex-end;
  padding: 10px 10px 0;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
}

.npc-builder__tab {
  border: 1px solid rgb(205 103 89 / 60%);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-radius: 6px 6px 0 0;
  padding: 8px 12px;
  background: rgb(100 60 50 / 20%);
  color: #d3bb9f;
  font: inherit;
  cursor: pointer;
  opacity: 0.85;
}

.npc-builder__tab.is-active {
  opacity: 1;
  color: #f1e1ce;
  background: rgb(120 75 58 / 25%);
}

.npc-builder__build-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 12px;
  align-items: start;
}

.npc-builder__build-main,
.npc-builder__build-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.npc-builder__options-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.npc-builder__placeholder-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.npc-builder__placeholder-copy {
  font-size: 12px;
  color: #bca98f;
  line-height: 1.45;
  margin-bottom: 10px;
}

.npc-builder__adv-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  --npc-builder-adv-columns: minmax(160px, 1.6fr) 72px 132px 64px 72px minmax(180px, 1.5fr) 72px;
}

.npc-builder__trap-row {
  display: grid;
  grid-template-columns: minmax(180px, 1.4fr) auto minmax(120px, 1fr) auto auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border: 1px solid rgb(137 103 77 / 50%);
  border-radius: 4px;
  background: rgba(33, 24, 19, 0.5);
}

.npc-builder__trap-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.npc-builder__trap-badge--resolved {
  background: rgb(40 100 60 / 60%);
  color: #8de8b0;
  border: 1px solid rgb(60 150 90 / 50%);
}

.npc-builder__trap-badge--unresolved {
  background: rgb(120 40 30 / 60%);
  color: #f4a690;
  border: 1px solid rgb(180 70 50 / 50%);
}

.npc-builder__unresolved-dialog {
  background: #1e1610;
  border: 2px solid #7a4f2e;
  border-radius: 6px;
  padding: 24px;
  max-width: 480px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.npc-builder__unresolved-title {
  font-size: 16px;
  font-weight: 700;
  color: #f4d8b5;
}

.npc-builder__unresolved-copy {
  font-size: 12px;
  color: #bca98f;
  line-height: 1.5;
  margin: 0;
}

.npc-builder__unresolved-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.npc-builder__unresolved-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(120 40 30 / 30%);
  border: 1px solid rgb(180 70 50 / 40%);
  border-radius: 4px;
}

.npc-builder__unresolved-name {
  font-size: 13px;
  font-weight: 600;
  color: #f4a690;
}

.npc-builder__unresolved-src {
  font-size: 11px;
  color: #9f8a72;
}

.npc-builder__unresolved-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.npc-builder__trap-name {
  font-size: 13px;
  font-weight: 600;
}

.npc-builder__trap-qty,
.npc-builder__trap-source {
  font-size: 12px;
  color: #bca98f;
}

.npc-builder__trap-qty-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.npc-builder__trap-qty-control label {
  font-size: 12px;
  color: #bca98f;
}

.npc-builder__adv-head {
  display: grid;
  grid-template-columns: var(--npc-builder-adv-columns);
  gap: 8px;
  align-items: center;
  padding: 0 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9f8a72;
}

.npc-builder__adv-head-xp,
.npc-builder__adv-head-total,
.npc-builder__adv-head-base,
.npc-builder__adv-head-default {
  justify-self: center;
}

.npc-builder__adv-head-controls {
  justify-self: center;
}

.npc-builder__adv-head-careers {
  justify-self: start;
}

.npc-builder__adv-row {
  display: grid;
  grid-template-columns: var(--npc-builder-adv-columns);
  gap: 8px;
  align-items: center;
  padding: 8px;
  border: 1px solid rgb(137 103 77 / 50%);
  border-radius: 4px;
  background: rgba(33, 24, 19, 0.5);
}

.npc-builder__adv-name {
  font-weight: 600;
  font-size: 12px;
}

.npc-builder__adv-source-summary {
  font-size: 11px;
  font-style: italic;
  font-weight: 400;
  color: #bca98f;
}

.npc-builder__adv-meta {
  font-size: 11px;
  color: #bca98f;
}

.npc-builder__adv-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-self: center;
}

.npc-builder__adv-controls .npc-builder__quantity-input {
  font-size: 16px;
}

.npc-builder__adv-xp {
  font-size: 16px;
  color: #d9a44f;
  justify-self: center;
  font-weight: 600;
}

.npc-builder__adv-total {
  font-size: 16px;
  color: #a9dbc0;
  justify-self: center;
  font-weight: 600;
}

.npc-builder__adv-base,
.npc-builder__adv-default {
  font-size: 13px;
  color: #cdb99f;
  justify-self: center;
  font-weight: 600;
}

.npc-builder__adv-careers {
  font-size: 13px;
  color: #bca98f;
  justify-self: start;
}

.npc-builder__override-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border: 1px solid rgb(255 255 255 / 6%);
  border-radius: 6px;
  background: rgb(255 255 255 / 2%);
  margin-bottom: 10px;
}

.npc-builder__summary-top {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.npc-builder__summary-image {
  width: 72px;
  height: 72px;
  border: 1px solid #666;
  border-radius: 8px;
  overflow: hidden;
  background: rgb(255 255 255 / 3%);
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.npc-builder__summary-image img {
  width: 72px;
  height: 72px;
  object-fit: cover;
}

.npc-builder__summary-info {
  flex: 1 1 auto;
  min-width: 0;
}

.npc-builder__summary-label {
  font-size: 11px;
  color: #888;
}

.npc-builder__summary-value {
  font-weight: 700;
  margin-bottom: 6px;
}

.npc-builder__summary-note {
  font-size: 12px;
  color: #888;
  line-height: 1.35;
}

.npc-builder__summary-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.npc-builder__summary-card {
  padding: 8px;
  border: 1px solid rgb(255 255 255 / 6%);
  border-radius: 6px;
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

@media (max-width: 980px) {

  .npc-builder__build-grid,
  .npc-builder__options-grid {
    grid-template-columns: 1fr;
  }

  .npc-builder__summary-grid {
    grid-template-columns: 1fr;
  }

  .npc-builder__adv-row,
  .npc-builder__trap-row {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .npc-builder__adv-head {
    display: none;
  }

  .npc-builder__adv-xp {
    justify-self: center;
  }

  .npc-builder__adv-total {
    justify-self: center;
  }

  .npc-builder__adv-base,
  .npc-builder__adv-default {
    justify-self: center;
  }

  .npc-builder__adv-careers {
    justify-self: start;
  }
}
</style>

<template>
  <div class="item-builder application">
    <div class="item-builder__tabs">
      <button
        type="button"
        :class="['item-builder__tab', { 'is-active': activeTab === 'build' }]"
        @click="activeTab = 'build'"
      >
        Build
      </button>
      <button
        type="button"
        :class="['item-builder__tab', { 'is-active': activeTab === 'options' }]"
        @click="activeTab = 'options'"
      >
        Options
      </button>
    </div>

    <div class="item-builder__content" v-if="activeTab === 'build'">
      <section class="item-builder__section item-builder__main">
        <h3>Select Source Effect</h3>

        <label class="item-builder__field">
          <span>Actor</span>
          <select v-model="selectedActorId">
            <option value="">-- Select Actor --</option>
            <option v-for="actor in actors" :key="actor.id" :value="actor.id">
              {{ actor.name }}
            </option>
          </select>
        </label>

        <label class="item-builder__field">
          <span>Effect from Actor</span>
          <select v-model="selectedEffectUuid" :disabled="!selectedActorId">
            <option value="">-- Select Effect --</option>
            <option v-for="effect in actorEffects" :key="effect.uuid" :value="effect.uuid">
              {{ effect.name }}
            </option>
          </select>
        </label>

        <label class="item-builder__field">
          <span>Or paste Effect UUID</span>
          <input v-model="manualEffectUuid" type="text" placeholder="Actor...ActiveEffect..." />
        </label>

        <button
          type="button"
          class="item-builder__button item-builder__button--ghost"
          @click="useOpenEffect"
        >
          Use Open Effect Sheet
        </button>

        <div class="item-builder__preview" v-if="effectPreviewName">
          <strong>Selected Effect:</strong> {{ effectPreviewName }}
        </div>
      </section>

      <section class="item-builder__section item-builder__side">
        <h3>Create Carrier Item</h3>

        <label class="item-builder__field"
          ><span>Name</span><input v-model="itemName" type="text"
        /></label>
        <label class="item-builder__field"
          ><span>Type</span>
          <select v-model="itemType">
            <option v-for="typeName in availableTypes" :key="typeName" :value="typeName">
              {{ typeName }}
            </option>
          </select>
        </label>
        <label class="item-builder__field"
          ><span>Folder</span>
          <select v-model="folderId">
            <option value="">(Use / create: {{ settings.fallbackFolderName }})</option>
            <option
              v-for="folder in itemFolders"
              :key="folder.id || folder._id || folder.name"
              :value="folder.id"
            >
              {{ folder.name }}
            </option>
          </select>
        </label>

        <button
          type="button"
          class="item-builder__button item-builder__button--primary"
          @click="createItem"
        >
          Create Item
        </button>
      </section>
    </div>

    <div class="item-builder__content" v-else>
      <section class="item-builder__section item-builder__main">
        <h3>Defaults</h3>
        <label class="item-builder__field"
          ><span>Name Prefix</span><input v-model="settings.namePrefix" type="text"
        /></label>
        <label class="item-builder__field"
          ><span>Default Item Type</span>
          <select v-model="settings.defaultItemType">
            <option v-for="typeName in availableTypes" :key="typeName" :value="typeName">
              {{ typeName }}
            </option>
          </select>
        </label>
        <label class="item-builder__field"
          ><span>Fallback Folder Name</span
          ><input v-model="settings.fallbackFolderName" type="text"
        /></label>
        <label class="item-builder__field"
          ><span>Remember Folder Selection</span
          ><input v-model="settings.rememberLastFolder" type="checkbox"
        /></label>
      </section>
      <section class="item-builder__section item-builder__side">
        <h3>Actions</h3>
        <button
          type="button"
          class="item-builder__button item-builder__button--primary"
          @click="saveSettings"
        >
          Save Settings
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  getAllItemFoldersSorted,
  getOrCreateItemFolderByName,
} from '../../module/services/settings/aggregate-items';
import {
  getAvailableEffectCarrierTypes,
  loadEffectToItemBuilderSettings,
  saveEffectToItemBuilderSettings,
} from '../../module/services/settings/effect-items';
import type { EffectItemsSettingsConfig } from '../../types/module';

const activeTab = ref<'build' | 'options'>('build');
const settings = ref<EffectItemsSettingsConfig>(loadEffectToItemBuilderSettings());

const selectedActorId = ref('');
const selectedEffectUuid = ref('');
const manualEffectUuid = ref('');

const itemName = ref('');
const itemType = ref(settings.value.defaultItemType || 'trait');
const folderId = ref(settings.value.defaultFolderId || '');

const actors = computed(
  () => (game.actors?.contents ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)) as any[],
);
const actorEffects = computed(() => {
  if (!selectedActorId.value) return [] as any[];
  const actor = game.actors?.get(selectedActorId.value);
  return actor?.effects?.contents ?? [];
});
const itemFolders = computed(() => getAllItemFoldersSorted());
const availableTypes = computed(() => getAvailableEffectCarrierTypes());
const effectPreviewName = ref('');

function getOpenActiveEffectDocument(): any | null {
  const legacyApps = Object.values(ui.windows ?? {});
  for (const app of legacyApps) {
    const effect = (app as any)?.document;
    if (effect?.documentName === 'ActiveEffect' && effect?.isOwner) {
      return effect;
    }
  }

  const instances = foundry?.applications?.instances;
  if (instances instanceof Map) {
    for (const app of Array.from(instances.values())) {
      const effect = (app as any)?.document;
      if (effect?.documentName === 'ActiveEffect' && effect?.isOwner) {
        return effect;
      }
    }
  }

  return null;
}

function setDescription(systemData: any, html: string): void {
  if (foundry.utils.getProperty(systemData, 'description.value') !== undefined) {
    foundry.utils.setProperty(systemData, 'description.value', html);
    return;
  }
  if (foundry.utils.getProperty(systemData, 'description') !== undefined) {
    foundry.utils.setProperty(systemData, 'description', html);
  }
}

async function useOpenEffect(): Promise<void> {
  const openEffect = getOpenActiveEffectDocument();
  if (!openEffect) {
    ui.notifications?.warn('No open Active Effect sheet found.');
    return;
  }

  manualEffectUuid.value = openEffect.uuid;
  effectPreviewName.value = openEffect.name;
  itemName.value = `${settings.value.namePrefix || 'Effect'}: ${openEffect.name}`;
}

async function resolveSelectedEffect(): Promise<any | null> {
  const typedUuid = manualEffectUuid.value.trim();
  if (typedUuid) {
    const doc = await fromUuid(typedUuid);
    return doc?.documentName === 'ActiveEffect' ? doc : null;
  }

  if (selectedEffectUuid.value) {
    const doc = await fromUuid(selectedEffectUuid.value);
    return doc?.documentName === 'ActiveEffect' ? doc : null;
  }

  return getOpenActiveEffectDocument();
}

async function createItem(): Promise<void> {
  const effectDocument = await resolveSelectedEffect();
  if (!effectDocument) {
    ui.notifications?.warn('No valid Active Effect selected.');
    return;
  }

  const chosenType = itemType.value || settings.value.defaultItemType || 'trait';
  const chosenName =
    itemName.value.trim() || `${settings.value.namePrefix || 'Effect'}: ${effectDocument.name}`;

  let targetFolder: any | null = null;
  if (folderId.value) {
    targetFolder = game.folders?.get(folderId.value) ?? null;
  }
  if (!targetFolder) {
    targetFolder = await getOrCreateItemFolderByName(
      settings.value.fallbackFolderName || 'Effect Items',
    );
  }

  if (settings.value.rememberLastFolder) {
    settings.value.defaultFolderId = folderId.value;
    await saveSettings();
  }

  const clonedEffectData = effectDocument.toObject();
  delete clonedEffectData._id;
  clonedEffectData.disabled = false;
  clonedEffectData.transfer = true;

  const effectIcon =
    clonedEffectData.icon ?? effectDocument.icon ?? effectDocument.img ?? 'icons/svg/aura.svg';
  clonedEffectData.icon = effectIcon;

  const templateForType = (game.system?.template?.Item as any)?.[chosenType] ?? {};
  const systemData = foundry.utils.deepClone(templateForType);
  setDescription(
    systemData,
    `<p><strong>Grants Effect:</strong> ${foundry.utils.escapeHTML(effectDocument.name)}</p><hr/><p><em>Created by Effect to Item Builder.</em></p>`,
  );

  const createdItem = await Item.create(
    {
      name: chosenName,
      type: chosenType as any,
      img: effectIcon,
      folder: targetFolder?.id ?? null,
      system: systemData,
      effects: [clonedEffectData],
      flags: {
        'effect-to-item-builder': {
          sourceEffectUuid: effectDocument.uuid,
          createdAt: Date.now(),
        },
      },
    } as any,
    { renderSheet: true },
  );

  if (!createdItem) {
    ui.notifications?.error('Item creation failed.');
    return;
  }

  try {
    const embeddedEffect = createdItem.effects.contents?.[0];
    if (embeddedEffect) {
      await embeddedEffect.update({ origin: createdItem.uuid });
    }
  } catch {
    // non-fatal
  }

  ui.notifications?.info(
    `Created "${createdItem.name}" (${createdItem.type}) that grants "${effectDocument.name}".`,
  );
}

async function saveSettings(): Promise<void> {
  if (!availableTypes.value.includes(settings.value.defaultItemType)) {
    settings.value.defaultItemType = availableTypes.value[0] ?? 'trait';
  }

  await saveEffectToItemBuilderSettings(settings.value);
  ui.notifications?.info('Effect to Item Builder settings saved.');
}

watch(selectedEffectUuid, () => {
  const selected = actorEffects.value.find((effect) => effect.uuid === selectedEffectUuid.value);
  if (!selected) return;
  effectPreviewName.value = selected.name;
  if (!itemName.value.trim()) {
    itemName.value = `${settings.value.namePrefix || 'Effect'}: ${selected.name}`;
  }
});

watch(
  () => settings.value,
  (nextSettings) => {
    void saveEffectToItemBuilderSettings(nextSettings);
  },
  { deep: true },
);
</script>

<style scoped>
.item-builder {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #f1e1ce;
  background: linear-gradient(180deg, rgb(58 43 33 / 40%), rgb(35 27 22 / 94%));
}

.item-builder :is(input, textarea, button):focus-visible {
  outline: 2px solid rgb(234 181 98 / 75%);
  outline-offset: 1px;
}

.item-builder__tabs {
  display: flex;
  gap: 6px;
  padding: 10px 10px 0;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
}

.item-builder__tab {
  border: 1px solid rgb(205 103 89 / 60%);
  border-radius: 6px 6px 0 0;
  padding: 8px 12px;
  background: rgb(100 60 50 / 20%);
  color: #d3bb9f;
  font: inherit;
  cursor: pointer;
}

.item-builder__tab.is-active {
  color: #f1e1ce;
  background: rgb(120 75 58 / 25%);
}

.item-builder__content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  padding: 12px;
}

.item-builder__section {
  border: 1px solid rgb(137 103 77 / 72%);
  border-radius: 8px;
  padding: 12px;
  background: linear-gradient(180deg, rgb(90 64 47 / 20%), rgb(46 34 27 / 82%));
}

.item-builder__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.item-builder__field input,
.item-builder__field select {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: 1px solid #6f5441;
  border-radius: 4px;
  background: rgb(33 24 19 / 92%);
  color: #f1e1ce;
}

.item-builder__preview {
  margin-top: 10px;
  padding: 8px;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 6px;
}

.item-builder__button {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.item-builder__button--primary {
  border-color: rgb(201 145 75 / 70%);
  color: #27190f;
  background: linear-gradient(180deg, #e8ba72, #c28a3d);
}

.item-builder__button--ghost {
  border-color: rgb(205 103 89 / 60%);
  color: #f7d4ca;
  background: rgb(148 60 50 / 26%);
}

@media (max-width: 980px) {
  .item-builder__content {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
    <div class="item-builder application">
        <div class="item-builder__tabs">
            <button type="button" :class="['item-builder__tab', { 'is-active': activeTab === 'build' }]"
                @click="activeTab = 'build'">
                Build
            </button>
            <button type="button" :class="['item-builder__tab', { 'is-active': activeTab === 'options' }]"
                @click="activeTab = 'options'">
                Options
            </button>
        </div>

        <div class="item-builder__content" v-if="activeTab === 'build'">
            <section class="item-builder__section item-builder__main">
                <h3>Source Items</h3>
                <p class="item-builder__hint">Drag Item documents from sidebar or compendium into the zone.</p>

                <div class="item-builder__drop-zone" @dragover.prevent @drop="handleDrop">
                    <strong>Drop Items Here</strong>
                </div>

                <div class="item-builder__list">
                    <div v-if="!selectedItems.length" class="item-builder__empty">No items added yet.</div>
                    <div v-for="item in selectedItems" :key="item.uuid" class="item-builder__row">
                        <div class="item-builder__row-left">
                            <img v-if="item.img" :src="item.img" class="item-builder__img" />
                            <div>
                                <div>{{ item.name }}</div>
                                <div class="item-builder__uuid">{{ item.uuid }}</div>
                            </div>
                        </div>
                        <button type="button" class="item-builder__button item-builder__button--ghost"
                            @click="removeItem(item.uuid)">Remove</button>
                    </div>
                </div>
            </section>

            <section class="item-builder__section item-builder__side">
                <h3>Carrier Item</h3>

                <label class="item-builder__field">
                    <span>Folder</span>
                    <select v-model="buildFolderId">
                        <option value="">(Use / create: {{ settings.fallbackFolderName }})</option>
                        <option v-for="folder in itemFolders" :key="folder.id || folder._id || folder.name"
                            :value="folder.id">
                            {{ folder.name }}
                        </option>
                    </select>
                </label>

                <label class="item-builder__field">
                    <span>Carrier Type</span>
                    <select v-model="buildCarrierType">
                        <option v-for="typeName in availableCarrierTypes" :key="typeName" :value="typeName">{{ typeName
                            }}</option>
                    </select>
                </label>

                <label class="item-builder__field">
                    <span>Name</span>
                    <input v-model="buildCarrierName" type="text" />
                </label>

                <p class="item-builder__hint">
                    Effect mode: <strong>{{ settings.effectMode === 'perItem' ? 'One effect per item' : 'Single effect'
                        }}</strong>
                </p>

                <div class="item-builder__actions">
                    <button type="button" class="item-builder__button item-builder__button--ghost"
                        @click="clearItems">Clear</button>
                    <button type="button" class="item-builder__button item-builder__button--primary"
                        @click="createCarrierItem">Create Carrier Item</button>
                </div>
            </section>
        </div>

        <div class="item-builder__content" v-else>
            <section class="item-builder__section item-builder__main">
                <h3>Defaults</h3>

                <label class="item-builder__field"><span>Default Prefix</span><input v-model="settings.defaultPrefix"
                        type="text" /></label>
                <label class="item-builder__field"><span>Default Suffix</span><input v-model="settings.defaultSuffix"
                        type="text" /></label>
                <label class="item-builder__field"><span>Default Carrier Type</span>
                    <select v-model="settings.defaultItemType">
                        <option v-for="typeName in availableCarrierTypes" :key="typeName" :value="typeName">{{ typeName
                            }}</option>
                    </select>
                </label>
                <label class="item-builder__field"><span>Fallback Folder Name</span><input
                        v-model="settings.fallbackFolderName" type="text" /></label>
                <label class="item-builder__field"><span>Remember Folder Selection</span><input
                        v-model="settings.rememberLastFolder" type="checkbox" /></label>
            </section>

            <section class="item-builder__section item-builder__side">
                <h3>Effect Behavior</h3>
                <label class="item-builder__field"><span>Effect Mode</span>
                    <select v-model="settings.effectMode">
                        <option value="single">Single Effect</option>
                        <option value="perItem">One Effect Per Item</option>
                    </select>
                </label>
                <label class="item-builder__field"><span>Single Effect Name</span><input
                        v-model="settings.defaultEffectName" type="text" /></label>
                <button type="button" class="item-builder__button item-builder__button--primary"
                    @click="saveSettings">Save Settings</button>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
    getAllItemFoldersSorted,
    getAvailableCarrierTypes,
    getOrCreateItemFolderByName,
    loadAggregateItemBuilderSettings,
    saveAggregateItemBuilderSettings,
} from '../../module/services/settings/aggregate-items';
import type { AggregateItemBuilderSettings } from '../../types/module';

type DroppedItem = { uuid: string; name: string; img: string };

const activeTab = ref<'build' | 'options'>('build');
const settings = ref<AggregateItemBuilderSettings>(loadAggregateItemBuilderSettings());

const selectedItemsByUuid = ref<Map<string, DroppedItem>>(new Map());
const buildFolderId = ref(settings.value.defaultFolderId || '');
const buildCarrierType = ref(settings.value.defaultItemType || 'trait');
const buildCarrierName = ref(`${settings.value.defaultPrefix || 'Bundle:'} `);

const itemFolders = computed(() => getAllItemFoldersSorted());
const availableCarrierTypes = computed(() => getAvailableCarrierTypes());
const selectedItems = computed(() => Array.from(selectedItemsByUuid.value.values()));

function buildDefaultCarrierName(): string {
    const first = selectedItems.value[0]?.name ?? 'Items';
    const parts = [] as string[];
    if (settings.value.defaultPrefix.trim()) parts.push(settings.value.defaultPrefix.trim());
    if (settings.value.defaultSuffix.trim()) parts.push(settings.value.defaultSuffix.trim());
    parts.push(first);
    return parts.join(' ').trim();
}

async function resolveDroppedItemDocument(dropData: any): Promise<any | null> {
    if (dropData.uuid) {
        const document = await fromUuid(dropData.uuid);
        return document?.documentName === 'Item' ? document : null;
    }

    if (dropData.pack && dropData.id) {
        const document = await fromUuid(`Compendium.${dropData.pack}.${dropData.id}` as any);
        return document?.documentName === 'Item' ? document : null;
    }

    if (dropData.type === 'Item' && dropData._id) {
        return game.items?.get(dropData._id) ?? null;
    }

    return null;
}

async function handleDrop(event: DragEvent): Promise<void> {
    const raw = event.dataTransfer?.getData('text/plain');
    if (!raw) return;

    let dropData: any;
    try {
        dropData = JSON.parse(raw);
    } catch {
        ui.notifications?.warn('Drop data was invalid.');
        return;
    }

    const droppedItem = await resolveDroppedItemDocument(dropData);
    if (!droppedItem) {
        ui.notifications?.warn('Could not resolve dropped Item.');
        return;
    }

    if (!selectedItemsByUuid.value.has(droppedItem.uuid)) {
        const nextMap = new Map(selectedItemsByUuid.value);
        nextMap.set(droppedItem.uuid, {
            uuid: droppedItem.uuid,
            name: droppedItem.name,
            img: droppedItem.img || '',
        });
        selectedItemsByUuid.value = nextMap;
    }

    if (!buildCarrierName.value.trim() || buildCarrierName.value.trim() === settings.value.defaultPrefix.trim()) {
        buildCarrierName.value = buildDefaultCarrierName();
    }
}

function removeItem(uuid: string): void {
    const nextMap = new Map(selectedItemsByUuid.value);
    nextMap.delete(uuid);
    selectedItemsByUuid.value = nextMap;
}

function clearItems(): void {
    selectedItemsByUuid.value = new Map();
    buildCarrierName.value = `${settings.value.defaultPrefix || 'Bundle:'} `;
}

function buildAddItemsScript(itemUuids: string[]): string {
    const lines: string[] = [];
    lines.push('// Generated by Aggregate Item Builder');
    lines.push(`const itemUuids = ${JSON.stringify(itemUuids, null, 2)};`);
    lines.push('const itemDataToCreate = [];');
    lines.push('for (const uuid of itemUuids) {');
    lines.push('  const sourceItem = await fromUuid(uuid);');
    lines.push('  if (!sourceItem) continue;');
    lines.push('  const data = sourceItem.toObject();');
    lines.push('  delete data._id;');
    lines.push('  itemDataToCreate.push(data);');
    lines.push('}');
    lines.push('if (itemDataToCreate.length) {');
    lines.push('  await this.actor.createEmbeddedDocuments("Item", itemDataToCreate, { fromEffect: this.effect.id });');
    lines.push('}');
    return lines.join('\n');
}

function buildScriptedEffectData(effectName: string, scriptCode: string): any {
    return {
        name: effectName,
        img: 'icons/svg/aura.svg',
        disabled: false,
        transfer: true,
        changes: [],
        system: {
            scriptData: [
                {
                    label: effectName,
                    trigger: 'onCreate',
                    script: scriptCode,
                },
            ],
            transferData: {
                documentType: 'Item',
                type: 'document',
            },
        },
    };
}

function setWfrpDescription(systemData: any, html: string): void {
    if (foundry.utils.getProperty(systemData, 'description.value') !== undefined) {
        foundry.utils.setProperty(systemData, 'description.value', html);
        return;
    }

    if (foundry.utils.getProperty(systemData, 'description') !== undefined) {
        foundry.utils.setProperty(systemData, 'description', html);
    }
}

async function createCarrierItem(): Promise<void> {
    if (!selectedItems.value.length) {
        ui.notifications?.warn('Add at least one item first.');
        return;
    }

    const folder = buildFolderId.value
        ? game.folders?.get(buildFolderId.value)
        : await getOrCreateItemFolderByName(settings.value.fallbackFolderName || 'Effect Items');

    if (!folder) {
        ui.notifications?.error('Could not resolve target folder.');
        return;
    }

    if (settings.value.rememberLastFolder) {
        settings.value.defaultFolderId = buildFolderId.value;
        await saveSettings();
    }

    const effects: any[] = [];

    if (settings.value.effectMode === 'single') {
        const effectName = settings.value.defaultEffectName.trim() || 'Grant Items';
        effects.push(buildScriptedEffectData(effectName, buildAddItemsScript(selectedItems.value.map((i) => i.uuid))));
    } else {
        for (const sourceItem of selectedItems.value) {
            effects.push(buildScriptedEffectData(sourceItem.name, buildAddItemsScript([sourceItem.uuid])));
        }
    }

    const itemType = buildCarrierType.value || settings.value.defaultItemType || 'trait';
    const templateForType = (game.system?.template?.Item as any)?.[itemType] ?? {};
    const systemData = foundry.utils.deepClone(templateForType);

    const listHtml = selectedItems.value
        .map((i) => `<li><strong>${foundry.utils.escapeHTML(i.name)}</strong></li>`)
        .join('');
    setWfrpDescription(
        systemData,
        `<p><strong>This item grants the following Items:</strong></p><ul>${listHtml}</ul>`,
    );

    const createdItem = await Item.create({
        name: buildCarrierName.value.trim() || buildDefaultCarrierName(),
        type: itemType as any,
        img: selectedItems.value[0]?.img || 'icons/svg/aura.svg',
        folder: folder.id,
        system: systemData,
        effects,
        flags: {
            'aggregate-item-builder': {
                createdAt: Date.now(),
                grantedItemUuids: selectedItems.value.map((i) => i.uuid),
                effectMode: settings.value.effectMode,
            },
        },
    } as any, { renderSheet: true });

    if (!createdItem) {
        ui.notifications?.error('Carrier item creation failed.');
        return;
    }

    ui.notifications?.info(`Created "${createdItem.name}" with ${effects.length} effect(s).`);
}

async function saveSettings(): Promise<void> {
    if (!availableCarrierTypes.value.includes(settings.value.defaultItemType)) {
        settings.value.defaultItemType = availableCarrierTypes.value[0] ?? 'trait';
    }

    await saveAggregateItemBuilderSettings(settings.value);
    ui.notifications?.info('Aggregate Item Builder settings saved.');
}

watch(
    () => settings.value,
    (nextSettings) => {
        void saveAggregateItemBuilderSettings(nextSettings);
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

.item-builder__main {
    display: flex;
    flex-direction: column;
}

.item-builder__drop-zone {
    border: 2px dashed #888;
    border-radius: 6px;
    padding: 14px;
    text-align: center;
    margin-bottom: 10px;
}

.item-builder__list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 160px;
    max-height: 360px;
    overflow: auto;
}

.item-builder__empty {
    color: #888;
}

.item-builder__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    border: 1px solid rgb(137 103 77 / 50%);
    border-radius: 6px;
    padding: 8px;
}

.item-builder__row-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.item-builder__img {
    width: 22px;
    height: 22px;
    object-fit: cover;
    border: 1px solid #666;
}

.item-builder__uuid {
    font-size: 11px;
    color: #888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 400px;
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

.item-builder__hint {
    font-size: 12px;
    color: #888;
}

.item-builder__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
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

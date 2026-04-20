<template>
    <section class="npc-builder__placeholder-grid">
        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Career-derived Trappings</div>
            <p class="npc-builder__placeholder-copy">
                Trappings gathered from queued careers. Removing one here only ignores it for this NPC.
            </p>

            <div v-if="careerRows.length === 0" class="npc-builder__empty">
                No career-derived trappings.
            </div>

            <div v-else class="npc-builder__adv-list">
                <div v-for="entry in careerRows" :key="entry.key" class="npc-builder__trap-row">
                    <div class="npc-builder__trap-name">{{ entry.name }}</div>
                    <div class="npc-builder__trap-qty">Qty {{ entry.quantity }}</div>
                    <div class="npc-builder__trap-source">{{ entry.sourceSummary }}</div>
                    <span class="npc-builder__trap-badge"
                        :class="entry.resolved === false ? 'npc-builder__trap-badge--unresolved' : 'npc-builder__trap-badge--resolved'"
                        :title="entry.resolved === false ? 'No matching item found in compendium or world. A blank item will be created unless ignored.' : entry.resolved === true ? 'Matched to a real item in the compendium or world.' : 'Resolution status unknown.'">
                        {{ entry.resolved === false ? 'Unresolved' : entry.resolved === true ? 'Found' : '?' }}
                    </span>
                    <button type="button" class="npc-builder__button npc-builder__button--small"
                        @click="removeTrapping(entry.key)">
                        Ignore
                    </button>
                </div>
            </div>
        </div>

        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Base Actor Trappings</div>
            <p class="npc-builder__placeholder-copy">
                Editable only when the base actor trappings setting is enabled.
            </p>

            <div v-if="!settings.allowUpgradeBaseTrappings" class="npc-builder__empty">
                Enable “Allow upgrading base actor trappings” in Settings to edit base inventory here.
            </div>

            <div v-else-if="baseRows.length === 0" class="npc-builder__empty">
                No base actor trappings found.
            </div>

            <div v-else class="npc-builder__adv-list">
                <div v-for="entry in baseRows" :key="entry.key" class="npc-builder__trap-row">
                    <input :value="entry.name" type="text" class="npc-builder__input"
                        @input="updateTrappingName(entry.key, readTextValue($event, entry.name))" />
                    <div class="npc-builder__trap-qty-control">
                        <label>Qty</label>
                        <input :value="entry.quantity" type="number" min="1" class="npc-builder__quantity-input"
                            @input="updateTrappingQuantity(entry.key, readQuantityValue($event))" />
                    </div>
                    <div class="npc-builder__trap-source">{{ entry.sourceSummary }}</div>
                    <button type="button" class="npc-builder__button npc-builder__button--small"
                        @click="removeTrapping(entry.key)">
                        Remove
                    </button>
                </div>
            </div>
        </div>

        <div class="npc-builder__section">
            <div class="npc-builder__section-title">User-added Trappings</div>
            <p class="npc-builder__placeholder-copy">
                Add trappings manually or drop supported trapping items here from the Foundry world.
            </p>

            <div class="npc-builder__alloc-actions">
                <button type="button" class="npc-builder__button" @click="onAddTrapping">
                    + Add Trapping
                </button>
            </div>

            <DocumentDrop label="Drop trapping items here" :accepted-drag-types="['Item']" :resolve-document="true"
                @drop-document="onDropDocument" @drop-invalid="onDropInvalid" />

            <div v-if="userRows.length === 0" class="npc-builder__empty">
                No user-added trappings.
            </div>

            <div v-else class="npc-builder__adv-list">
                <div v-for="entry in userRows" :key="entry.key" class="npc-builder__trap-row">
                    <input :value="entry.name" type="text" class="npc-builder__input"
                        @input="updateTrappingName(entry.key, readTextValue($event, entry.name))" />
                    <div class="npc-builder__trap-qty-control">
                        <label>Qty</label>
                        <input :value="entry.quantity" type="number" min="1" class="npc-builder__quantity-input"
                            @input="updateTrappingQuantity(entry.key, readQuantityValue($event))" />
                    </div>
                    <div class="npc-builder__trap-source">{{ entry.sourceSummary }}</div>
                    <button type="button" class="npc-builder__button npc-builder__button--small"
                        @click="removeTrapping(entry.key)">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import DocumentDrop from '../../../components/DocumentDrop.vue';
import { useNpcBuilderStore } from '../../../stores';

interface DropDocumentPayload {
    dragData: Record<string, unknown>;
    document: ClientDocument | null;
}

const store = useNpcBuilderStore();
const { trappings, settings } = storeToRefs(store);
const { addUserTrapping, updateTrappingName, updateTrappingQuantity, removeTrapping } = store;

const visibleTrappings = computed(() => {
    return Object.values(trappings.value).filter((entry) => {
        if (entry.sourceKind === 'career') {
            return !entry.ignoredFromCareer;
        }
        return !entry.ignored;
    });
});

const careerRows = computed(() => {
    return visibleTrappings.value
        .filter((entry) => entry.sourceKind === 'career')
        .sort((a, b) => a.name.localeCompare(b.name));
});

const baseRows = computed(() => {
    return visibleTrappings.value
        .filter((entry) => entry.sourceKind === 'base')
        .sort((a, b) => a.name.localeCompare(b.name));
});

const userRows = computed(() => {
    return visibleTrappings.value
        .filter((entry) => entry.sourceKind === 'user')
        .sort((a, b) => a.name.localeCompare(b.name));
});

function getTrappingItemTypes(): string[] {
    const configured = (game as any)?.wfrp4e?.config?.trappingItems;
    if (Array.isArray(configured) && configured.length) {
        return configured.map((value) => String(value).toLowerCase());
    }
    return ['trapping', 'armour', 'weapon', 'container', 'ammunition', 'money'];
}

function readQuantityValue(event: Event): number {
    const input = event.target as HTMLInputElement | null;
    if (!input) return 1;
    const parsed = Number(input.value);
    if (!Number.isFinite(parsed)) return 1;
    return Math.max(1, Math.floor(parsed));
}

function readTextValue(event: Event, fallback: string): string {
    const input = event.target as HTMLInputElement | null;
    return String(input?.value ?? '').trim() || fallback;
}

function onAddTrapping(): void {
    addUserTrapping();
}

function onDropInvalid(payload: { dragData: Record<string, unknown> | null; reason: string }): void {
    ui.notifications?.warn(payload.reason);
}

function readDroppedQuantity(document: any): number {
    const quantity = Number(document?.system?.quantity?.value ?? document?.system?.quantity ?? 1);
    if (!Number.isFinite(quantity)) return 1;
    return Math.max(1, Math.floor(quantity));
}

function onDropDocument(payload: DropDocumentPayload): void {
    const droppedDocument = payload.document as any;
    if (!droppedDocument || droppedDocument.documentName !== 'Item') {
        ui.notifications?.warn('Drop an Item here.');
        return;
    }

    const itemType = String(droppedDocument.type ?? '').toLowerCase();
    if (!getTrappingItemTypes().includes(itemType)) {
        ui.notifications?.warn('Only trapping-equivalent items can be added here.');
        return;
    }

    addUserTrapping({
        name: String(droppedDocument.name ?? '').trim() || 'New Trapping',
        quantity: readDroppedQuantity(droppedDocument),
        itemType,
        documentUuid: String(droppedDocument.uuid ?? '').trim() || null,
        sourceData: (droppedDocument.toObject?.() as Record<string, unknown> | undefined) ?? null,
    });
}
</script>

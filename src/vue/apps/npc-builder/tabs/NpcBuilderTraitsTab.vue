<template>
    <section class="npc-builder__placeholder-grid">
        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Traits</div>
            <p class="npc-builder__placeholder-copy">
                Quick Add and Random Traits are controlled from the Main tab. This tab shows the current
                effective trait list and source attribution.
            </p>

            <div class="npc-builder__alloc-actions">
                <button type="button" class="npc-builder__button npc-builder__button--small"
                    @click="refreshQuickTraitOptions">
                    Refresh Quick Traits Folder
                </button>
                <span class="npc-builder__hint" :style="{ color: quickTraitsFolderFound ? '#888' : '#d35400' }">
                    {{ quickTraitsFolderFound ? 'Folder found' : 'Folder not found' }}
                </span>
            </div>

            <div v-if="visibleTraits.length === 0" class="npc-builder__empty">
                No traits selected.
            </div>

            <div v-else class="npc-builder__adv-list">
                <div v-for="entry in visibleTraits" :key="entry.key" class="npc-builder__trap-row">
                    <div class="npc-builder__trap-name">{{ entry.name }}</div>
                    <div class="npc-builder__trap-qty">Qty {{ entry.quantity }}</div>
                    <div class="npc-builder__trap-source">{{ entry.sourceSummary }}</div>
                    <span class="npc-builder__trait-source-tag">{{ sourceLabel(entry) }}</span>
                    <button type="button" class="npc-builder__button npc-builder__button--small"
                        @click="removeTrait(entry.key)">
                        {{ entry.sourceKind === 'user' ? 'Remove' : 'Ignore' }}
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import type { NpcBuilderTraitEntry } from '../../../stores/npc-builder-store';
import { useNpcBuilderStore } from '../../../stores';

const store = useNpcBuilderStore();
const { removeTrait, refreshQuickTraitOptions } = store;
const { traits, quickTraitsFolderFound } = storeToRefs(store);

const visibleTraits = computed(() => {
    return Object.values(traits.value)
        .filter((entry) => !entry.ignored && !entry.ignoredFromCareer)
        .sort((a, b) => a.name.localeCompare(b.name));
});

function sourceLabel(entry: NpcBuilderTraitEntry): string {
    if (entry.sourceKind === 'user') return 'User Added';
    if (entry.sourceKind === 'career') return 'Career';
    return 'Base';
}
</script>

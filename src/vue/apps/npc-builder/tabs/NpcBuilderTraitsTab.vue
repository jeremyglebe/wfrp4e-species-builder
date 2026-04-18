<template>
    <section class="npc-builder__placeholder-grid">
        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Traits</div>
            <p class="npc-builder__placeholder-copy">
                Trait generation and curation workflows will be added here in a later step. This tab currently keeps
                build summary context visible from shared store state.
            </p>

            <div class="npc-builder__summary-grid">
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Final Career</div>
                    <div class="npc-builder__summary-value">{{ finalCareerName }}</div>
                </div>
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Queue Rows</div>
                    <div class="npc-builder__summary-value">{{ careers.length }}</div>
                </div>
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Build Name Preview</div>
                    <div class="npc-builder__summary-value">{{ previewName }}</div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useNpcBuilderStore } from '../../../stores';

/**
 * Traits tab placeholder shell.
 * Intended home for future trait-specific controls and diagnostics.
 */
const store = useNpcBuilderStore();
const { careers, settings, baseActorOverride } = storeToRefs(store);

const finalCareerName = computed(() => {
    const last = careers.value[careers.value.length - 1];
    return last?.name || 'No final career selected yet';
});

const previewName = computed(() => {
    const finalCareer = careers.value[careers.value.length - 1];
    if (!finalCareer) {
        return 'No final career selected yet';
    }

    if (!settings.value.includeSpeciesInName) {
        return finalCareer.name;
    }

    const species = baseActorOverride.value?.species || '[Species]';
    return `${species} ${finalCareer.name}`;
});
</script>

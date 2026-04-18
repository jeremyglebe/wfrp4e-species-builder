<template>
    <section class="npc-builder__placeholder-grid">
        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Trappings</div>
            <p class="npc-builder__placeholder-copy">
                Trappings editing is not implemented yet. This tab is a structural home for upcoming trappings logic
                while preserving existing NPC Builder behavior.
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
                    <div class="npc-builder__summary-label">Image Enhancement</div>
                    <div class="npc-builder__summary-value">{{ settings.enhanceImage ? 'Enabled' : 'Disabled' }}</div>
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
 * Trappings tab placeholder shell.
 * Provides a stable structural target for future trappings features.
 */
const store = useNpcBuilderStore();
const { careers, settings } = storeToRefs(store);

const finalCareerName = computed(() => {
    const last = careers.value[careers.value.length - 1];
    return last?.name || 'No final career selected yet';
});
</script>

<template>
    <section class="npc-builder__placeholder-grid">
        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Skills & Talents</div>
            <p class="npc-builder__placeholder-copy">
                Future skills/talents tooling will live here. This tab currently reflects the active build queue so
                downstream features can reuse the same source of truth.
            </p>

            <div class="npc-builder__summary-grid">
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Final Career</div>
                    <div class="npc-builder__summary-value">{{ finalCareerName }}</div>
                </div>
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Career Queue Rows</div>
                    <div class="npc-builder__summary-value">{{ careers.length }}</div>
                </div>
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Career Instances</div>
                    <div class="npc-builder__summary-value">{{ totalCareerInstances }}</div>
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
 * Skills & Talents tab placeholder shell.
 * Keeps a concrete, store-backed section ready for future implementation.
 */
const store = useNpcBuilderStore();
const { careers } = storeToRefs(store);

const finalCareerName = computed(() => {
    const last = careers.value[careers.value.length - 1];
    return last?.name || 'No final career selected yet';
});

const totalCareerInstances = computed(() => {
    return careers.value.reduce((sum, career) => {
        return sum + (Number.isFinite(career.quantity) ? career.quantity : 1);
    }, 0);
});
</script>

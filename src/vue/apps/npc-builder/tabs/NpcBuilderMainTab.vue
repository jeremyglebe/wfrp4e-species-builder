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
                    <div class="npc-builder__drop-zone" @dragover.prevent @drop="onBaseActorDrop">
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

            <div class="npc-builder__section">
                <div class="npc-builder__section-title">2. Careers</div>
                <div class="npc-builder__hint">
                    Final actor name and image come from the last career in the list.
                </div>

                <div class="npc-builder__form-group">
                    <label>Drop Career Items Here:</label>
                    <div class="npc-builder__drop-zone" @dragover.prevent @drop="onCareerDrop">
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
                        <div v-for="(career, index) in careers" :key="`${career.uuid}-${index}`"
                            class="npc-builder__career-row">
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
                                    <input v-model.number="career.quantity" type="number" min="1"
                                        class="npc-builder__quantity-input" />
                                </div>

                                <div class="npc-builder__button-group">
                                    <button type="button" class="npc-builder__button npc-builder__button--small"
                                        @click="moveCareer(index, -1)" :disabled="index === 0 || isBusy">
                                        ↑
                                    </button>
                                    <button type="button" class="npc-builder__button npc-builder__button--small"
                                        @click="moveCareer(index, 1)"
                                        :disabled="index === careers.length - 1 || isBusy">
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
                <div class="npc-builder__section-title">Advanced Preview (planned)</div>
                <div class="npc-builder__hint">
                    Trappings/talents preview and unresolved warnings will go here.
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
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import type { BaseActorOption } from '../../../../types/module';
import { useNpcBuilderStore } from '../../../stores';

/**
 * Main tab: preserves the current fast workflow (base actor + careers + build)
 * and keeps the at-a-glance summary visible while preparing the app for future
 * feature tabs.
 */
const props = defineProps<{
    baseActors: BaseActorOption[];
    onBaseActorDrop: (event: DragEvent) => Promise<void>;
    onCareerDrop: (event: DragEvent) => Promise<void>;
    onBuildNpc: () => Promise<void>;
}>();

const store = useNpcBuilderStore();
const { removeCareer, moveCareer } = store;

const { baseActorId, baseActorOverride, careers, showBaseOverrideDropZone, settings, isBusy } =
    storeToRefs(store);

const finalCareer = computed(() => {
    return careers.value.length ? careers.value[careers.value.length - 1] : null;
});

const selectedBaseActor = computed(() => {
    return props.baseActors.find((actor) => actor.id === baseActorId.value) ?? null;
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

function handleBaseActorSelectionChange(): void {
    if (baseActorId.value) {
        baseActorOverride.value = null;
        showBaseOverrideDropZone.value = false;
    }
}

function toggleBaseOverrideDropZone(): void {
    showBaseOverrideDropZone.value = !showBaseOverrideDropZone.value;
}
</script>

<template>
    <section class="species-builder__section species-builder__card">
        <div class="species-builder__subspecies-header">
            <h3>Subspecies</h3>
            <button type="button" class="species-builder__button species-builder__button--primary"
                @click="addSubspecies">
                Add Subspecies
            </button>
        </div>

        <div class="species-builder__subspecies-layout">
            <aside class="species-builder__subspecies-list">
                <button v-for="subspecies in selectedSpeciesSubspecies" :key="subspecies.id" type="button"
                    class="species-builder__species-item"
                    :class="{ 'is-selected': selectedSubspeciesId === subspecies.id }"
                    @click="selectSubspecies(subspecies.id)">
                    <div class="species-builder__species-topline">
                        <strong>{{ subspecies.name || 'Unnamed Subspecies' }}</strong>
                        <span class="species-builder__species-id">{{ subspecies.id || 'missing-id' }}</span>
                    </div>
                </button>
            </aside>

            <div v-if="selectedSubspecies" class="species-builder__subspecies-editor">
                <div class="species-builder__subspecies-actions">
                    <p class="species-builder__eyebrow">Subspecies Overrides</p>
                    <button type="button" class="species-builder__button species-builder__button--ghost"
                        @click="deleteSelectedSubspecies">
                        Delete Subspecies
                    </button>
                </div>

                <div class="species-builder__form-grid">
                    <label class="species-builder__field">
                        <span>Name</span>
                        <input v-model="selectedSubspecies.name" type="text" />
                    </label>

                    <label class="species-builder__field">
                        <span>ID</span>
                        <input v-model="selectedSubspecies.id" type="text" @input="syncSelectedSubspeciesId" />
                    </label>

                    <label class="species-builder__field">
                        <span>Movement Override</span>
                        <input v-model="subspeciesMovementText" type="number" placeholder="Use species value" />
                    </label>

                    <label class="species-builder__field">
                        <span>Fate Override</span>
                        <input v-model="subspeciesFateText" type="number" placeholder="Use species value" />
                    </label>

                    <label class="species-builder__field">
                        <span>Resilience Override</span>
                        <input v-model="subspeciesResilienceText" type="number" placeholder="Use species value" />
                    </label>

                    <label class="species-builder__field">
                        <span>Extra Override</span>
                        <input v-model="subspeciesExtraText" type="number" placeholder="Use species value" />
                    </label>
                </div>

                <div class="species-builder__subspecies-override-toggle">
                    <p class="species-builder__eyebrow">Characteristics Override</p>
                    <button v-if="!subspeciesHasCharacteristicsOverride" type="button"
                        class="species-builder__button species-builder__button--primary"
                        @click="enableSubspeciesCharacteristicsOverride">
                        Enable Override
                    </button>
                    <button v-else type="button" class="species-builder__button species-builder__button--ghost"
                        @click="clearSubspeciesCharacteristicsOverride">
                        Use Species Defaults
                    </button>
                </div>

                <div v-if="subspeciesHasCharacteristicsOverride"
                    class="species-builder__form-grid species-builder__characteristics-grid">
                    <label v-for="key in characteristicKeys" :key="`subspecies-${key}`" class="species-builder__field">
                        <span>{{ key.toUpperCase() }}</span>
                        <input v-model="selectedSubspecies.characteristics![key]" type="text" />
                    </label>
                </div>

                <div class="species-builder__split-sections">
                    <section class="species-builder__section species-builder__card">
                        <h3>Skills Override</h3>
                        <textarea v-model="subspeciesSkillsText" rows="5"
                            placeholder="Leave blank to use species skills" />
                    </section>

                    <section class="species-builder__section species-builder__card">
                        <h3>Talents Override</h3>
                        <textarea v-model="subspeciesTalentsText" rows="5"
                            placeholder="Leave blank to use species talents" />
                    </section>
                </div>

                <section class="species-builder__section species-builder__card">
                    <h3>Traits Override</h3>
                    <textarea v-model="subspeciesTraitsText" rows="4" placeholder="Leave blank to use species traits" />
                </section>
            </div>

            <div v-else class="species-builder__empty-state species-builder__card">
                <p>No subspecies selected.</p>
                <button type="button" class="species-builder__button species-builder__button--primary"
                    @click="addSubspecies">
                    Create First Subspecies
                </button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, toRaw, watch } from 'vue';
import type {
    CustomSpeciesDefinition,
    CustomSubspeciesDefinition,
    SpeciesCharacteristics,
} from '../../types/module';
import { Data } from '../../module/services';

const props = defineProps<{
    selectedSpecies: CustomSpeciesDefinition;
    selectedSubspeciesId: string | null;
    characteristicKeys: readonly (keyof SpeciesCharacteristics)[];
}>();

const emit = defineEmits<{
    'update:selectedSubspeciesId': [value: string | null];
    'validation-change': [value: string | null];
}>();

const selectedSpeciesSubspecies = computed(() => {
    return Object.values(props.selectedSpecies.subspecies ?? {});
});

const selectedSubspecies = computed(() => {
    return selectedSpeciesSubspecies.value.find((subspecies) => subspecies.id === props.selectedSubspeciesId) ?? null;
});

const duplicateSubspeciesIds = computed(() => {
    const counts = new Map<string, number>();

    for (const subspecies of selectedSpeciesSubspecies.value) {
        const normalizedId = subspecies.id.trim();
        if (!normalizedId) continue;

        counts.set(normalizedId, (counts.get(normalizedId) ?? 0) + 1);
    }

    return counts;
});

const selectedSubspeciesValidationError = computed(() => {
    if (!selectedSubspecies.value) return null;

    if (!selectedSubspecies.value.name.trim()) {
        return 'Subspecies name is required.';
    }

    const normalizedId = selectedSubspecies.value.id.trim();

    if (!normalizedId) {
        return 'Subspecies ID is required.';
    }

    if ((duplicateSubspeciesIds.value.get(normalizedId) ?? 0) > 1) {
        return 'Subspecies ID must be unique within the species.';
    }

    return null;
});

const subspeciesHasCharacteristicsOverride = computed(() => {
    return Boolean(selectedSubspecies.value?.characteristics);
});

const subspeciesSkillsText = makeOptionalLineListComputed('skills');
const subspeciesTalentsText = makeOptionalLineListComputed('talents');
const subspeciesTraitsText = makeOptionalLineListComputed('traits');
const subspeciesMovementText = makeOptionalNumberComputed('movement');
const subspeciesFateText = makeOptionalNumberComputed('fate');
const subspeciesResilienceText = makeOptionalNumberComputed('resilience');
const subspeciesExtraText = makeOptionalNumberComputed('extra');

function selectSubspecies(subspeciesId: string): void {
    emit('update:selectedSubspeciesId', subspeciesId);
}

function syncSelectedSubspeciesId(): void {
    if (!selectedSubspecies.value) return;

    const previousId = props.selectedSubspeciesId;
    const nextId = selectedSubspecies.value.id;

    if (!previousId || previousId === nextId) {
        emit('update:selectedSubspeciesId', nextId);
        return;
    }

    const subspeciesRecord = ensureSelectedSpeciesSubspecies();
    const previousSubspecies = subspeciesRecord[previousId];

    if (previousSubspecies) {
        delete subspeciesRecord[previousId];
        subspeciesRecord[nextId] = previousSubspecies;
    }

    emit('update:selectedSubspeciesId', nextId);
}

function addSubspecies(): void {
    const subspeciesRecord = ensureSelectedSpeciesSubspecies();
    const newSubspecies = Data.Empty.CustomSubspeciesDefinition();

    subspeciesRecord[newSubspecies.id] = newSubspecies;
    emit('update:selectedSubspeciesId', newSubspecies.id);
}

function deleteSelectedSubspecies(): void {
    if (!selectedSubspecies.value || !props.selectedSubspeciesId) return;

    const subspeciesRecord = ensureSelectedSpeciesSubspecies();
    delete subspeciesRecord[props.selectedSubspeciesId];

    const remainingSubspecies = Object.values(subspeciesRecord);
    emit('update:selectedSubspeciesId', remainingSubspecies[0]?.id ?? null);
}

function enableSubspeciesCharacteristicsOverride(): void {
    if (!selectedSubspecies.value) return;

    selectedSubspecies.value.characteristics = structuredClone(toRaw(props.selectedSpecies.characteristics));
}

function clearSubspeciesCharacteristicsOverride(): void {
    if (!selectedSubspecies.value) return;

    delete selectedSubspecies.value.characteristics;
}

function parseLineList(value: string): string[] {
    return value
        .split('\n')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

function parseOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
    }

    const normalized = String(value ?? '').trim();
    if (!normalized) return undefined;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function setOptionalSubspeciesLineList(
    field: 'skills' | 'talents' | 'traits',
    value: string,
): void {
    if (!selectedSubspecies.value) return;

    const parsed = parseLineList(value);

    if (parsed.length === 0) {
        delete selectedSubspecies.value[field];
        return;
    }

    selectedSubspecies.value[field] = parsed;
}

function makeOptionalLineListComputed(field: 'skills' | 'talents' | 'traits') {
    return computed({
        get: () => selectedSubspecies.value?.[field]?.join('\n') ?? '',
        set: (value: string) => {
            setOptionalSubspeciesLineList(field, value);
        },
    });
}

function setOptionalSubspeciesNumber(
    field: 'movement' | 'fate' | 'resilience' | 'extra',
    value: string | number,
): void {
    if (!selectedSubspecies.value) return;

    const parsed = parseOptionalNumber(value);

    if (parsed === undefined) {
        delete selectedSubspecies.value[field];
        return;
    }

    selectedSubspecies.value[field] = parsed;
}

function makeOptionalNumberComputed(field: 'movement' | 'fate' | 'resilience' | 'extra') {
    return computed({
        get: () => {
            const value = selectedSubspecies.value?.[field];
            return value === undefined ? '' : String(value);
        },
        set: (value: string | number) => {
            setOptionalSubspeciesNumber(field, value);
        },
    });
}

function ensureSelectedSpeciesSubspecies(): Record<string, CustomSubspeciesDefinition> {
    if (!props.selectedSpecies.subspecies) {
        props.selectedSpecies.subspecies = {};
    }

    return props.selectedSpecies.subspecies;
}

function syncSelectedSubspeciesSelection(): void {
    const subspecies = selectedSpeciesSubspecies.value;

    if (subspecies.length === 0) {
        emit('update:selectedSubspeciesId', null);
        return;
    }

    if (!subspecies.some((entry) => entry.id === props.selectedSubspeciesId)) {
        emit('update:selectedSubspeciesId', subspecies[0]?.id ?? null);
    }
}

watch(
    () => selectedSubspeciesValidationError.value,
    (value) => {
        emit('validation-change', value);
    },
    { immediate: true },
);

watch(
    () => props.selectedSpecies.id,
    () => {
        syncSelectedSubspeciesSelection();
    },
    { immediate: true },
);

watch(
    () => selectedSpeciesSubspecies.value,
    () => {
        syncSelectedSubspeciesSelection();
    },
    { deep: true },
);
</script>

<style scoped>
.species-builder__subspecies-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.65rem;
    margin-bottom: 0.75rem;
}

.species-builder__subspecies-layout {
    display: grid;
    grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
    gap: 0.85rem;
}

.species-builder__subspecies-list {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    max-height: 520px;
    overflow: auto;
}

.species-builder__subspecies-editor {
    display: grid;
    gap: 0.85rem;
}

.species-builder__subspecies-actions,
.species-builder__subspecies-override-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.65rem;
}

.species-builder__eyebrow {
    margin: 0 0 0.15rem;
    color: #d3bb9f;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.7rem;
}

.species-builder__species-item {
    all: unset;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    width: 100%;
    text-align: left;
    padding: 0.65rem;
    border: 1px solid #6f5441;
    border-radius: 8px;
    color: #f1e1ce;
    background: linear-gradient(180deg, rgb(103 73 52 / 22%), rgb(44 33 26 / 75%));
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease, background-color 0.15s ease;
}

.species-builder__species-item strong,
.species-builder__species-item span {
    line-height: 1.2;
}

.species-builder__species-item:hover {
    border-color: #9a765f;
    transform: translateY(-1px);
}

.species-builder__species-item.is-selected {
    border-color: #d9a44f;
    box-shadow: 0 0 0 1px rgb(217 164 79 / 55%);
}

.species-builder__species-topline {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.4rem;
}

.species-builder__species-id {
    padding: 0.12rem 0.4rem;
    border-radius: 999px;
    font-size: 0.74rem;
    color: #f0ceb2;
    background: rgb(199 120 87 / 24%);
}

.species-builder__section {
    margin-bottom: 0.95rem;
}

.species-builder__section h3 {
    margin-bottom: 0.7rem;
    color: #f9ebda;
    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
    letter-spacing: 0.03em;
}

.species-builder__card {
    border: 1px solid rgb(137 103 77 / 72%);
    border-radius: 9px;
    padding: 0.8rem;
    background: linear-gradient(180deg, rgb(90 64 47 / 20%), rgb(46 34 27 / 82%));
}

.species-builder__form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(180px, 1fr));
    gap: 0.75rem;
}

.species-builder__characteristics-grid {
    grid-template-columns: repeat(5, minmax(90px, 1fr));
}

.species-builder__field {
    display: flex;
    flex-direction: column;
    gap: 0.32rem;
}

.species-builder__field span {
    color: #d3bb9f;
    font-size: 0.78rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
}

.species-builder__field input {
    width: 100%;
    border: 1px solid #6f5441;
    border-radius: 7px;
    padding: 0.42rem 0.5rem;
    color: #f1e1ce;
    background: rgb(33 24 19 / 92%);
    font: inherit;
}

.species-builder__section textarea {
    width: 100%;
    min-height: 130px;
    padding: 0.55rem 0.6rem;
    border-radius: 7px;
    border: 1px solid #6f5441;
    background: rgb(33 24 19 / 92%);
    color: #f1e1ce;
    font: inherit;
    line-height: 1.35;
    resize: vertical;
}

.species-builder__split-sections {
    display: grid;
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    gap: 0.95rem;
}

.species-builder__button {
    border: 1px solid transparent;
    border-radius: 7px;
    padding: 0.42rem 0.72rem;
    cursor: pointer;
    font: inherit;
    font-weight: 600;
    letter-spacing: 0.02em;
    transition: transform 0.15s ease, filter 0.15s ease, border-color 0.15s ease;
}

.species-builder__button:not(:disabled):hover {
    transform: translateY(-1px);
    filter: brightness(1.07);
}

.species-builder__button--primary {
    border-color: rgb(201 145 75 / 70%);
    color: #27190f;
    background: linear-gradient(180deg, #e8ba72, #c28a3d);
}

.species-builder__button--ghost {
    border-color: rgb(205 103 89 / 60%);
    color: #f7d4ca;
    background: rgb(148 60 50 / 26%);
}

.species-builder__empty-state {
    display: grid;
    gap: 0.85rem;
    place-items: start;
}

.species-builder__empty-state p {
    margin: 0;
}

@media (max-width: 980px) {
    .species-builder__subspecies-layout {
        grid-template-columns: 1fr;
    }

    .species-builder__subspecies-list {
        max-height: 34vh;
    }

    .species-builder__split-sections {
        grid-template-columns: 1fr;
    }

    .species-builder__characteristics-grid {
        grid-template-columns: repeat(2, minmax(120px, 1fr));
    }
}

@media (max-width: 620px) {
    .species-builder__form-grid {
        grid-template-columns: 1fr;
    }
}
</style>

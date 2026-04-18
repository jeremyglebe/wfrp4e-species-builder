<template>
    <section class="npc-builder__placeholder-grid">
        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Skills</div>
            <p class="npc-builder__placeholder-copy">
                Manual sandbox editing for skill advances. Values update store state and XP totals immediately.
            </p>

            <div v-if="skillRows.length === 0" class="npc-builder__empty">
                Select or drop a base actor to load skills.
            </div>

            <div v-else class="npc-builder__adv-list">
                <div v-for="entry in skillRows" :key="`skill-${entry.name}`" class="npc-builder__adv-row">
                    <div class="npc-builder__adv-name">{{ entry.name }}</div>
                    <div class="npc-builder__adv-meta">Base {{ entry.baseline }}</div>
                    <div class="npc-builder__adv-controls">
                        <button type="button" class="npc-builder__button npc-builder__button--small"
                            @click="adjustSkillCurrent(entry.name, -1)">
                            -
                        </button>
                        <input :value="entry.current" type="number" min="0" class="npc-builder__quantity-input"
                            @input="setSkillCurrent(entry.name, readInputValue($event))" />
                        <button type="button" class="npc-builder__button npc-builder__button--small"
                            @click="adjustSkillCurrent(entry.name, 1)">
                            +
                        </button>
                    </div>
                    <div class="npc-builder__adv-xp">XP {{ entry.xp }}</div>
                </div>
            </div>
        </div>

        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Talents</div>
            <p class="npc-builder__placeholder-copy">
                Manual talent rank editing using incremental WFRP rank costs.
            </p>

            <div v-if="talentRows.length === 0" class="npc-builder__empty">
                Select or drop a base actor to load talents.
            </div>

            <div v-else class="npc-builder__adv-list">
                <div v-for="entry in talentRows" :key="`talent-${entry.name}`" class="npc-builder__adv-row">
                    <div class="npc-builder__adv-name">{{ entry.name }}</div>
                    <div class="npc-builder__adv-meta">Base {{ entry.baseline }} / Effective {{
                        entry.effectiveRankForCost }}</div>
                    <div class="npc-builder__adv-controls">
                        <button type="button" class="npc-builder__button npc-builder__button--small"
                            @click="adjustTalentCurrent(entry.name, -1)">
                            -
                        </button>
                        <input :value="entry.current" type="number" min="0" class="npc-builder__quantity-input"
                            @input="setTalentCurrent(entry.name, readInputValue($event))" />
                        <button type="button" class="npc-builder__button npc-builder__button--small"
                            @click="adjustTalentCurrent(entry.name, 1)">
                            +
                        </button>
                    </div>
                    <div class="npc-builder__adv-xp">XP {{ entry.xp }}</div>
                </div>
            </div>
        </div>

        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Characteristics</div>
            <p class="npc-builder__placeholder-copy">
                Manual sandbox editing for characteristic advances.
            </p>

            <div v-if="characteristicRows.length === 0" class="npc-builder__empty">
                Select or drop a base actor to load characteristics.
            </div>

            <div v-else class="npc-builder__adv-list">
                <div v-for="entry in characteristicRows" :key="`characteristic-${entry.name}`"
                    class="npc-builder__adv-row">
                    <div class="npc-builder__adv-name">{{ entry.name }}</div>
                    <div class="npc-builder__adv-meta">Base {{ entry.baseline }}</div>
                    <div class="npc-builder__adv-controls">
                        <button type="button" class="npc-builder__button npc-builder__button--small"
                            @click="adjustCharacteristicCurrent(entry.name, -1)">
                            -
                        </button>
                        <input :value="entry.current" type="number" min="0" class="npc-builder__quantity-input"
                            @input="setCharacteristicCurrent(entry.name, readInputValue($event))" />
                        <button type="button" class="npc-builder__button npc-builder__button--small"
                            @click="adjustCharacteristicCurrent(entry.name, 1)">
                            +
                        </button>
                    </div>
                    <div class="npc-builder__adv-xp">XP {{ entry.xp }}</div>
                </div>
            </div>
        </div>

        <div class="npc-builder__section">
            <div class="npc-builder__section-title">XP Summary</div>
            <div class="npc-builder__summary-grid">
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Skills XP</div>
                    <div class="npc-builder__summary-value">{{ skillsXp }}</div>
                </div>
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Talents XP</div>
                    <div class="npc-builder__summary-value">{{ talentsXp }}</div>
                </div>
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Characteristics XP</div>
                    <div class="npc-builder__summary-value">{{ characteristicsXp }}</div>
                </div>
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Total XP</div>
                    <div class="npc-builder__summary-value">{{ totalXp }}</div>
                </div>
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Base XP</div>
                    <div class="npc-builder__summary-value">{{ totalBaseXp }}</div>
                </div>
                <div class="npc-builder__summary-card">
                    <div class="npc-builder__summary-label">Delta XP</div>
                    <div class="npc-builder__summary-value">{{ xpDelta }}</div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useNpcBuilderStore } from '../../../stores';
import {
    getCharacteristicXpCost,
    getSkillXpCost,
    getTalentXpCost,
} from '../xp-cost';

/**
 * Skills & Talents tab with characteristic support.
 *
 * Provides manual editing of advances/ranks and live XP calculation using
 * the WFRP 4e cost tables.
 */
const store = useNpcBuilderStore();
const {
    skills,
    talents,
    characteristics,
    skillsXp,
    talentsXp,
    characteristicsXp,
    totalXp,
    totalBaseXp,
    xpDelta,
} = storeToRefs(store);

const {
    setSkillCurrent,
    setTalentCurrent,
    setCharacteristicCurrent,
    adjustSkillCurrent,
    adjustTalentCurrent,
    adjustCharacteristicCurrent,
} = store;

const skillRows = computed(() => {
    return Object.entries(skills.value)
        .map(([name, value]) => ({
            name,
            baseline: value.baseline,
            current: value.current,
            xp: getTalentXpCost(value.current) - getTalentXpCost(value.baseline),
            includedFromCareer: value.includedFromCareer,
            includedFromBase: value.includedFromBase,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
});

const talentRows = computed(() => {
    return Object.entries(talents.value)
        .map(([name, value]) => ({
            name,
            baseline: value.baseline,
            current: value.current,
            xp: getTalentXpCost(value.current) - getTalentXpCost(value.effectiveRankForCost),
            includedFromCareer: value.includedFromCareer,
            includedFromBase: value.includedFromBase,
            effectiveRankForCost: value.effectiveRankForCost,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
});

const characteristicRows = computed(() => {
    return Object.entries(characteristics.value)
        .map(([name, value]) => ({
            name,
            baseline: value.baseline,
            current: value.current,
            xp: getTalentXpCost(value.current) - getTalentXpCost(value.baseline),
            includedFromCareer: value.includedFromCareer,
            includedFromBase: value.includedFromBase,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
});

function readInputValue(event: Event): number {
    const input = event.target as HTMLInputElement | null;
    if (!input) return 0;

    const parsed = Number(input.value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.floor(parsed));
}
</script>

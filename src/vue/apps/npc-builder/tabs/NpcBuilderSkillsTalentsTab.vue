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
        <div class="npc-builder__adv-head" aria-hidden="true">
          <div class="npc-builder__adv-head-name" title="Name of this skill, talent, or characteristic entry.">Name
          </div>
          <div class="npc-builder__adv-head-total"
            title="Final projected value when the NPC is built: base statblock value plus your planned advances/ranks.">
            Total
          </div>
          <div class="npc-builder__adv-head-controls"
            title="Editable advances/ranks used by the builder. Use +/- or type a value.">Advances</div>
          <div class="npc-builder__adv-head-xp"
            title="Current XP cost for the Advances value using WFRP progression tables.">XP</div>
          <div class="npc-builder__adv-head-base"
            title="Value from the selected base statblock before career defaults and manual edits.">Base</div>
          <div class="npc-builder__adv-head-careers" title="Queued careers that grant this entry.">Careers</div>
          <div class="npc-builder__adv-head-default"
            title="Expected value after adding queued careers with no manual edits. This is the initial value loaded into Advances.">
            Default
          </div>
        </div>
        <div v-for="entry in skillRows" :key="`skill-${entry.name}`" class="npc-builder__adv-row">
          <div class="npc-builder__adv-name">{{ entry.name }}</div>
          <div class="npc-builder__adv-total">{{ entry.total }}</div>
          <div class="npc-builder__adv-controls">
            <button type="button" class="npc-builder__button npc-builder__button--small"
              :title="`-${skillPrevRefund(entry.current)} XP`" @click="adjustSkillCurrent(entry.name, -1)">
              -
            </button>
            <input :value="entry.current" type="number" min="0" class="npc-builder__quantity-input"
              @input="setSkillCurrent(entry.name, readInputValue($event))" />
            <button type="button" class="npc-builder__button npc-builder__button--small"
              :title="`+${skillNextCost(entry.current)} XP`" @click="adjustSkillCurrent(entry.name, 1)">
              +
            </button>
          </div>
          <div class="npc-builder__adv-xp">{{ entry.xp }}</div>
          <div class="npc-builder__adv-base">{{ entry.baseActorTotal }}</div>
          <div class="npc-builder__adv-careers">{{ entry.careerSummary }}</div>
          <div class="npc-builder__adv-default">{{ entry.defaultValue }}</div>
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
        <div class="npc-builder__adv-head" aria-hidden="true">
          <div class="npc-builder__adv-head-name" title="Name of this skill, talent, or characteristic entry.">Name
          </div>
          <div class="npc-builder__adv-head-total"
            title="Final projected value when the NPC is built: base statblock value plus your planned advances/ranks.">
            Total
          </div>
          <div class="npc-builder__adv-head-controls"
            title="Editable advances/ranks used by the builder. Use +/- or type a value.">Advances</div>
          <div class="npc-builder__adv-head-xp"
            title="Current XP cost for the Advances value using WFRP progression tables.">XP</div>
          <div class="npc-builder__adv-head-base"
            title="Value from the selected base statblock before career defaults and manual edits.">Base</div>
          <div class="npc-builder__adv-head-careers" title="Queued careers that grant this entry.">Careers</div>
          <div class="npc-builder__adv-head-default"
            title="Expected value after adding queued careers with no manual edits. This is the initial value loaded into Advances.">
            Default
          </div>
        </div>
        <div v-for="entry in talentRows" :key="`talent-${entry.name}`" class="npc-builder__adv-row">
          <div class="npc-builder__adv-name">{{ entry.name }}</div>
          <div class="npc-builder__adv-total">{{ entry.total }}</div>
          <div class="npc-builder__adv-controls">
            <button type="button" class="npc-builder__button npc-builder__button--small"
              :title="`-${talentPrevRefund(entry.current)} XP`" @click="adjustTalentCurrent(entry.name, -1)">
              -
            </button>
            <input :value="entry.current" type="number" min="0" class="npc-builder__quantity-input"
              @input="setTalentCurrent(entry.name, readInputValue($event))" />
            <button type="button" class="npc-builder__button npc-builder__button--small"
              :title="`+${talentNextCost(entry.current)} XP`" @click="adjustTalentCurrent(entry.name, 1)">
              +
            </button>
          </div>
          <div class="npc-builder__adv-xp">{{ entry.xp }}</div>
          <div class="npc-builder__adv-base">{{ entry.baseActorTotal }}</div>
          <div class="npc-builder__adv-careers">{{ entry.careerSummary }}</div>
          <div class="npc-builder__adv-default">{{ entry.defaultValue }}</div>
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
        <div class="npc-builder__adv-head" aria-hidden="true">
          <div class="npc-builder__adv-head-name" title="Name of this skill, talent, or characteristic entry.">Name
          </div>
          <div class="npc-builder__adv-head-total"
            title="Final projected value when the NPC is built: base statblock value plus your planned advances/ranks.">
            Total
          </div>
          <div class="npc-builder__adv-head-controls"
            title="Editable advances/ranks used by the builder. Use +/- or type a value.">Advances</div>
          <div class="npc-builder__adv-head-xp"
            title="Current XP cost for the Advances value using WFRP progression tables.">XP</div>
          <div class="npc-builder__adv-head-base"
            title="Value from the selected base statblock before career defaults and manual edits.">Base</div>
          <div class="npc-builder__adv-head-careers" title="Queued careers that grant this entry.">Careers</div>
          <div class="npc-builder__adv-head-default"
            title="Expected value after adding queued careers with no manual edits. This is the initial value loaded into Advances.">
            Default
          </div>
        </div>
        <div v-for="entry in characteristicRows" :key="`characteristic-${entry.name}`" class="npc-builder__adv-row">
          <div class="npc-builder__adv-name">{{ entry.name }}</div>
          <div class="npc-builder__adv-total">{{ entry.total }}</div>
          <div class="npc-builder__adv-controls">
            <button type="button" class="npc-builder__button npc-builder__button--small"
              :title="`-${characteristicPrevRefund(entry.current)} XP`"
              @click="adjustCharacteristicCurrent(entry.name, -1)">
              -
            </button>
            <input :value="entry.current" type="number" min="0" class="npc-builder__quantity-input"
              @input="setCharacteristicCurrent(entry.name, readInputValue($event))" />
            <button type="button" class="npc-builder__button npc-builder__button--small"
              :title="`+${characteristicNextCost(entry.current)} XP`"
              @click="adjustCharacteristicCurrent(entry.name, 1)">
              +
            </button>
          </div>
          <div class="npc-builder__adv-xp">{{ entry.xp }}</div>
          <div class="npc-builder__adv-base">{{ entry.baseActorTotal }}</div>
          <div class="npc-builder__adv-careers">{{ entry.careerSummary }}</div>
          <div class="npc-builder__adv-default">{{ entry.defaultValue }}</div>
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

    <div class="npc-builder__section">
      <div class="npc-builder__section-title">Auto-Allocation</div>
      <p class="npc-builder__placeholder-copy">
        Set a target XP and choose whether it means final total XP or XP delta budget.
        Then pick a strategy to distribute advances from the career baseline.
        Click <strong>Allocate</strong> to apply; click
        <strong>Reset</strong> to restore your manually edited values.
      </p>

      <div class="npc-builder__alloc-row">
        <label class="npc-builder__alloc-label" for="npc-target-kind">Target Means</label>
        <select id="npc-target-kind" v-model="allocationTargetKind" class="npc-builder__select"
          @change="onAllocationTargetKindChange">
          <option value="total">Final Total XP</option>
          <option value="delta">XP Delta Budget</option>
        </select>
      </div>

      <div class="npc-builder__alloc-row">
        <label class="npc-builder__alloc-label" for="npc-target-xp">Target XP</label>
        <input id="npc-target-xp" v-model.number="targetXp" type="number" :min="allocationTargetMin"
          @change="normalizeTargetXpInput" class="npc-builder__quantity-input npc-builder__quantity-input--wide" />
      </div>

      <div v-if="allocationTargetKind === 'total'" class="npc-builder__alloc-unspent">
        Minimum total target is Base XP: {{ totalBaseXp }}
      </div>

      <div class="npc-builder__alloc-unspent">
        Allocation budget from target: {{ allocationBudgetPreview }} XP
      </div>

      <div class="npc-builder__alloc-row">
        <label class="npc-builder__alloc-label" for="npc-alloc-strategy">Strategy</label>
        <select id="npc-alloc-strategy" v-model="allocationStrategy" class="npc-builder__select">
          <option v-for="(meta, key) in ALLOCATION_STRATEGIES" :key="key" :value="key">
            {{ meta.label }}
          </option>
        </select>
      </div>

      <div class="npc-builder__alloc-actions">
        <button type="button" class="npc-builder__button" @click="applyXpAllocation">
          Allocate
        </button>
        <button type="button" class="npc-builder__button" :disabled="!hasAllocationSnapshot" @click="resetXpAllocation">
          Reset to Manual
        </button>
      </div>

      <div v-if="lastAllocationUnspent > 0" class="npc-builder__alloc-unspent">
        Unallocated XP: {{ lastAllocationUnspent }}
        (all entries reached their cap before the budget was exhausted)
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
import { ALLOCATION_STRATEGIES } from '../xp-allocation';

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
  targetXp,
  allocationTargetKind,
  allocationStrategy,
  preAllocationSnapshot,
  lastAllocationUnspent,
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
  applyXpAllocation,
  resetXpAllocation,
} = store;

const hasAllocationSnapshot = computed(() => preAllocationSnapshot.value !== null);
const allocationTargetMin = computed(() => {
  return allocationTargetKind.value === 'total' ? totalBaseXp.value : 0;
});
const allocationBudgetPreview = computed(() => {
  if (allocationTargetKind.value === 'total') {
    return Math.max(0, targetXp.value - totalBaseXp.value);
  }
  return Math.max(0, targetXp.value);
});

function normalizeTargetXpInput(): void {
  const min = allocationTargetMin.value;
  const parsed = Number(targetXp.value);
  if (!Number.isFinite(parsed)) {
    targetXp.value = min;
    return;
  }
  targetXp.value = Math.max(min, Math.floor(parsed));
}

function onAllocationTargetKindChange(): void {
  normalizeTargetXpInput();
}

const skillRows = computed(() => {
  return Object.entries(skills.value)
    .map(([name, value]) => ({
      name,
      baseline: value.baseline,
      baseActorValue: value.baseActorValue,
      baseActorTotal: value.baseActorTotal,
      current: value.current,
      total: value.baseActorTotal + value.current,
      defaultValue: value.baseline,
      careerSummary: formatCareerSources(value.careerSources),
      xp: getSkillXpCost(value.current),
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
      baseActorValue: value.baseActorValue,
      baseActorTotal: value.baseActorTotal,
      current: value.current,
      total: value.current,
      defaultValue: value.effectiveRankForCost,
      careerSummary: formatCareerSources(value.careerSources),
      xp: getTalentXpCost(value.current),
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
      baseActorValue: value.baseActorValue,
      baseActorTotal: value.baseActorTotal,
      current: value.current,
      total: value.baseActorTotal + value.current,
      defaultValue: value.baseline,
      careerSummary: formatCareerSources(value.careerSources),
      xp: getCharacteristicXpCost(value.current),
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

function formatCareerSources(sources: Array<{ label: string; count: number }>): string {
  const formatted = sources
    .filter((source) => source.label.trim().length > 0 && source.count > 0)
    .map((source) => `${source.label} x${source.count}`)
    .join(' / ');
  return formatted || '-';
}

function skillNextCost(current: number): number {
  return getSkillXpCost(current + 1) - getSkillXpCost(current);
}
function skillPrevRefund(current: number): number {
  if (current <= 0) return 0;
  return getSkillXpCost(current) - getSkillXpCost(current - 1);
}

function talentNextCost(current: number): number {
  return getTalentXpCost(current + 1) - getTalentXpCost(current);
}
function talentPrevRefund(current: number): number {
  if (current <= 0) return 0;
  return getTalentXpCost(current) - getTalentXpCost(current - 1);
}

function characteristicNextCost(current: number): number {
  return getCharacteristicXpCost(current + 1) - getCharacteristicXpCost(current);
}
function characteristicPrevRefund(current: number): number {
  if (current <= 0) return 0;
  return getCharacteristicXpCost(current) - getCharacteristicXpCost(current - 1);
}
</script>

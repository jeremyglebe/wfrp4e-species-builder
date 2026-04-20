import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { BaseActorOverride, CareerEntry, NPCBuilderSettings } from '../../types/module';
import {
  getDefaultNPCBuilderSettings,
  saveNPCBuilderSettings,
} from '../../module/services/settings/npcs';
import {
  getCharacteristicXpCost,
  getSkillXpCost,
  getTalentXpCost,
} from '../apps/npc-builder/xp-cost';

/**
 * Tracks advancement sources and values for a single skill, talent, or characteristic.
 *
 * The model distinguishes between:
 * - baseline: value derived from queued careers only
 * - current: user-edited advancement value
 * - includedFromCareer: whether this entry is granted by at least one queued career
 * - includedFromBase: whether this entry exists on the selected base actor
 * - effectiveRankForCost: (talents only) the effective rank before user edits, used for XP cost calculation
 * - editable: whether the user can modify the current value in the UI
 */
export interface AdvancementValue {
  /** Total baseline advances/ranks from all queued careers */
  baseline: number;
  /** User-edited current advances/ranks */
  current: number;
  /** True if at least one queued career grants this skill/talent/characteristic */
  includedFromCareer: boolean;
  /** True if the base actor already has this skill/talent/characteristic */
  includedFromBase: boolean;
  /** (talents only) The effective rank from all sources (career + base) before user edits, used for cost calculation */
  effectiveRankForCost: number;
  /** Whether this entry is editable by the user in the UI */
  editable: boolean;
  /** Source breakdown used for explanatory UI, primarily for talents. */
  sources: AdvancementSourceCount[];
}

export interface AdvancementSourceCount {
  label: string;
  count: number;
}

/**
 * Career-derived advancement baseline snapshot.
 * Built directly from queued careers, before base actor inclusion.
 */
export interface CareerAdvancementBaseline {
  /** Career-derived skill advances: keyed by skill name, value is total +5 per matching career */
  skills: Record<string, number>;
  /** Career-derived talent ranks: keyed by talent name, value is total +1 per matching career */
  talents: Record<string, number>;
  /** Career-derived characteristic advances: keyed by characteristic name, value is +5 per career that grants it */
  characteristics: Record<string, number>;
  /** Career-derived talent source counts used for UI explanations. */
  talentSources: Record<string, AdvancementSourceCount[]>;
}

/**
 * Optional base actor advancement snapshot.
 * Captured from the selected base actor for optional inclusion.
 */
export interface BaseActorAdvancementSnapshot {
  /** Base actor display name for source breakdown text */
  actorName: string;
  /** Base actor skill advances: keyed by skill name */
  skills: Record<string, number>;
  /** Base actor talent ranks: keyed by talent name */
  talents: Record<string, number>;
  /** Base actor characteristic advances: keyed by characteristic name */
  characteristics: Record<string, number>;
}

/**
 * NPC Builder Pinia store.
 *
 * Owns all in-memory working state for the NPC Builder application.
 * This is the single source of truth for the current build session.
 *
 * Persistence responsibilities (loading from / saving to Foundry world
 * settings) are delegated to the settings service in
 * src/module/services/settings/npcs.ts — this store does not call
 * game.settings directly.
 *
 * Lifecycle: hydrateFromStorage() is called by NPCBuilderApplication
 * before the Vue app mounts on each open, reloading persisted settings
 * and resetting transient working state to a clean slate.
 */
export const useNpcBuilderStore = defineStore('npc-builder', () => {
  // ---------------------------------------------------------------------------
  // Working state — resets each time the app opens via hydrateFromStorage()
  // ---------------------------------------------------------------------------

  /** ID of the actor currently selected in the base folder dropdown. */
  const baseActorId = ref('');

  /** Actor dragged directly onto the override zone, takes priority over dropdown. */
  const baseActorOverride = ref<BaseActorOverride | null>(null);

  /** Ordered list of careers queued for the current build. */
  const careers = ref<CareerEntry[]>([]);

  /** Active tab in the NPC Builder UI. */
  const activeTab = ref<'main' | 'skills-talents' | 'traits' | 'trappings' | 'settings'>('main');

  /** Whether the base actor override drop zone is visible. */
  const showBaseOverrideDropZone = ref(true);

  // ---------------------------------------------------------------------------
  // Busy state — managed by the build orchestration logic in the component
  // ---------------------------------------------------------------------------

  /** True while a long-running async operation (e.g. NPC build) is in progress. */
  const isBusy = ref(false);

  /** Human-readable status message shown in the busy overlay. */
  const busyMessage = ref('');

  // ---------------------------------------------------------------------------
  // Persisted settings — loaded from world settings on each open
  // ---------------------------------------------------------------------------

  /** NPC Builder configuration (folder names, behavior flags). */
  const settings = ref<NPCBuilderSettings>(getDefaultNPCBuilderSettings());

  // ---------------------------------------------------------------------------
  // Skills / talents / characteristics advancement state (sandbox editor)
  // ---------------------------------------------------------------------------

  /** Skill advancements: base from generated state + current user-edited value. */
  const skills = ref<Record<string, AdvancementValue>>({});

  /** Talent ranks: base from generated state + current user-edited value. */
  const talents = ref<Record<string, AdvancementValue>>({});

  /** Characteristic advancements: base from generated state + current user-edited value. */
  const characteristics = ref<Record<string, AdvancementValue>>({});

  const skillsXp = computed(() => {
    return Object.values(skills.value).reduce((sum, entry) => {
      return sum + getSkillXpCost(entry.current);
    }, 0);
  });

  const talentsXp = computed(() => {
    return Object.values(talents.value).reduce((sum, entry) => {
      return sum + getTalentXpCost(entry.current);
    }, 0);
  });

  const characteristicsXp = computed(() => {
    return Object.values(characteristics.value).reduce((sum, entry) => {
      return sum + getCharacteristicXpCost(entry.current);
    }, 0);
  });

  const totalXp = computed(() => {
    return skillsXp.value + talentsXp.value + characteristicsXp.value;
  });

  /**
   * Base XP uses the effective baseline from all sources:
   * - Skills: career-derived only (base actor values don't count as advances)
   * - Characteristics: career-derived only
   * - Talents: career + base actor (base ranks always count for cost)
   */
  const baseSkillsXp = computed(() => {
    return Object.values(skills.value).reduce((sum, entry) => {
      return sum + getSkillXpCost(entry.baseline);
    }, 0);
  });

  const baseTalentsXp = computed(() => {
    return Object.values(talents.value).reduce((sum, entry) => {
      // For talents, use effectiveRankForCost which includes base contributions
      return sum + getTalentXpCost(entry.effectiveRankForCost);
    }, 0);
  });

  const baseCharacteristicsXp = computed(() => {
    return Object.values(characteristics.value).reduce((sum, entry) => {
      return sum + getCharacteristicXpCost(entry.baseline);
    }, 0);
  });

  const totalBaseXp = computed(() => {
    return baseSkillsXp.value + baseTalentsXp.value + baseCharacteristicsXp.value;
  });

  const xpDelta = computed(() => {
    return totalXp.value - totalBaseXp.value;
  });

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Loads persisted NPC Builder settings into the store and resets all
   * transient working state to a clean default.
   *
   * Called by NPCBuilderApplication.getVueProps() before the Vue app mounts.
   */
  function hydrateFromStorage(savedSettings: NPCBuilderSettings): void {
    settings.value = savedSettings;
    // Reset transient working state so each open starts fresh
    baseActorId.value = '';
    baseActorOverride.value = null;
    careers.value = [];
    activeTab.value = 'main';
    showBaseOverrideDropZone.value = true;
    skills.value = {};
    talents.value = {};
    characteristics.value = {};
    isBusy.value = false;
    busyMessage.value = '';
  }

  function toSafeNonNegativeInteger(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.floor(value));
  }

  /**
   * Builds a career advancement baseline by extracting skills, talents, and characteristics
   * from all queued careers. Each career contributes:
   * - +5 advances to each of its skills
   * - +1 rank to each of its talents
   * - availability for each of its characteristics
   */
  async function buildCareerAdvancements(): Promise<CareerAdvancementBaseline> {
    const baseline: CareerAdvancementBaseline = {
      skills: {},
      talents: {},
      characteristics: {},
      talentSources: {},
    };

    for (const careerEntry of careers.value) {
      const careerItem = await fromUuid(careerEntry.uuid);
      if (!careerItem || typeof careerItem !== 'object') continue;

      const careerItemAny = careerItem as any;
      const quantity = Math.max(1, Math.floor(Number(careerEntry.quantity) || 1));

      // Read career skills from system.skills array
      const careerSkills = careerItemAny?.system?.skills;
      if (Array.isArray(careerSkills)) {
        for (const skillName of careerSkills) {
          const trimmedName = String(skillName ?? '').trim();
          if (trimmedName) {
            baseline.skills[trimmedName] = (baseline.skills[trimmedName] ?? 0) + 5 * quantity;
          }
        }
      }

      // Read career talents from system.talents array
      const careerTalents = careerItemAny?.system?.talents;
      if (Array.isArray(careerTalents)) {
        for (const talentName of careerTalents) {
          const trimmedName = String(talentName ?? '').trim();
          if (trimmedName) {
            baseline.talents[trimmedName] = (baseline.talents[trimmedName] ?? 0) + quantity;

            const existingSources = baseline.talentSources[trimmedName] ?? [];
            const existingCareerSource = existingSources.find(
              (source) => source.label === careerEntry.name,
            );
            if (existingCareerSource) {
              existingCareerSource.count += quantity;
            } else {
              existingSources.push({
                label: careerEntry.name,
                count: quantity,
              });
            }
            baseline.talentSources[trimmedName] = existingSources;
          }
        }
      }

      // Read career characteristics - only include those where value is true
      // Each career contributes +5 advances per characteristic it grants
      const careerCharacteristics = careerItemAny?.system?.characteristics;
      if (careerCharacteristics && typeof careerCharacteristics === 'object') {
        for (const [key, value] of Object.entries(careerCharacteristics as Record<string, any>)) {
          // Only include if explicitly true
          if (value === true) {
            const normalizedKey = String(key).toUpperCase().trim();
            if (normalizedKey) {
              baseline.characteristics[normalizedKey] =
                (baseline.characteristics[normalizedKey] ?? 0) + 5 * quantity;
            }
          }
        }
      }
    }

    return baseline;
  }

  /**
   * Reads advancement values from a base actor for optional inclusion.
   */
  function readBaseActorAdvancements(baseActor: any | null): BaseActorAdvancementSnapshot {
    const snapshot: BaseActorAdvancementSnapshot = {
      actorName: String((baseActor as any)?.name ?? '').trim(),
      skills: {},
      talents: {},
      characteristics: {},
    };

    if (!baseActor || typeof baseActor !== 'object') return snapshot;

    const baseActorAny = baseActor as any;

    // Read characteristics
    const characteristics = baseActorAny?.system?.characteristics;
    if (characteristics && typeof characteristics === 'object') {
      for (const [key, value] of Object.entries(characteristics as Record<string, any>)) {
        const normalizedKey = String(key).toUpperCase().trim();
        if (!normalizedKey) continue;

        const advances = readNumberFromPaths(value, [
          'advances.value',
          'advances',
          'advance.value',
          'advance',
        ]);
        snapshot.characteristics[normalizedKey] = toSafeNonNegativeInteger(advances ?? 0);
      }
    }

    // Read skills and talents from items
    if (Array.isArray(baseActorAny?.items?.contents)) {
      for (const item of baseActorAny.items.contents) {
        const itemType = String(item?.type ?? '').toLowerCase();
        const itemName = String(item?.name ?? '').trim();
        if (!itemName) continue;

        if (itemType === 'skill') {
          const advances = readNumberFromPaths(item?.system, [
            'advances.value',
            'advances',
            'level.value',
            'level',
          ]);
          snapshot.skills[itemName] = toSafeNonNegativeInteger(advances ?? 0);
        }

        if (itemType === 'talent') {
          const rank = readNumberFromPaths(item?.system, [
            'advances.value',
            'advances',
            'level.value',
            'level',
            'rank.value',
            'rank',
          ]);
          const talentBase = rank == null ? 1 : toSafeNonNegativeInteger(rank);
          snapshot.talents[itemName] = Math.max(1, talentBase);
        }
      }
    }

    return snapshot;
  }

  /**
   * Helper to read a number from multiple possible paths in an object.
   */
  function readNumberFromPaths(source: any, paths: string[]): number | null {
    for (const path of paths) {
      const segments = path.split('.');
      let current: any = source;

      for (const segment of segments) {
        current = current?.[segment];
      }

      if (typeof current === 'number' && Number.isFinite(current)) {
        return current;
      }

      if (typeof current === 'string' && current.trim().length > 0) {
        const numeric = Number(current);
        if (Number.isFinite(numeric)) {
          return numeric;
        }
      }
    }

    return null;
  }

  /**
   * Merges career-derived baselines with optional base actor advancement values
   * to create the final AdvancementValue entries for skills, talents, and characteristics.
   *
   * This is the core logic that implements the corrected advancement model:
   * - Skills: career baseline only, base actor values ignored for advancement tracking
   * - Talents: career baseline + base actor ranks for cost calculation
   * - Characteristics: career-granted only, base actor values don't count as advances
   */
  function mergeAdvancementsWithSettings(
    careerBaseline: CareerAdvancementBaseline,
    baseActorValues: BaseActorAdvancementSnapshot,
  ): {
    skills: Record<string, AdvancementValue>;
    talents: Record<string, AdvancementValue>;
    characteristics: Record<string, AdvancementValue>;
  } {
    const result = {
      skills: {} as Record<string, AdvancementValue>,
      talents: {} as Record<string, AdvancementValue>,
      characteristics: {} as Record<string, AdvancementValue>,
    };

    function getTalentSourceCounts(talentName: string): AdvancementSourceCount[] {
      const sourceCounts: AdvancementSourceCount[] = [];
      const baseCount = baseActorValues.talents[talentName] ?? 0;
      const baseLabel = baseActorValues.actorName;

      if (baseCount > 0 && baseLabel) {
        sourceCounts.push({
          label: baseLabel,
          count: baseCount,
        });
      }

      for (const source of careerBaseline.talentSources[talentName] ?? []) {
        sourceCounts.push({
          label: source.label,
          count: source.count,
        });
      }

      return sourceCounts;
    }

    // Merge skills
    const allSkillKeys = new Set([
      ...Object.keys(careerBaseline.skills),
      ...Object.keys(baseActorValues.skills),
    ]);
    for (const skillName of allSkillKeys) {
      const fromCareer = careerBaseline.skills[skillName] ?? 0;
      const fromBase = baseActorValues.skills[skillName] ?? 0;
      const fromBaseExists = fromBase > 0;

      const shouldShow =
        fromCareer > 0 || (fromBaseExists && settings.value.allowUpgradeBaseSkills);
      if (!shouldShow) continue;

      result.skills[skillName] = {
        baseline: fromCareer, // Skills: only career counts as baseline
        current: fromCareer, // Start from career baseline
        includedFromCareer: fromCareer > 0,
        includedFromBase: fromBaseExists,
        effectiveRankForCost: 0, // Not used for skills
        editable: true, // Skills are always editable if shown
        sources: [],
      };
    }

    // Merge talents
    const allTalentKeys = new Set([
      ...Object.keys(careerBaseline.talents),
      ...Object.keys(baseActorValues.talents),
    ]);
    for (const talentName of allTalentKeys) {
      const fromCareer = careerBaseline.talents[talentName] ?? 0;
      const fromBase = baseActorValues.talents[talentName] ?? 0;
      const fromBaseExists = fromBase > 0;

      const editable = fromCareer > 0 || (fromBaseExists && settings.value.allowUpgradeBaseTalents);
      const shouldShow = editable;
      if (!shouldShow) continue;

      // For talents: effective rank always includes base contributions (even if not editable)
      const effectiveRankForCost = fromCareer + (fromBaseExists ? fromBase : 0);

      result.talents[talentName] = {
        baseline: fromCareer, // Talents: baseline is career-only
        current: effectiveRankForCost, // Start from effective rank (career + base)
        includedFromCareer: fromCareer > 0,
        includedFromBase: fromBaseExists,
        effectiveRankForCost, // For cost calculation
        editable,
        sources: getTalentSourceCounts(talentName),
      };
    }

    // Merge characteristics
    const allCharKeys = new Set([
      ...Object.keys(careerBaseline.characteristics),
      ...Object.keys(baseActorValues.characteristics),
    ]);
    for (const charName of allCharKeys) {
      const fromCareer = careerBaseline.characteristics[charName] ?? 0;
      const fromBase = baseActorValues.characteristics[charName] ?? 0;
      const fromCareerExists = fromCareer > 0;
      const fromBaseExists = fromBase > 0;

      const shouldShow =
        fromCareerExists || (fromBaseExists && settings.value.allowUpgradeBaseCharacteristics);
      if (!shouldShow) continue;

      // Career characteristics start at their career-derived baseline (typically 5 per career)
      // Base characteristic values do not count as prior advances (they start from 0)
      const baseline = fromCareer;
      const current = fromCareer; // Start from career baseline

      result.characteristics[charName] = {
        baseline,
        current,
        includedFromCareer: fromCareerExists,
        includedFromBase: fromBaseExists,
        effectiveRankForCost: 0, // Not used for characteristics
        editable: true, // Always editable if shown
        sources: [],
      };
    }

    return result;
  }

  /**
   * Hydrates all advancement categories (skills, talents, characteristics) based on
   * queued careers and optional base actor. Uses the corrected career-baseline model.
   *
   * Preserves user-edited current values where possible.
   */
  async function hydrateAdvancements(baseActor: any | null, preserveCurrent = true): Promise<void> {
    const careerBaseline = await buildCareerAdvancements();
    const baseActorValues = readBaseActorAdvancements(baseActor);
    const merged = mergeAdvancementsWithSettings(careerBaseline, baseActorValues);

    // Update skills while optionally preserving user edits
    const nextSkills: Record<string, AdvancementValue> = {};
    for (const [name, newEntry] of Object.entries(merged.skills)) {
      const existing = skills.value[name];
      nextSkills[name] = {
        ...newEntry,
        current:
          preserveCurrent && existing
            ? Math.max(toSafeNonNegativeInteger(existing.current), newEntry.current)
            : newEntry.current,
      };
    }
    skills.value = nextSkills;

    // Update talents while optionally preserving user edits
    const nextTalents: Record<string, AdvancementValue> = {};
    for (const [name, newEntry] of Object.entries(merged.talents)) {
      const existing = talents.value[name];
      nextTalents[name] = {
        ...newEntry,
        current:
          preserveCurrent && existing
            ? Math.max(toSafeNonNegativeInteger(existing.current), newEntry.current)
            : newEntry.current,
      };
    }
    talents.value = nextTalents;

    // Update characteristics while optionally preserving user edits
    const nextCharacteristics: Record<string, AdvancementValue> = {};
    for (const [name, newEntry] of Object.entries(merged.characteristics)) {
      const existing = characteristics.value[name];
      nextCharacteristics[name] = {
        ...newEntry,
        current:
          preserveCurrent && existing
            ? Math.max(toSafeNonNegativeInteger(existing.current), newEntry.current)
            : newEntry.current,
      };
    }
    characteristics.value = nextCharacteristics;
  }

  function setSkillCurrent(name: string, current: number): void {
    const existing = skills.value[name];
    if (!existing) return;
    skills.value[name] = {
      ...existing,
      current: toSafeNonNegativeInteger(current),
    };
  }

  function setTalentCurrent(name: string, current: number): void {
    const existing = talents.value[name];
    if (!existing) return;
    talents.value[name] = {
      ...existing,
      current: toSafeNonNegativeInteger(current),
    };
  }

  function setCharacteristicCurrent(name: string, current: number): void {
    const existing = characteristics.value[name];
    if (!existing) return;
    characteristics.value[name] = {
      ...existing,
      current: toSafeNonNegativeInteger(current),
    };
  }

  function adjustSkillCurrent(name: string, delta: number): void {
    const existing = skills.value[name];
    if (!existing) return;
    const nextValue = existing.current + Math.floor(delta);
    setSkillCurrent(name, nextValue);
  }

  function adjustTalentCurrent(name: string, delta: number): void {
    const existing = talents.value[name];
    if (!existing) return;
    const nextValue = existing.current + Math.floor(delta);
    setTalentCurrent(name, nextValue);
  }

  function adjustCharacteristicCurrent(name: string, delta: number): void {
    const existing = characteristics.value[name];
    if (!existing) return;
    const nextValue = existing.current + Math.floor(delta);
    setCharacteristicCurrent(name, nextValue);
  }

  /**
   * Persists the current settings to Foundry world storage.
   *
   * Delegates to the settings service — this store does not write to
   * game.settings directly.
   */
  async function saveToStorage(): Promise<void> {
    await saveNPCBuilderSettings(settings.value);
  }

  /** Sets the base actor dropdown selection and clears any active override. */
  function setBaseActor(id: string): void {
    baseActorId.value = id;
  }

  /** Sets or clears the drag-drop base actor override. */
  function setBaseActorOverride(override: BaseActorOverride | null): void {
    baseActorOverride.value = override;
  }

  /** Appends a career entry to the build queue. */
  function addCareer(entry: CareerEntry): void {
    careers.value.push(entry);
  }

  /** Removes the career at the given queue index. */
  function removeCareer(index: number): void {
    careers.value.splice(index, 1);
  }

  /**
   * Swaps the career at `index` with its neighbour in `direction`.
   * No-ops if the move would go out of bounds.
   */
  function moveCareer(index: number, direction: -1 | 1): void {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= careers.value.length) return;

    const sourceCareer = careers.value[index];
    const targetCareer = careers.value[targetIndex];
    if (sourceCareer && targetCareer) {
      [careers.value[index], careers.value[targetIndex]] = [targetCareer, sourceCareer];
    }
  }

  /**
   * Clears the override, career queue, and resets the override drop zone
   * after a successful build. Settings are intentionally preserved.
   */
  function resetWorkingNpc(): void {
    baseActorOverride.value = null;
    careers.value = [];
    showBaseOverrideDropZone.value = true;
    skills.value = {};
    talents.value = {};
    characteristics.value = {};
  }

  return {
    // State
    baseActorId,
    baseActorOverride,
    careers,
    activeTab,
    showBaseOverrideDropZone,
    isBusy,
    busyMessage,
    settings,
    skills,
    talents,
    characteristics,
    skillsXp,
    talentsXp,
    characteristicsXp,
    totalXp,
    totalBaseXp,
    xpDelta,
    // Actions
    hydrateFromStorage,
    saveToStorage,
    setBaseActor,
    setBaseActorOverride,
    addCareer,
    removeCareer,
    moveCareer,
    resetWorkingNpc,
    hydrateAdvancements,
    setSkillCurrent,
    setTalentCurrent,
    setCharacteristicCurrent,
    adjustSkillCurrent,
    adjustTalentCurrent,
    adjustCharacteristicCurrent,
  };
});

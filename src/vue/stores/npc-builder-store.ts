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
import {
  allocateXp,
  type AllocatableEntry,
  type AllocationStrategyKey,
  MAX_CHARACTERISTIC_ADVANCES,
  MAX_SKILL_ADVANCES,
  MAX_TALENT_RANKS,
} from '../apps/npc-builder/xp-allocation';

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
  /** Starting value contributed by the selected base actor */
  baseActorValue: number;
  /** Base actor displayed total value used for preview totals in the UI */
  baseActorTotal: number;
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
  /** Career-only source breakdown for displaying which queued careers grant this entry. */
  careerSources: AdvancementSourceCount[];
}

export interface AdvancementSourceCount {
  label: string;
  count: number;
}

export interface NpcBuilderTrappingEntry {
  key: string;
  name: string;
  originalName: string;
  quantity: number;
  itemType: string;
  sourceKind: 'career' | 'base' | 'user';
  includedFromCareer: boolean;
  includedFromBase: boolean;
  includedFromUser: boolean;
  editable: boolean;
  ignoredFromCareer: boolean;
  ignored: boolean;
  sourceSummary: string;
  careerSources: AdvancementSourceCount[];
  documentUuid: string | null;
  sourceData: Record<string, unknown> | null;
  xp: number;
  /**
   * Whether this entry was resolved to a real compendium/world item.
   * null  = resolution not applicable (base/user entries)
   * true  = item found in compendium or world
   * false = item not found; build will create a blank item unless ignored
   */
  resolved: boolean | null;
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
  /** Career-derived skill source counts used for UI explanations. */
  skillSources: Record<string, AdvancementSourceCount[]>;
  /** Career-derived talent source counts used for UI explanations. */
  talentSources: Record<string, AdvancementSourceCount[]>;
  /** Career-derived characteristic source counts used for UI explanations. */
  characteristicSources: Record<string, AdvancementSourceCount[]>;
  /** Career-derived trappings by display name. */
  trappings: Record<string, number>;
  /** Career-derived trapping source counts used for UI explanations. */
  trappingSources: Record<string, AdvancementSourceCount[]>;
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
  /** Base actor skill totals: keyed by skill name */
  skillTotals: Record<string, number>;
  /** Base actor talent ranks: keyed by talent name */
  talents: Record<string, number>;
  /** Base actor characteristic advances: keyed by characteristic name */
  characteristics: Record<string, number>;
  /** Base actor characteristic totals: keyed by characteristic name */
  characteristicTotals: Record<string, number>;
}

export type AllocationTargetKind = 'total' | 'delta';

/**
 * NPC Builder Pinia store.
 *
 * Owns all in-memory working state for the NPC Builder application.
 * This is the single source of truth for the current build session.
 *
 * Persistence responsibilities (loading from / saving to Foundry world
 * settings) are delegated to the settings service in
 * src/module/services/settings/npcs.ts â€” this store does not call
 * game.settings directly.
 *
 * Lifecycle: hydrateFromStorage() is called by NPCBuilderApplication
 * before the Vue app mounts on each open, reloading persisted settings
 * and resetting transient working state to a clean slate.
 */
export const useNpcBuilderStore = defineStore('npc-builder', () => {
  // ---------------------------------------------------------------------------
  // Working state â€” resets each time the app opens via hydrateFromStorage()
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
  // Busy state â€” managed by the build orchestration logic in the component
  // ---------------------------------------------------------------------------

  /** True while a long-running async operation (e.g. NPC build) is in progress. */
  const isBusy = ref(false);

  /** Human-readable status message shown in the busy overlay. */
  const busyMessage = ref('');

  // ---------------------------------------------------------------------------
  // Persisted settings â€” loaded from world settings on each open
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

  /** Trappings gathered from careers, base actor inventory, and manual additions. */
  const trappings = ref<Record<string, NpcBuilderTrappingEntry>>({});

  // ---------------------------------------------------------------------------
  // Auto-allocation state
  // ---------------------------------------------------------------------------

  /** XP target value entered by the user for auto-allocation. */
  const targetXp = ref(0);

  /** Whether targetXp is interpreted as total final XP or XP delta budget. */
  const allocationTargetKind = ref<AllocationTargetKind>('total');

  /** Currently selected auto-allocation strategy. */
  const allocationStrategy = ref<AllocationStrategyKey>('evenly');

  /**
   * Snapshot of `current` values saved immediately before the last
   * auto-allocation was applied. Null when no allocation is active.
   * Restored by resetXpAllocation().
   */
  const preAllocationSnapshot = ref<{
    skills: Record<string, number>;
    talents: Record<string, number>;
    characteristics: Record<string, number>;
  } | null>(null);

  /** XP from the last allocation run that could not be spent due to caps. */
  const lastAllocationUnspent = ref(0);

  // ---------------------------------------------------------------------------
  // Derived XP computeds
  // ---------------------------------------------------------------------------

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
    baseActorId.value = '';
    baseActorOverride.value = null;
    careers.value = [];
    activeTab.value = 'main';
    showBaseOverrideDropZone.value = true;
    skills.value = {};
    talents.value = {};
    characteristics.value = {};
    trappings.value = {};
    targetXp.value = 0;
    allocationTargetKind.value = 'total';
    allocationStrategy.value = 'evenly';
    preAllocationSnapshot.value = null;
    lastAllocationUnspent.value = 0;
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
   * - +5 advances to each characteristic it grants (system.characteristics[key] === true)
   */
  async function buildCareerAdvancements(): Promise<CareerAdvancementBaseline> {
    const baseline: CareerAdvancementBaseline = {
      skills: {},
      talents: {},
      characteristics: {},
      skillSources: {},
      talentSources: {},
      characteristicSources: {},
      trappings: {},
      trappingSources: {},
    };

    for (const careerEntry of careers.value) {
      const careerItem = await fromUuid(careerEntry.uuid);
      if (!careerItem || typeof careerItem !== 'object') continue;

      const careerItemAny = careerItem as any;
      const quantity = Math.max(1, Math.floor(Number(careerEntry.quantity) || 1));

      const careerSkills = careerItemAny?.system?.skills;
      if (Array.isArray(careerSkills)) {
        for (const skillName of careerSkills) {
          const trimmedName = String(skillName ?? '').trim();
          if (trimmedName) {
            baseline.skills[trimmedName] = (baseline.skills[trimmedName] ?? 0) + 5 * quantity;

            const existingSources = baseline.skillSources[trimmedName] ?? [];
            const existingCareerSource = existingSources.find(
              (source) => source.label === careerEntry.name,
            );
            if (existingCareerSource) {
              existingCareerSource.count += quantity;
            } else {
              existingSources.push({ label: careerEntry.name, count: quantity });
            }
            baseline.skillSources[trimmedName] = existingSources;
          }
        }
      }

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
              existingSources.push({ label: careerEntry.name, count: quantity });
            }
            baseline.talentSources[trimmedName] = existingSources;
          }
        }
      }

      const careerCharacteristics = careerItemAny?.system?.characteristics;
      if (careerCharacteristics && typeof careerCharacteristics === 'object') {
        for (const [key, value] of Object.entries(careerCharacteristics as Record<string, any>)) {
          if (value === true) {
            const normalizedKey = String(key).toUpperCase().trim();
            if (normalizedKey) {
              baseline.characteristics[normalizedKey] =
                (baseline.characteristics[normalizedKey] ?? 0) + 5 * quantity;

              const existingSources = baseline.characteristicSources[normalizedKey] ?? [];
              const existingCareerSource = existingSources.find(
                (source) => source.label === careerEntry.name,
              );
              if (existingCareerSource) {
                existingCareerSource.count += quantity;
              } else {
                existingSources.push({ label: careerEntry.name, count: quantity });
              }
              baseline.characteristicSources[normalizedKey] = existingSources;
            }
          }
        }
      }

      const careerTrappings = careerItemAny?.system?.trappings;
      if (Array.isArray(careerTrappings)) {
        for (const trappingName of careerTrappings) {
          const trimmedName = String(trappingName ?? '').trim();
          if (!trimmedName) continue;

          baseline.trappings[trimmedName] = (baseline.trappings[trimmedName] ?? 0) + quantity;

          const existingSources = baseline.trappingSources[trimmedName] ?? [];
          const existingCareerSource = existingSources.find(
            (source) => source.label === careerEntry.name,
          );
          if (existingCareerSource) {
            existingCareerSource.count += quantity;
          } else {
            existingSources.push({ label: careerEntry.name, count: quantity });
          }
          baseline.trappingSources[trimmedName] = existingSources;
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
      skillTotals: {},
      talents: {},
      characteristics: {},
      characteristicTotals: {},
    };

    if (!baseActor || typeof baseActor !== 'object') return snapshot;

    const baseActorAny = baseActor as any;

    const actorCharacteristics = baseActorAny?.system?.characteristics;
    if (actorCharacteristics && typeof actorCharacteristics === 'object') {
      for (const [key, value] of Object.entries(actorCharacteristics as Record<string, any>)) {
        const normalizedKey = String(key).toUpperCase().trim();
        if (!normalizedKey) continue;
        const advances = readNumberFromPaths(value, [
          'advances.value',
          'advances',
          'advance.value',
          'advance',
        ]);
        const total = readNumberFromPaths(value, ['value', 'total.value', 'total']);
        snapshot.characteristics[normalizedKey] = toSafeNonNegativeInteger(advances ?? 0);
        snapshot.characteristicTotals[normalizedKey] = toSafeNonNegativeInteger(total ?? 0);
      }
    }

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
          const total = readNumberFromPaths(item?.system, ['total.value', 'total', 'value']);
          snapshot.skills[itemName] = toSafeNonNegativeInteger(advances ?? 0);
          snapshot.skillTotals[itemName] = toSafeNonNegativeInteger(total ?? 0);
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
        if (Number.isFinite(numeric)) return numeric;
      }
    }
    return null;
  }

  function getTrappingItemTypes(): string[] {
    const configured = (game as any)?.wfrp4e?.config?.trappingItems;
    if (Array.isArray(configured) && configured.length) {
      return configured.map((value) => String(value));
    }
    return ['trapping', 'armour', 'weapon', 'container', 'ammunition', 'money'];
  }

  function readBaseActorTrappings(baseActor: any | null): Record<string, NpcBuilderTrappingEntry> {
    const result: Record<string, NpcBuilderTrappingEntry> = {};
    if (!baseActor || typeof baseActor !== 'object') return result;

    const allowedTypes = new Set(getTrappingItemTypes());
    for (const item of baseActor?.items?.contents ?? []) {
      const itemType = String(item?.type ?? '').toLowerCase();
      if (!allowedTypes.has(itemType)) continue;

      const itemName = String(item?.name ?? '').trim();
      if (!itemName) continue;

      const quantity = Math.max(
        1,
        toSafeNonNegativeInteger(
          readNumberFromPaths(item?.system, ['quantity.value', 'quantity']) ?? 1,
        ),
      );
      const key = `base:${itemType}:${itemName.toLowerCase()}`;

      result[key] = {
        key,
        name: itemName,
        originalName: itemName,
        quantity,
        itemType,
        sourceKind: 'base',
        includedFromCareer: false,
        includedFromBase: true,
        includedFromUser: false,
        editable: settings.value.allowUpgradeBaseTrappings,
        ignoredFromCareer: false,
        ignored: false,
        sourceSummary: baseActor.name ? `Base: ${baseActor.name}` : 'Base actor',
        careerSources: [],
        documentUuid: String(item?.uuid ?? '').trim() || null,
        sourceData: (item?.toObject?.() as Record<string, unknown> | undefined) ?? null,
        xp: 0,
        resolved: null,
      };
    }

    return result;
  }

  async function resolveTrappingItemByName(name: string): Promise<any | null> {
    const normalizedName = String(name ?? '').trim();
    if (!normalizedName) return null;

    const utility = (game as any)?.wfrp4e?.utility;
    if (typeof utility?.findItem === 'function') {
      try {
        return (await utility.findItem(normalizedName, getTrappingItemTypes())) ?? null;
      } catch {
        return null;
      }
    }

    if (typeof utility?.find === 'function') {
      try {
        return (await utility.find(normalizedName, getTrappingItemTypes())) ?? null;
      } catch {
        return null;
      }
    }

    return (
      game.items?.contents.find((item: any) => {
        return (
          getTrappingItemTypes().includes(String(item?.type ?? '').toLowerCase()) &&
          String(item?.name ?? '')
            .trim()
            .toLowerCase() === normalizedName.toLowerCase()
        );
      }) ?? null
    );
  }

  async function buildCareerTrappings(): Promise<Record<string, NpcBuilderTrappingEntry>> {
    const baseline = await buildCareerAdvancements();
    const result: Record<string, NpcBuilderTrappingEntry> = {};

    for (const [name, quantity] of Object.entries(baseline.trappings)) {
      const resolvedItem = await resolveTrappingItemByName(name);
      const itemType = String((resolvedItem as any)?.type ?? 'trapping').toLowerCase();
      const key = `career:${itemType}:${name.toLowerCase()}`;
      result[key] = {
        key,
        name,
        originalName: name,
        quantity: Math.max(1, toSafeNonNegativeInteger(quantity)),
        itemType,
        sourceKind: 'career',
        includedFromCareer: true,
        includedFromBase: false,
        includedFromUser: false,
        editable: false,
        ignoredFromCareer: false,
        ignored: false,
        sourceSummary: 'Career-derived',
        careerSources: (baseline.trappingSources[name] ?? []).map((source) => ({ ...source })),
        documentUuid: String((resolvedItem as any)?.uuid ?? '').trim() || null,
        sourceData:
          ((resolvedItem as any)?.toObject?.() as Record<string, unknown> | undefined) ?? null,
        xp: 0,
        resolved: resolvedItem !== null,
      };
    }

    return result;
  }

  async function hydrateTrappings(baseActor: any | null): Promise<void> {
    const existing = trappings.value;
    const next: Record<string, NpcBuilderTrappingEntry> = {};

    const careerTrappings = await buildCareerTrappings();
    for (const [key, entry] of Object.entries(careerTrappings)) {
      const existingEntry = existing[key];
      next[key] = {
        ...entry,
        ignoredFromCareer: existingEntry?.ignoredFromCareer ?? false,
      };
    }

    const baseTrappings = readBaseActorTrappings(baseActor);
    if (settings.value.allowUpgradeBaseTrappings) {
      for (const [key, entry] of Object.entries(baseTrappings)) {
        const existingEntry = existing[key];
        next[key] = existingEntry
          ? {
              ...entry,
              name: existingEntry.name,
              quantity: existingEntry.quantity,
              ignored: existingEntry.ignored,
            }
          : entry;
      }
    }

    for (const [key, entry] of Object.entries(existing)) {
      if (entry.sourceKind === 'user') {
        next[key] = { ...entry };
      }
    }

    trappings.value = next;
  }

  /**
   * Merges career-derived baselines with optional base actor advancement values.
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
        sourceCounts.push({ label: baseLabel, count: baseCount });
      }
      for (const source of careerBaseline.talentSources[talentName] ?? []) {
        sourceCounts.push({ label: source.label, count: source.count });
      }
      return sourceCounts;
    }

    function getCareerSourceCounts(
      sourceMap: Record<string, AdvancementSourceCount[]>,
      key: string,
    ): AdvancementSourceCount[] {
      return (sourceMap[key] ?? []).map((source) => ({
        label: source.label,
        count: source.count,
      }));
    }

    // Skills
    const allSkillKeys = new Set([
      ...Object.keys(careerBaseline.skills),
      ...Object.keys(baseActorValues.skills),
    ]);
    for (const skillName of allSkillKeys) {
      const fromCareer = careerBaseline.skills[skillName] ?? 0;
      const fromBase = baseActorValues.skills[skillName] ?? 0;
      const fromBaseTotal = baseActorValues.skillTotals[skillName] ?? 0;
      const fromBaseExists = fromBase > 0;
      const shouldShow =
        fromCareer > 0 || (fromBaseExists && settings.value.allowUpgradeBaseSkills);
      if (!shouldShow) continue;

      result.skills[skillName] = {
        baseline: fromCareer,
        baseActorValue: fromBaseExists ? fromBase : 0,
        baseActorTotal: fromBaseTotal,
        current: fromCareer,
        includedFromCareer: fromCareer > 0,
        includedFromBase: fromBaseExists,
        effectiveRankForCost: 0,
        editable: true,
        sources: [],
        careerSources: getCareerSourceCounts(careerBaseline.skillSources, skillName),
      };
    }

    // Talents
    const allTalentKeys = new Set([
      ...Object.keys(careerBaseline.talents),
      ...Object.keys(baseActorValues.talents),
    ]);
    for (const talentName of allTalentKeys) {
      const fromCareer = careerBaseline.talents[talentName] ?? 0;
      const fromBase = baseActorValues.talents[talentName] ?? 0;
      const fromBaseExists = fromBase > 0;
      const editable = fromCareer > 0 || (fromBaseExists && settings.value.allowUpgradeBaseTalents);
      if (!editable) continue;

      const effectiveRankForCost = fromCareer + (fromBaseExists ? fromBase : 0);

      result.talents[talentName] = {
        baseline: fromCareer,
        baseActorValue: fromBaseExists ? fromBase : 0,
        baseActorTotal: fromBaseExists ? fromBase : 0,
        current: effectiveRankForCost,
        includedFromCareer: fromCareer > 0,
        includedFromBase: fromBaseExists,
        effectiveRankForCost,
        editable,
        sources: getTalentSourceCounts(talentName),
        careerSources: getCareerSourceCounts(careerBaseline.talentSources, talentName),
      };
    }

    // Characteristics
    const allCharKeys = new Set([
      ...Object.keys(careerBaseline.characteristics),
      ...Object.keys(baseActorValues.characteristics),
    ]);
    for (const charName of allCharKeys) {
      const fromCareer = careerBaseline.characteristics[charName] ?? 0;
      const fromBase = baseActorValues.characteristics[charName] ?? 0;
      const fromBaseTotal = baseActorValues.characteristicTotals[charName] ?? 0;
      const fromCareerExists = fromCareer > 0;
      const fromBaseExists = fromBase > 0;
      const shouldShow =
        fromCareerExists || (fromBaseExists && settings.value.allowUpgradeBaseCharacteristics);
      if (!shouldShow) continue;

      result.characteristics[charName] = {
        baseline: fromCareer,
        baseActorValue: fromBaseExists ? fromBase : 0,
        baseActorTotal: fromBaseTotal,
        current: fromCareer,
        includedFromCareer: fromCareerExists,
        includedFromBase: fromBaseExists,
        effectiveRankForCost: 0,
        editable: true,
        sources: [],
        careerSources: getCareerSourceCounts(careerBaseline.characteristicSources, charName),
      };
    }

    return result;
  }

  /**
   * Hydrates all advancement categories based on queued careers and optional base actor.
   * Preserves user-edited current values where possible.
   */
  async function hydrateAdvancements(baseActor: any | null, preserveCurrent = true): Promise<void> {
    const careerBaseline = await buildCareerAdvancements();
    const baseActorValues = readBaseActorAdvancements(baseActor);
    const merged = mergeAdvancementsWithSettings(careerBaseline, baseActorValues);

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

  function createUserTrappingKey(): string {
    return `user:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  }

  function addUserTrapping(
    partial?: Partial<
      Pick<
        NpcBuilderTrappingEntry,
        'name' | 'quantity' | 'itemType' | 'documentUuid' | 'sourceData'
      >
    >,
  ): string {
    const key = createUserTrappingKey();
    const name = String(partial?.name ?? '').trim() || 'New Trapping';
    const quantity = Math.max(1, toSafeNonNegativeInteger(Number(partial?.quantity ?? 1)));
    trappings.value[key] = {
      key,
      name,
      originalName: name,
      quantity,
      itemType: String(partial?.itemType ?? 'trapping').toLowerCase(),
      sourceKind: 'user',
      includedFromCareer: false,
      includedFromBase: false,
      includedFromUser: true,
      editable: true,
      ignoredFromCareer: false,
      ignored: false,
      sourceSummary: 'User-added',
      careerSources: [],
      documentUuid: partial?.documentUuid ?? null,
      sourceData: partial?.sourceData ?? null,
      xp: 0,
      resolved: null,
    };
    return key;
  }

  function updateTrappingName(key: string, name: string): void {
    const existing = trappings.value[key];
    if (!existing || !existing.editable) return;
    trappings.value[key] = {
      ...existing,
      name: String(name ?? '').trim() || existing.name,
    };
  }

  function updateTrappingQuantity(key: string, quantity: number): void {
    const existing = trappings.value[key];
    if (!existing || !existing.editable) return;
    trappings.value[key] = {
      ...existing,
      quantity: Math.max(1, toSafeNonNegativeInteger(quantity)),
    };
  }

  function removeTrapping(key: string): void {
    const existing = trappings.value[key];
    if (!existing) return;

    if (existing.sourceKind === 'career') {
      trappings.value[key] = {
        ...existing,
        ignoredFromCareer: true,
      };
      return;
    }

    if (existing.sourceKind === 'base') {
      trappings.value[key] = {
        ...existing,
        ignored: true,
      };
      return;
    }

    delete trappings.value[key];
  }

  /**
   * Marks all career-derived trappings that were not resolved to a real item
   * as ignored so they will not be created on the built actor.
   */
  function ignoreUnresolvedCareerTrappings(): void {
    for (const [key, entry] of Object.entries(trappings.value)) {
      if (entry.sourceKind === 'career' && entry.resolved === false && !entry.ignoredFromCareer) {
        trappings.value[key] = { ...entry, ignoredFromCareer: true };
      }
    }
  }

  function setSkillCurrent(name: string, current: number): void {
    const existing = skills.value[name];
    if (!existing) return;
    skills.value[name] = { ...existing, current: toSafeNonNegativeInteger(current) };
  }

  function setTalentCurrent(name: string, current: number): void {
    const existing = talents.value[name];
    if (!existing) return;
    talents.value[name] = { ...existing, current: toSafeNonNegativeInteger(current) };
  }

  function setCharacteristicCurrent(name: string, current: number): void {
    const existing = characteristics.value[name];
    if (!existing) return;
    characteristics.value[name] = { ...existing, current: toSafeNonNegativeInteger(current) };
  }

  function adjustSkillCurrent(name: string, delta: number): void {
    const existing = skills.value[name];
    if (!existing) return;
    setSkillCurrent(name, existing.current + Math.floor(delta));
  }

  function adjustTalentCurrent(name: string, delta: number): void {
    const existing = talents.value[name];
    if (!existing) return;
    setTalentCurrent(name, existing.current + Math.floor(delta));
  }

  function adjustCharacteristicCurrent(name: string, delta: number): void {
    const existing = characteristics.value[name];
    if (!existing) return;
    setCharacteristicCurrent(name, existing.current + Math.floor(delta));
  }

  /**
   * Applies the current auto-allocation strategy to distribute `targetXp` XP
   * across all editable entries, starting from each entry's effective baseline.
   *
   * A snapshot of current `current` values is saved so resetXpAllocation() can
   * restore the manually edited state.
   */
  function applyXpAllocation(): void {
    preAllocationSnapshot.value = {
      skills: Object.fromEntries(Object.entries(skills.value).map(([k, v]) => [k, v.current])),
      talents: Object.fromEntries(Object.entries(talents.value).map(([k, v]) => [k, v.current])),
      characteristics: Object.fromEntries(
        Object.entries(characteristics.value).map(([k, v]) => [k, v.current]),
      ),
    };

    const entries: AllocatableEntry[] = [];

    for (const [name, entry] of Object.entries(skills.value)) {
      if (!entry.editable) continue;
      entries.push({
        key: `skill:${name}`,
        category: 'skill',
        start: entry.baseline,
        max: MAX_SKILL_ADVANCES,
        getCostUpTo: getSkillXpCost,
      });
    }

    for (const [name, entry] of Object.entries(talents.value)) {
      if (!entry.editable) continue;
      entries.push({
        key: `talent:${name}`,
        category: 'talent',
        start: entry.effectiveRankForCost,
        max: MAX_TALENT_RANKS,
        getCostUpTo: getTalentXpCost,
      });
    }

    for (const [name, entry] of Object.entries(characteristics.value)) {
      if (!entry.editable) continue;
      entries.push({
        key: `char:${name}`,
        category: 'characteristic',
        start: entry.baseline,
        max: MAX_CHARACTERISTIC_ADVANCES,
        getCostUpTo: getCharacteristicXpCost,
      });
    }

    const sanitizedTarget = toSafeNonNegativeInteger(targetXp.value);
    if (allocationTargetKind.value === 'total') {
      targetXp.value = Math.max(sanitizedTarget, totalBaseXp.value);
    } else {
      targetXp.value = sanitizedTarget;
    }

    const budget =
      allocationTargetKind.value === 'total'
        ? Math.max(0, targetXp.value - totalBaseXp.value)
        : targetXp.value;

    const result = allocateXp(entries, budget, allocationStrategy.value);
    lastAllocationUnspent.value = result.unspent;

    for (const entry of entries) {
      const finalValue = result.values[entry.key] ?? entry.start;
      if (entry.category === 'skill') {
        setSkillCurrent(entry.key.slice('skill:'.length), finalValue);
      } else if (entry.category === 'talent') {
        setTalentCurrent(entry.key.slice('talent:'.length), finalValue);
      } else {
        setCharacteristicCurrent(entry.key.slice('char:'.length), finalValue);
      }
    }
  }

  /**
   * Restores all `current` values to the snapshot saved before the last
   * auto-allocation was applied. No-ops if no allocation is active.
   */
  function resetXpAllocation(): void {
    const snapshot = preAllocationSnapshot.value;
    if (!snapshot) return;

    for (const [name, current] of Object.entries(snapshot.skills)) {
      setSkillCurrent(name, current);
    }
    for (const [name, current] of Object.entries(snapshot.talents)) {
      setTalentCurrent(name, current);
    }
    for (const [name, current] of Object.entries(snapshot.characteristics)) {
      setCharacteristicCurrent(name, current);
    }

    preAllocationSnapshot.value = null;
    lastAllocationUnspent.value = 0;
  }

  /**
   * Persists the current settings to Foundry world storage.
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

  /** Adds a career or increments quantity if the same UUID is already queued. */
  function addOrIncrementCareer(entry: CareerEntry, incrementBy = 1): number {
    const existingIndex = careers.value.findIndex((career) => career.uuid === entry.uuid);
    if (existingIndex >= 0) {
      const existing = careers.value[existingIndex];
      if (existing) {
        existing.quantity = Math.max(
          1,
          Math.floor(Number(existing.quantity) || 1) + Math.max(1, Math.floor(incrementBy || 1)),
        );
      }
      return existingIndex;
    }

    careers.value.push({
      ...entry,
      quantity: Math.max(1, Math.floor(Number(entry.quantity) || 1)),
    });
    return careers.value.length - 1;
  }

  /** Sets a queued career quantity at index, clamped to an integer >= 1. */
  function setCareerQuantity(index: number, quantity: number): void {
    const existing = careers.value[index];
    if (!existing) return;
    existing.quantity = Math.max(1, Math.floor(Number(quantity) || 1));
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
    trappings.value = {};
    preAllocationSnapshot.value = null;
    lastAllocationUnspent.value = 0;
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
    trappings,
    targetXp,
    allocationTargetKind,
    allocationStrategy,
    preAllocationSnapshot,
    lastAllocationUnspent,
    // Computed
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
    addOrIncrementCareer,
    setCareerQuantity,
    removeCareer,
    moveCareer,
    resetWorkingNpc,
    hydrateAdvancements,
    hydrateTrappings,
    setSkillCurrent,
    setTalentCurrent,
    setCharacteristicCurrent,
    adjustSkillCurrent,
    adjustTalentCurrent,
    adjustCharacteristicCurrent,
    addUserTrapping,
    updateTrappingName,
    updateTrappingQuantity,
    removeTrapping,
    ignoreUnresolvedCareerTrappings,
    applyXpAllocation,
    resetXpAllocation,
  };
});

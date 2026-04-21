import type { AdvancementSourceCount } from './AdvancementSourceCount';

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

import type { AdvancementSourceCount } from './AdvancementSourceCount';

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
  /** Career-derived traits by display name. */
  traits: Record<string, number>;
  /** Career-derived trait source counts used for UI explanations. */
  traitSources: Record<string, AdvancementSourceCount[]>;
}

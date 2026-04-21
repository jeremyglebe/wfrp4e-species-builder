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

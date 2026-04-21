import type { AdvancementSourceCount } from './AdvancementSourceCount';

export interface NpcBuilderTraitEntry {
  key: string;
  name: string;
  originalName: string;
  quantity: number;
  itemType: 'trait';
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
  /** Trait XP is currently optional and defaults to 0 for all entries. */
  xp: number;
}

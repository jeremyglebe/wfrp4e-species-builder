import type { AdvancementSourceCount } from './AdvancementSourceCount';

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

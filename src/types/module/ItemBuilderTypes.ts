/**
 * Aggregate Item Builder settings.
 */
export interface AggregateItemBuilderSettings {
  defaultFolderId: string;
  fallbackFolderName: string;
  rememberLastFolder: boolean;
  defaultPrefix: string;
  defaultSuffix: string;
  defaultItemType: string;
  effectMode: 'single' | 'perItem';
  defaultEffectName: string;
}

/**
 * Effect-to-Item Builder settings.
 */
export interface EffectToItemBuilderSettings {
  namePrefix: string;
  defaultItemType: string;
  defaultFolderId: string;
  fallbackFolderName: string;
  rememberLastFolder: boolean;
}

import type { AggregateItemBuilderSettings } from '../../../types/module';
import { MODULE_ID } from './species';

export const AGGREGATE_ITEM_BUILDER_SETTINGS_KEY = 'aggregateItemBuilderSettings';

export function getDefaultAggregateItemBuilderSettings(): AggregateItemBuilderSettings {
  return {
    defaultFolderId: '',
    fallbackFolderName: 'Effect Items',
    rememberLastFolder: true,
    defaultPrefix: 'Bundle:',
    defaultSuffix: '',
    defaultItemType: 'trait',
    effectMode: 'single',
    defaultEffectName: 'Grant Items',
  };
}

export function loadAggregateItemBuilderSettings(): AggregateItemBuilderSettings {
  const defaults = getDefaultAggregateItemBuilderSettings();
  const saved = game?.settings?.get(MODULE_ID, AGGREGATE_ITEM_BUILDER_SETTINGS_KEY) as
    | Partial<AggregateItemBuilderSettings>
    | undefined;

  if (!saved || typeof saved !== 'object') {
    return defaults;
  }

  return foundry.utils.mergeObject(defaults, saved) as AggregateItemBuilderSettings;
}

export async function saveAggregateItemBuilderSettings(
  settings: AggregateItemBuilderSettings,
): Promise<void> {
  await game?.settings?.set(MODULE_ID, AGGREGATE_ITEM_BUILDER_SETTINGS_KEY, settings);
}

export function getAllowedCarrierTypes(): string[] {
  return ['trait', 'talent', 'disease', 'mutation', 'psychology', 'critical', 'injury'];
}

export function getAvailableCarrierTypes(): string[] {
  const docTypes = game.system?.documentTypes?.Item ?? {};
  const systemTypes = Object.keys(docTypes);
  const available = getAllowedCarrierTypes().filter((typeName) => systemTypes.includes(typeName));
  return available.length ? available : ['trait'];
}

export function getAllItemFoldersSorted(): Folder[] {
  return (game.folders?.contents ?? [])
    .filter((folder) => folder.type === 'Item')
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name)) as Folder[];
}

export async function getOrCreateItemFolderByName(folderName: string): Promise<Folder> {
  const existingFolder = getAllItemFoldersSorted().find((folder) => folder.name === folderName);
  if (existingFolder) {
    return existingFolder;
  }

  return (await Folder.create({
    name: folderName,
    type: 'Item',
    sorting: 'a',
  })) as Folder;
}

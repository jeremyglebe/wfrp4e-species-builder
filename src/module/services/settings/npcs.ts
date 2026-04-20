import type { NPCBuilderSettings } from '../../../types/module';
import { MODULE_ID } from './species';

export const NPC_BUILDER_SETTINGS_KEY = 'npcBuilderSettings';

/**
 * Default NPC Builder settings.
 */
export function getDefaultNPCBuilderSettings(): NPCBuilderSettings {
  return {
    includeSpeciesInName: false,
    autoAddLowerCareers: false,
    enhanceImage: true,
    circularToken: true,
    baseFolderName: 'NPC Builder Bases',
    outputFolderName: 'NPC Builder Output',
    allowUpgradeBaseSkills: false,
    allowUpgradeBaseCharacteristics: false,
    allowUpgradeBaseTalents: true,
    allowUpgradeBaseTrappings: false,
  };
}

export function loadNPCBuilderSettings(): NPCBuilderSettings {
  const defaultSettings = getDefaultNPCBuilderSettings();
  const saved = game?.settings?.get(MODULE_ID, NPC_BUILDER_SETTINGS_KEY) as
    | Partial<NPCBuilderSettings>
    | undefined;

  if (!saved || typeof saved !== 'object') {
    return defaultSettings;
  }

  return foundry.utils.mergeObject(defaultSettings, saved) as NPCBuilderSettings;
}

export async function saveNPCBuilderSettings(settings: NPCBuilderSettings): Promise<void> {
  await game?.settings?.set(MODULE_ID, NPC_BUILDER_SETTINGS_KEY, settings);
}

export function normalizeFolderName(name: unknown): string {
  return String(name ?? '').trim();
}

export function getActorFolderByName(name: string): Folder | null {
  const normalizedName = normalizeFolderName(name);
  if (!normalizedName) {
    return null;
  }

  const foundFolder = game.folders?.contents.find(
    (folder) => folder.type === 'Actor' && folder.name === normalizedName,
  );

  return (foundFolder as Folder) ?? null;
}

export async function getOrCreateActorFolderByName(name: string): Promise<Folder | null> {
  const normalizedName = normalizeFolderName(name);
  if (!normalizedName) {
    return null;
  }

  const existingFolder = getActorFolderByName(normalizedName);
  if (existingFolder) {
    return existingFolder;
  }

  const newFolder = (await Folder.create({
    name: normalizedName,
    type: 'Actor',
    color: '#000000',
  })) as Folder | undefined;

  return newFolder ?? null;
}

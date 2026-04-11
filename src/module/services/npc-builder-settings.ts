import type { NPCBuilderSettings } from '../../types/module';

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
  };
}

/**
 * Loads NPC Builder settings from Foundry world settings.
 * Falls back to defaults if not found.
 *
 * @returns The loaded settings
 */
export function loadNPCBuilderSettings(): NPCBuilderSettings {
  const defaultSettings = getDefaultNPCBuilderSettings();
  const saved = game?.settings?.get('wfrp4e-species-builder', 'npcBuilderSettings') as
    | Partial<NPCBuilderSettings>
    | undefined;

  if (!saved || typeof saved !== 'object') {
    return defaultSettings;
  }

  return foundry.utils.mergeObject(defaultSettings, saved) as NPCBuilderSettings;
}

/**
 * Saves NPC Builder settings to Foundry world settings.
 *
 * @param settings - The settings to save
 */
export async function saveNPCBuilderSettings(settings: NPCBuilderSettings): Promise<void> {
  await game?.settings?.set('wfrp4e-species-builder', 'npcBuilderSettings', settings);
}

/**
 * Normalizes a folder name by trimming whitespace and converting to string.
 * Returns an empty string for null/undefined inputs.
 *
 * @param name - The folder name to normalize
 * @returns The normalized folder name
 */
export function normalizeFolderName(name: unknown): string {
  return String(name ?? '').trim();
}

/**
 * Searches for an existing actor folder by name.
 * The search is case-sensitive and looks for exact name matches.
 *
 * @param name - The exact name of the folder to find
 * @returns The folder object if found, or null if not found or name is empty
 */
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

/**
 * Gets an existing actor folder by name, or creates it if it doesn't exist.
 * Created folders have black color (#000000) by default.
 *
 * @param name - The desired folder name
 * @returns The existing or newly created folder, or null if name is empty
 */
export async function getOrCreateActorFolderByName(name: string): Promise<Folder | null> {
  const normalizedName = normalizeFolderName(name);
  if (!normalizedName) {
    return null;
  }

  // Check if the folder already exists
  const existingFolder = getActorFolderByName(normalizedName);
  if (existingFolder) {
    return existingFolder;
  }

  // Folder doesn't exist, so create it
  const newFolder = (await Folder.create({
    name: normalizedName,
    type: 'Actor',
    color: '#000000',
  })) as Folder | undefined;

  return newFolder ?? null;
}

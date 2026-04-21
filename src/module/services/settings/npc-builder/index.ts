import type { NPCBuilderSettings } from '../../../../types/module';
import { MODULE_NAMESPACE } from '..';
import { FactoryService } from '../../factory';

export const SETTINGS_KEY = 'npcBuilderSettings';

export const COMMON_QUICK_TRAIT_NAMES = [
  'Armour',
  'Big',
  'Brute',
  'Champion',
  'Clever',
  'Easily Confused',
  'Elite',
  'Fast',
  'Grim',
  'Hardy',
  'Leader',
  'Magical',
  'Null',
  'Stealthy',
  'Stupid',
  'Tough',
  'Weapon',
] as const;

export function loadNPCBuilderSettings(): NPCBuilderSettings {
  const defaultSettings = FactoryService.Default.NPCBuilderSettings();
  const saved = game?.settings?.get(MODULE_NAMESPACE, SETTINGS_KEY) as
    | Partial<NPCBuilderSettings>
    | undefined;

  if (!saved || typeof saved !== 'object') {
    return defaultSettings;
  }

  return foundry.utils.mergeObject(defaultSettings, saved) as NPCBuilderSettings;
}

export async function saveNPCBuilderSettings(settings: NPCBuilderSettings): Promise<void> {
  await game?.settings?.set(MODULE_NAMESPACE, SETTINGS_KEY, settings);
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

export function getItemFolderByName(name: string): Folder | null {
  const normalizedName = normalizeFolderName(name);
  if (!normalizedName) {
    return null;
  }

  const foundFolder = game.folders?.contents.find(
    (folder) => folder.type === 'Item' && folder.name === normalizedName,
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

export async function getOrCreateItemFolderByName(name: string): Promise<Folder | null> {
  const normalizedName = normalizeFolderName(name);
  if (!normalizedName) {
    return null;
  }

  const existingFolder = getItemFolderByName(normalizedName);
  if (existingFolder) {
    return existingFolder;
  }

  const newFolder = (await Folder.create({
    name: normalizedName,
    type: 'Item',
    color: '#000000',
  })) as Folder | undefined;

  return newFolder ?? null;
}

async function findTraitItemByNameComprehensive(name: string): Promise<any | null> {
  const normalizedName = String(name ?? '')
    .trim()
    .toLowerCase();
  if (!normalizedName) return null;

  const worldMatch = game.items?.contents.find((item: any) => {
    return (
      String(item?.type ?? '').toLowerCase() === 'trait' &&
      String(item?.name ?? '')
        .trim()
        .toLowerCase() === normalizedName
    );
  });
  if (worldMatch) {
    return worldMatch;
  }

  for (const pack of game.packs?.contents ?? []) {
    if (String((pack as any)?.documentName ?? '') !== 'Item') continue;

    let index: any[] = [];
    try {
      index = ((await (pack as any).getIndex({ fields: ['name', 'type'] })) as any[]) ?? [];
    } catch {
      index = [];
    }

    const hit = index.find((entry: any) => {
      return (
        String(entry?.type ?? '').toLowerCase() === 'trait' &&
        String(entry?.name ?? '')
          .trim()
          .toLowerCase() === normalizedName
      );
    });
    if (!hit?._id) continue;

    try {
      const document = await (pack as any).getDocument(hit._id);
      if (document && String((document as any).type ?? '').toLowerCase() === 'trait') {
        return document;
      }
    } catch {
      // Ignore pack read failures and continue searching remaining packs.
    }
  }

  return null;
}

async function seedQuickTraitsFolderWithCommonTraits(folder: Folder): Promise<number> {
  const existingNames = new Set(
    (game.items?.contents ?? [])
      .filter((item: any) => {
        return (
          String(item?.folder?.id ?? '') === String(folder.id) &&
          String(item?.type ?? '').toLowerCase() === 'trait'
        );
      })
      .map((item: any) =>
        String(item?.name ?? '')
          .trim()
          .toLowerCase(),
      ),
  );

  let importedCount = 0;
  for (const traitName of COMMON_QUICK_TRAIT_NAMES) {
    const normalized = traitName.toLowerCase();
    if (existingNames.has(normalized)) continue;

    const found = await findTraitItemByNameComprehensive(traitName);
    if (!found) continue;

    const itemData = found.toObject();
    delete (itemData as any)._id;
    itemData.folder = folder.id;
    itemData.type = 'trait';

    const created = await Item.create(itemData);
    if (created) {
      importedCount += 1;
      existingNames.add(normalized);
    }
  }

  return importedCount;
}

export async function getOrCreateQuickTraitsFolderWithOptionalSeed(
  folderName: string,
): Promise<{ folder: Folder | null; created: boolean; importedCount: number }> {
  const normalizedName = normalizeFolderName(folderName);
  if (!normalizedName) {
    return { folder: null, created: false, importedCount: 0 };
  }

  const existing = getItemFolderByName(normalizedName);
  if (existing) {
    return { folder: existing, created: false, importedCount: 0 };
  }

  const created = await getOrCreateItemFolderByName(normalizedName);
  if (!created) {
    return { folder: null, created: false, importedCount: 0 };
  }

  const shouldSeed = await Dialog.confirm({
    title: 'Load Common Quick Traits?',
    content:
      '<p>Do you want to automatically look up and load common quick traits into the folder?</p>',
    yes: () => true,
    no: () => false,
    defaultYes: true,
  });

  if (!shouldSeed) {
    return { folder: created, created: true, importedCount: 0 };
  }

  const importedCount = await seedQuickTraitsFolderWithCommonTraits(created);
  return { folder: created, created: true, importedCount };
}

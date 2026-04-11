import type { CareerEntry, IndexedCareer } from '../../types/module';

/**
 * Provides methods to extract career metadata from item objects.
 * Different systems may store this data in different paths,
 * so this interface abstracts that knowledge.
 */
type CareerReader = {
  /** Extracts the career group/path from an item */
  getCareerGroup: (item: any) => string;
  /** Extracts the career advancement level from an item */
  getCareerLevel: (item: any) => number | null;
};

/**
 * Builds and caches a comprehensive index of all available careers in the world and compendiums.
 * Provides efficient lookups for finding careers by group and level.
 */
export class CareerIndexService {
  /** Cached index of all careers, or null if not yet built */
  private cache: IndexedCareer[] | null = null;
  /** Promise for an in-progress build, or null if not building */
  private pending: Promise<IndexedCareer[]> | null = null;
  /** The reader instance for extracting career metadata */
  private readonly reader: CareerReader;

  /**
   * Creates a new CareerIndexService.
   *
   * @param reader - Career metadata extraction strategy
   */
  constructor(reader: CareerReader) {
    this.reader = reader;
  }

  /**
   * Builds the career index from world items and all available compendiums.
   * Results are cached, so subsequent calls return the cached index.
   * If a build is already in progress, returns that promise instead of starting a new one.
   *
   * @returns Promise resolving to the complete career index
   */
  async buildIndex(): Promise<IndexedCareer[]> {
    // Return cached index if already built
    if (this.cache) {
      return this.cache;
    }

    // Return existing build promise if one is in progress
    if (this.pending) {
      return this.pending;
    }

    // Start a new build
    this.pending = (async () => {
      const indexEntries: IndexedCareer[] = [];

      // Index careers from the world items
      for (const item of game.items?.contents ?? []) {
        if ((item as any).type !== 'career') continue;

        const careerItem = item as any;
        indexEntries.push({
          uuid: careerItem.uuid,
          name: careerItem.name,
          img: careerItem.img || '',
          careergroup: this.reader.getCareerGroup(careerItem),
          level: this.reader.getCareerLevel(careerItem),
          source: 'world',
        });
      }

      // Index careers from all compendiums
      for (const compendiumPack of game.packs?.contents ?? []) {
        // Only process item compendiums
        if (compendiumPack.documentName !== 'Item') continue;

        let careerItems: any[] = [];
        try {
          careerItems = await compendiumPack.getDocuments();
        } catch (error) {
          console.warn(
            `NPC Builder | Failed reading compendium ${compendiumPack.collection}`,
            error,
          );
          continue;
        }

        // Extract career items from the pack
        for (const careerItem of careerItems) {
          if (careerItem.type !== 'career') continue;

          indexEntries.push({
            uuid: careerItem.uuid,
            name: careerItem.name,
            img: careerItem.img || '',
            careergroup: this.reader.getCareerGroup(careerItem),
            level: this.reader.getCareerLevel(careerItem),
            source: compendiumPack.collection,
          });
        }
      }

      // Cache the built index
      this.cache = indexEntries;
      return indexEntries;
    })();

    return this.pending;
  }

  /**
   * Finds all lower-level careers in the same career group as the given item.
   * Excludes careers that are already queued and the item itself.
   * Results are sorted first by level (ascending) then by name (alphabetical).
   *
   * @param career - The career item to find predecessors for
   * @param queuedCareers - Careers already in the build queue (to avoid duplicates)
   * @returns Promise resolving to sorted array of lower-level careers
   */
  async getLowerCareersFor(career: any, queuedCareers: CareerEntry[]): Promise<IndexedCareer[]> {
    const careerGroup = this.reader.getCareerGroup(career);
    const careerLevel = this.reader.getCareerLevel(career);

    // Cannot find lower careers if we can't determine the group or level
    if (!careerGroup || careerLevel == null) {
      return [];
    }

    // Get the complete index
    const allCareers = await this.buildIndex();

    // Build a set of career UUIDs already in the queue for fast lookup
    const queuedUuids = new Set(queuedCareers.map((queuedEntry) => queuedEntry.uuid));
    queuedUuids.add(career.uuid); // Also exclude the item itself

    // Filter and sort the results
    return allCareers
      .filter(
        (indexedCareer) =>
          // Must be in the same career group
          indexedCareer.careergroup === careerGroup &&
          // Must have a level (some careers might not)
          indexedCareer.level != null &&
          // Must be lower level than the given career
          indexedCareer.level < careerLevel &&
          // Must not already be queued
          !queuedUuids.has(indexedCareer.uuid),
      )
      .sort((careerA, careerB) => {
        // Sort by level first (ascending)
        if (careerA.level !== careerB.level) {
          return (careerA.level ?? 0) - (careerB.level ?? 0);
        }

        // Then by name (alphabetical)
        return careerA.name.localeCompare(careerB.name);
      });
  }
}

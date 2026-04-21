/**
 * Height formula structure used by WFRP species config.
 * Example: 5'2" + 1d10"
 */
export interface SpeciesHeight {
  die: string;
  feet: number;
  inches: number;
}

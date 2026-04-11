/**
 * Extracts the species/ancestry/race name from an actor object.
 * Tries multiple potential paths that might contain this information,
 * depending on the system data schema. Returns the first valid string found.
 *
 * @param actor - The actor object to extract the species from
 * @returns The species name, or empty string if not found
 */
export function getSpeciesName(actor: any): string {
  // Try multiple potential paths where species data might be stored
  const speciesCandidates = [
    actor?.Species?.name,
    actor?.Species,
    actor?.system?.details?.species?.value,
    actor?.system?.details?.species,
    actor?.system?.details?.race?.value,
    actor?.system?.details?.race,
    actor?.system?.details?.ancestry?.value,
    actor?.system?.details?.ancestry,
    actor?.details?.species?.value,
    actor?.details?.species,
  ];

  // Check each candidate in order
  for (const candidate of speciesCandidates) {
    // If it's a direct string and non-empty, use it
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }

    // If it's an object with a name property, try that
    if (candidate && typeof candidate.name === 'string' && candidate.name.trim()) {
      return candidate.name.trim();
    }

    // If it's an object with a value property, try that
    if (candidate && typeof candidate.value === 'string' && candidate.value.trim()) {
      return candidate.value.trim();
    }
  }

  // No species found in any expected location
  return '';
}

/**
 * Constructs the final name for a generated NPC.
 * Optionally prepends the actor's species name based on the setting.
 *
 * @param actor - The base actor to extract species from (if needed)
 * @param finalCareerName - The career name that forms the base of the final name
 * @param includeSpeciesInName - Whether to prepend the species name
 * @returns The final NPC name (career name alone, or species + career name)
 */
export function buildFinalName(
  actor: any,
  finalCareerName: string,
  includeSpeciesInName: boolean,
): string {
  // If the setting is disabled, just use the career name as-is
  if (!includeSpeciesInName) {
    return finalCareerName;
  }

  // Try to get the species name from the actor
  const speciesName = getSpeciesName(actor);

  // If we found a species, prepend it; otherwise just use the career name
  return speciesName ? `${speciesName} ${finalCareerName}` : finalCareerName;
}

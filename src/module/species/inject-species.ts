import type { WfrpSpeciesConfigFragment } from './types';
import mergeObject = foundry.utils.mergeObject;

/**
 * Merges the transformed config fragment into game.wfrp4e.config during init.
 */
export function injectCustomSpeciesIntoWfrpConfig(fragment: WfrpSpeciesConfigFragment): void {
  const wfrpConfig = game.wfrp4e.config;

  mergeObject(wfrpConfig.species, fragment.species);
  mergeObject(wfrpConfig.speciesCharacteristics, fragment.speciesCharacteristics);
  mergeObject(wfrpConfig.speciesSkills, fragment.speciesSkills);
  mergeObject(wfrpConfig.speciesTalents, fragment.speciesTalents);
  mergeObject(wfrpConfig.speciesRandomTalents, fragment.speciesRandomTalents);
  mergeObject(wfrpConfig.speciesTalentReplacement, fragment.speciesTalentReplacement);
  mergeObject(wfrpConfig.speciesTraits, fragment.speciesTraits);
  mergeObject(wfrpConfig.speciesMovement, fragment.speciesMovement);
  mergeObject(wfrpConfig.speciesFate, fragment.speciesFate);
  mergeObject(wfrpConfig.speciesRes, fragment.speciesRes);
  mergeObject(wfrpConfig.speciesExtra, fragment.speciesExtra);
  mergeObject(wfrpConfig.speciesAge, fragment.speciesAge);
  mergeObject(wfrpConfig.speciesHeight, fragment.speciesHeight);
  mergeObject(wfrpConfig.speciesCareerReplacements, fragment.speciesCareerReplacements);
  mergeObject(wfrpConfig.subspecies, fragment.subspecies);

  for (const speciesKey of fragment.extraSpecies) {
    if (!wfrpConfig.extraSpecies.includes(speciesKey)) {
      wfrpConfig.extraSpecies.push(speciesKey);
    }
  }
}

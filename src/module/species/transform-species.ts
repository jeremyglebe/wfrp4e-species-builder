import type {
  CustomSpeciesDefinition,
  CustomSubspeciesDefinition,
  WfrpSpeciesConfigFragment,
  WfrpSubspeciesConfig,
} from './types';

/**
 * Converts module-native species objects into the split config buckets
 * expected by WFRP4e chargen.
 */
export function transformSpeciesDefinitionsToWfrpConfig(
  speciesDefinitions: CustomSpeciesDefinition[],
): WfrpSpeciesConfigFragment {
  const fragment: WfrpSpeciesConfigFragment = {
    species: {},
    speciesCharacteristics: {},
    speciesSkills: {},
    speciesTalents: {},
    speciesRandomTalents: {},
    speciesTalentReplacement: {},
    speciesTraits: {},
    speciesMovement: {},
    speciesFate: {},
    speciesRes: {},
    speciesExtra: {},
    speciesAge: {},
    speciesHeight: {},
    speciesCareerReplacements: {},
    extraSpecies: [],
    subspecies: {},
  };

  for (const species of speciesDefinitions) {
    const speciesKey = species.id;

    fragment.species[speciesKey] = species.name;
    fragment.speciesCharacteristics[speciesKey] = species.characteristics;
    fragment.speciesSkills[speciesKey] = species.skills;
    fragment.speciesTalents[speciesKey] = species.talents;

    if (species.randomTalents && Object.keys(species.randomTalents).length > 0) {
      fragment.speciesRandomTalents[speciesKey] = species.randomTalents;
    }

    if (species.talentReplacement && Object.keys(species.talentReplacement).length > 0) {
      fragment.speciesTalentReplacement[speciesKey] = species.talentReplacement;
    }

    if (species.traits && species.traits.length > 0) {
      fragment.speciesTraits[speciesKey] = species.traits;
    }

    fragment.speciesMovement[speciesKey] = species.movement;
    fragment.speciesFate[speciesKey] = species.fate;
    fragment.speciesRes[speciesKey] = species.resilience;
    fragment.speciesExtra[speciesKey] = species.extra;

    if (species.age) {
      fragment.speciesAge[speciesKey] = species.age;
    }

    if (species.height) {
      fragment.speciesHeight[speciesKey] = species.height;
    }

    if (species.careerReplacements && Object.keys(species.careerReplacements).length > 0) {
      fragment.speciesCareerReplacements[speciesKey] = species.careerReplacements;
    }

    if (species.extraSpecies) {
      fragment.extraSpecies.push(speciesKey);
    }

    if (species.subspecies && Object.keys(species.subspecies).length > 0) {
      fragment.subspecies[speciesKey] = transformSubspecies(species.subspecies);
    }
  }

  return fragment;
}

function transformSubspecies(
  subspeciesDefinitions: Record<string, CustomSubspeciesDefinition>,
): Record<string, WfrpSubspeciesConfig> {
  const transformed: Record<string, WfrpSubspeciesConfig> = {};

  for (const [subspeciesKey, subspecies] of Object.entries(subspeciesDefinitions)) {
    transformed[subspeciesKey] = {
      name: subspecies.name,
      characteristics: subspecies.characteristics,
      skills: subspecies.skills,
      talents: subspecies.talents,
      randomTalents: subspecies.randomTalents,
      talentReplacement: subspecies.talentReplacement,
      traits: subspecies.traits,
      movement: subspecies.movement,
      fate: subspecies.fate,
      resilience: subspecies.resilience,
      extra: subspecies.extra,
    };
  }

  return transformed;
}

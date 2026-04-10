import type {
  CustomSpeciesDefinition,
  CustomSubspeciesDefinition,
  WfrpSpeciesConfigFragment,
  WfrpSubspeciesConfig,
} from '../types';
import mergeObject = foundry.utils.mergeObject;

/**
 * Runtime injection boundary between module-native species data and WFRP config.
 *
 * Transform and inject live together here because they represent one runtime
 * pipeline: module storage model -> WFRP split config model -> config merge.
 */
export const Injection = {
  applySpeciesDefinitions,
  transformSpeciesDefinitionsToWfrpConfig,
  injectCustomSpeciesIntoWfrpConfig,
} as const;

function applySpeciesDefinitions(speciesDefinitions: CustomSpeciesDefinition[]): void {
  const configFragment = transformSpeciesDefinitionsToWfrpConfig(speciesDefinitions);
  injectCustomSpeciesIntoWfrpConfig(configFragment);
}

function transformSpeciesDefinitionsToWfrpConfig(
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

    if (hasKeys(species.randomTalents)) {
      fragment.speciesRandomTalents[speciesKey] = species.randomTalents;
    }

    if (hasKeys(species.talentReplacement)) {
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

    if (hasKeys(species.careerReplacements)) {
      fragment.speciesCareerReplacements[speciesKey] = species.careerReplacements;
    }

    if (species.extraSpecies) {
      fragment.extraSpecies.push(speciesKey);
    }

    if (hasKeys(species.subspecies)) {
      fragment.subspecies[speciesKey] = transformSubspecies(species.subspecies);
    }
  }

  return fragment;
}

function injectCustomSpeciesIntoWfrpConfig(fragment: WfrpSpeciesConfigFragment): void {
  const wfrpGame = game as Game & {
    wfrp4e?: {
      config?: Record<string, unknown>;
    };
  };

  const wfrpConfig = wfrpGame.wfrp4e?.config as any;
  if (!wfrpConfig) return;

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

function hasKeys(value: object | undefined): value is Record<string, unknown> {
  return Boolean(value && Object.keys(value).length > 0);
}

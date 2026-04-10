import type {
  CustomSpeciesDefinition,
  CustomSpeciesSettingsData,
  CustomSubspeciesDefinition,
  SpeciesCharacteristics,
} from '../types';

/**
 * Data factory boundary for module-native species editing models.
 *
 * Use factory functions instead of shared mutable literals so generated
 * identities remain unique and safe to edit.
 */
export const Data = {
  Empty: {
    SpeciesCharacteristics: createDefaultSpeciesCharacteristics,
    CustomSubspeciesDefinition: createEmptySubspeciesDefinition,
    CustomSpeciesDefinition: createEmptySpeciesDefinition,
    CustomSpeciesSettingsData: createEmptySpeciesSettingsData,
  },
  Default: {
    SpeciesCharacteristics: createDefaultSpeciesCharacteristics,
    CustomSubspeciesDefinition: createEmptySubspeciesDefinition,
    CustomSpeciesDefinition: createEmptySpeciesDefinition,
    CustomSpeciesSettingsData: createEmptySpeciesSettingsData,
  },
  Sample: {
    CustomSpeciesDefinition: createSampleWolfkinSpeciesDefinition,
  },
} as const;

function createDefaultSpeciesCharacteristics(): SpeciesCharacteristics {
  return {
    ws: '2d10+20',
    bs: '2d10+20',
    s: '2d10+20',
    t: '2d10+20',
    i: '2d10+20',
    ag: '2d10+20',
    dex: '2d10+20',
    int: '2d10+20',
    wp: '2d10+20',
    fel: '2d10+20',
  };
}

function createEmptySubspeciesDefinition(): CustomSubspeciesDefinition {
  return {
    id: foundry.utils.randomID(),
    name: 'New Subspecies',
  };
}

function createEmptySpeciesDefinition(): CustomSpeciesDefinition {
  return {
    id: foundry.utils.randomID(),
    name: 'New Species',
    characteristics: createDefaultSpeciesCharacteristics(),
    skills: [],
    talents: [],
    traits: [],
    movement: 4,
    fate: 0,
    resilience: 0,
    extra: 0,
    extraSpecies: true,
    subspecies: {},
  };
}

function createEmptySpeciesSettingsData(): CustomSpeciesSettingsData {
  return {
    version: 1,
    species: [],
  };
}

function createSampleWolfkinSpeciesDefinition(): CustomSpeciesDefinition {
  return {
    id: 'wolfkin',
    name: 'Wolfkin',
    characteristics: createDefaultSpeciesCharacteristics(),
    skills: ['Animal Care', 'Charm'],
    talents: ['Argumentative', 'Lightning Reflexes, Warrior Born'],
    movement: 4,
    fate: 1,
    resilience: 2,
    extra: 2,
    extraSpecies: true,
  };
}

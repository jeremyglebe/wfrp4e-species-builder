import type {
  CustomSpeciesDefinition,
  CustomSubspeciesDefinition,
  SpeciesCharacteristics,
} from './types';

export function createDefaultSpeciesCharacteristics(): SpeciesCharacteristics {
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

export function createEmptySubspeciesDefinition(): CustomSubspeciesDefinition {
  return {
    id: foundry.utils.randomID(),
    name: 'New Subspecies',
  };
}

export function createEmptySpeciesDefinition(): CustomSpeciesDefinition {
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

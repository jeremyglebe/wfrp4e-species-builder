import type { CustomSpeciesDefinition } from '@/shared/types/module';

import SpeciesCharacteristics from './SpeciesCharacteristics';

export default function (): CustomSpeciesDefinition {
  return {
    id: foundry.utils.randomID(),
    name: 'New Species',
    characteristics: SpeciesCharacteristics(),
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

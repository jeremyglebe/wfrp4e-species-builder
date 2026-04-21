import type { CustomSpeciesDefinition } from '@/shared/types/module';

import SpeciesCharacteristics from '../default/SpeciesCharacteristics';

export default function (): CustomSpeciesDefinition {
  return {
    id: 'wolfkin',
    name: 'Wolfkin',
    characteristics: SpeciesCharacteristics(),
    skills: ['Animal Care', 'Charm'],
    talents: ['Argumentative', 'Lightning Reflexes, Warrior Born'],
    movement: 4,
    fate: 1,
    resilience: 2,
    extra: 2,
    extraSpecies: true,
  };
}

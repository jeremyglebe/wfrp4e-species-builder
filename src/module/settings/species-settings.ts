import type { CustomSpeciesSettingsData } from '../species/types';

/**
 * Initial empty settings payload.
 */
export function getDefaultCustomSpeciesSettingsData(): CustomSpeciesSettingsData {
  return {
    version: 1,
    species: [
      // uncomment to have a sample species available on first load
      // wolfkin,
    ],
  };
}

// sample species for hard coded testing
const wolfkin = Object.freeze({
  id: 'wolfkin',
  name: 'Wolfkin',
  characteristics: {
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
  },
  skills: ['Animal Care', 'Charm'],
  talents: ['Argumentative', 'Lightning Reflexes, Warrior Born'],
  movement: 4,
  fate: 1,
  resilience: 2,
  extra: 2,
  extraSpecies: true,
});

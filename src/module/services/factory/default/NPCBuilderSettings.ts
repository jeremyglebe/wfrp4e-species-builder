import type { NPCBuilderSettings } from '@/shared/types/module';

export default function (): NPCBuilderSettings {
  return {
    includeSpeciesInName: false,
    autoAddLowerCareers: false,
    enhanceImage: true,
    circularToken: true,
    baseFolderName: 'NPC Builder Bases',
    outputFolderName: 'NPC Builder Output',
    quickTraitsFolderName: 'NPC Builder Quick Traits',
    allowDuplicateTraits: false,
    allowUpgradeBaseSkills: false,
    allowUpgradeBaseCharacteristics: false,
    allowUpgradeBaseTalents: true,
    allowUpgradeBaseTrappings: false,
  };
}

export {};

declare global {
  interface Wfrp4eConfig {
    creditOptions: WfrpStringMap;
    toTranslate: string[];
    trappingItems: string[];

    characteristics: Record<WfrpCharacteristicKey, string>;
    characteristicsAbbrev: Record<WfrpCharacteristicKey, string>;
    characteristicsBonus: Record<WfrpCharacteristicKey, string>;

    skillTypes: WfrpStringMap;
    skillGroup: WfrpStringMap;
    talentMax: WfrpStringMap;
    xpCost: {
      characteristic: number[];
      skill: number[];
      [key: string]: number[];
    };

    weaponGroups: WfrpStringMap;
    groupToType: WfrpStringMap;
    weaponTypes: WfrpStringMap;
    weaponReaches: WfrpStringMap;
    ammunitionGroups: WfrpStringMap;

    itemQualities: WfrpStringMap;
    itemFlaws: WfrpStringMap;
    weaponQualities: WfrpStringMap;
    weaponFlaws: WfrpStringMap;
    armorQualities: WfrpStringMap;
    armorFlaws: WfrpStringMap;
    propertyHasValue: WfrpBooleanMap;
    qualityDescriptions: WfrpStringMap;
    flawDescriptions: WfrpStringMap;

    armorTypes: WfrpStringMap;
    rangeModifiers: WfrpStringMap;
    rangeBands: WfrpStringMap;
    difficultyModifiers: WfrpNumberMap;
    difficultyLabels: WfrpStringMap;
    difficultyNames: WfrpStringMap;
    locations: WfrpStringMap;
    availability: WfrpStringMap;
    availabilityTable: Record<string, Record<string, unknown>>;
    trappingTypes: WfrpStringMap;
    trappingCategories: WfrpStringMap;

    actorSizes: WfrpStringMap;
    actorSizeNums: WfrpNumberMap;
    tokenSizes: WfrpNumberMap;
    vehicleTypes: WfrpStringMap;
    vehicleActorSizeComparison: Record<string, WfrpNumberMap>;
    crewBulk: Record<string, { crew: number; encumbrance: number }>;

    magicLores: WfrpStringMap;
    magicWind: WfrpStringMap;
    prayerTypes: WfrpStringMap;
    mutationTypes: WfrpStringMap;
    overCastTablesPerWind: WfrpStringMap;
    overCastTable(wind: string): string;

    conditions: WfrpStringMap;
    conditionDescriptions: WfrpStringMap;
    symptoms: WfrpStringMap;
    symptomDescriptions: WfrpStringMap;
    symptomTreatment: WfrpStringMap;
    statusEffects: WfrpStatusEffectConfig[];

    species: WfrpSpeciesNameById;
    speciesCharacteristics: WfrpSpeciesCharacteristicsById;
    speciesSkills: WfrpSpeciesSkillsById;
    speciesTalents: WfrpSpeciesTalentsById;
    speciesRandomTalents: WfrpSpeciesRandomTalentsById;
    speciesTalentReplacement: WfrpSpeciesTalentReplacementsById;
    speciesTraits: WfrpSpeciesTraitsById;
    speciesMovement: WfrpSpeciesMovementById;
    speciesFate: WfrpSpeciesFateById;
    speciesRes: WfrpSpeciesResilienceById;
    speciesExtra: WfrpSpeciesExtraById;
    speciesAge: WfrpSpeciesAgeById;
    speciesHeight: WfrpSpeciesHeightById;
    speciesCareerReplacements: WfrpSpeciesCareerReplacementsById;
    extraSpecies: WfrpExtraSpeciesList;
    subspecies: WfrpSubspeciesBySpeciesId;

    earningValues: WfrpStringMap;
    reachNum: WfrpNumberMap;
    moneyNames: WfrpStringMap;
    hitLocationTables: WfrpStringMap;

    traitBonuses: Record<string, Partial<Record<WfrpCharacteristicKey | 'm', number>>>;
    talentBonuses: WfrpStringMap;
    effectTextStyle: PIXI.TextStyle;
    systemEffects: Record<string, unknown>;
    symptomEffects: Record<string, unknown>;
    vehicleSystemEffects: Record<string, unknown>;
    systemItems: Record<string, unknown>;
    rollModes: Record<string, unknown>;
    transferDocumentTypes: Record<string, unknown>;
    badgeInfo: Record<string, unknown>;
    bugReporterConfig: {
      repoEndpoint: string;
      troubleshooting: string;
      successMessage: string;
      [key: string]: unknown;
    };
    scriptTriggers: WfrpStringMap;
    DAMAGE_TYPE: Record<string, string | number>;
    PrepareSystemItems(): void;
    [key: string]: unknown;
  }

  interface WfrpConfigNamespace {
    allowedActorFlags: string[];
    [key: string]: unknown;
  }
}

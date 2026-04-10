export {};

declare global {
  // Shared primitives used across WFRP declaration slices.
  type WfrpConstructor<T = object> = abstract new (...args: never[]) => T;
  type WfrpStringMap = Record<string, string>;
  type WfrpNumberMap = Record<string, number>;
  type WfrpBooleanMap = Record<string, boolean>;

  type WfrpCharacteristicKey = 'ws' | 'bs' | 's' | 't' | 'i' | 'ag' | 'dex' | 'int' | 'wp' | 'fel';

  interface WfrpCharacteristicFormulas {
    ws: string;
    bs: string;
    s: string;
    t: string;
    i: string;
    ag: string;
    dex: string;
    int: string;
    wp: string;
    fel: string;
  }

  interface WfrpSpeciesHeight {
    feet: number;
    inches: number;
    die: string;
  }

  interface WfrpSpeciesRandomTalents {
    talents?: number;
    [talentName: string]: number | undefined;
  }

  type WfrpSpeciesId = string;
  type WfrpSubspeciesId = string;
  type WfrpCareerName = string;
  type WfrpTalentName = string;

  type WfrpSpeciesNameById = Record<WfrpSpeciesId, string>;
  type WfrpSpeciesCharacteristicsById = Record<WfrpSpeciesId, WfrpCharacteristicFormulas>;
  type WfrpSpeciesSkillsById = Record<WfrpSpeciesId, string[]>;
  type WfrpSpeciesTalentsById = Record<WfrpSpeciesId, string[]>;
  type WfrpSpeciesRandomTalentsById = Record<WfrpSpeciesId, WfrpSpeciesRandomTalents>;
  type WfrpSpeciesTalentReplacementsById = Record<WfrpSpeciesId, Record<WfrpTalentName, string>>;
  type WfrpSpeciesTraitsById = Record<WfrpSpeciesId, string[]>;
  type WfrpSpeciesMovementById = Record<WfrpSpeciesId, number>;
  type WfrpSpeciesFateById = Record<WfrpSpeciesId, number>;
  type WfrpSpeciesResilienceById = Record<WfrpSpeciesId, number>;
  type WfrpSpeciesExtraById = Record<WfrpSpeciesId, number>;
  type WfrpSpeciesAgeById = Record<WfrpSpeciesId, string>;
  type WfrpSpeciesHeightById = Record<WfrpSpeciesId, WfrpSpeciesHeight>;
  type WfrpSpeciesCareerReplacementsById = Record<
    WfrpSpeciesId,
    Partial<Record<WfrpCareerName, string[]>>
  >;
  type WfrpSubspeciesBySpeciesId = Record<
    WfrpSpeciesId,
    Record<WfrpSubspeciesId, WfrpSubspeciesConfig>
  >;
  type WfrpExtraSpeciesList = WfrpSpeciesId[];

  interface WfrpSubspeciesConfig {
    name?: string;
    characteristics?: WfrpCharacteristicFormulas;
    skills?: string[];
    talents?: string[];
    randomTalents?: WfrpSpeciesRandomTalents;
    talentReplacement?: Record<string, string>;
    traits?: string[];
    speciesTraits?: string[];
    movement?: number;
    fate?: number;
    resilience?: number;
    extra?: number;
  }

  interface WfrpSpeciesCharacteristicsResult {
    [key: string]: {
      value: number;
      formula: string;
    };
  }

  interface WfrpSpeciesSkillsTalentsResult {
    skills: string[];
    talents: string[];
    randomTalents: WfrpSpeciesRandomTalents;
    talentReplacement: Record<string, string>;
    traits: string[];
  }

  interface WfrpStatusEffectConfig {
    id?: string;
    name?: string;
    description?: string;
    img?: string;
    statuses?: string[];
    system?: {
      condition?: {
        value?: number | null;
        numbered?: boolean;
        trigger?: string;
      };
      scriptData?: Array<Record<string, unknown>>;
      [key: string]: unknown;
    };
    flags?: Record<string, unknown>;
    changes?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  }

  interface WfrpTableRollOptions {
    modifier?: number;
    cancelUnderMin?: boolean;
    lookup?: number;
    showRoll?: boolean;
    hideDSN?: boolean;
    returnResult?: boolean;
    returnObject?: boolean;
    messageId?: string;
    [key: string]: unknown;
  }

  interface WfrpTableRollResult {
    result: string;
    roll?: string | number;
    total?: number;
    name?: string;
    title?: string;
    text?: string;
    description?: string;
    object?: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface WfrpPackLike {
    indexed?: boolean;
    index: Array<Record<string, unknown>>;
    getIndex(): Promise<Array<Record<string, unknown>>>;
    getDocument(id: string): Promise<Item | null>;
    getDocuments(query?: Record<string, unknown>): Promise<Item[]>;
  }

  interface WfrpChatData {
    user?: string;
    rollMode?: string;
    content: string;
    sound?: string;
    whisper?: string[];
    blind?: boolean;
    speaker?: Record<string, unknown>;
    flavor?: string;
    type?: number;
    [key: string]: unknown;
  }

  interface WfrpPreparedDocumentLike {
    prepareData(): void;
  }

  interface WfrpCalendarApi {
    [key: string]: unknown;
  }

  interface WfrpMorrsliebConfig {
    color: {
      value: string;
      apply: boolean;
    };
    gamma: number;
    contrast: number;
    brightness: number;
    saturation: number;
  }
}

export {};

declare global {
  interface WfrpUtilityApi {
    speciesCharacteristics(
      species: string,
      average?: boolean,
      subspecies?: string,
    ): Promise<WfrpSpeciesCharacteristicsResult>;
    speciesSkillsTalents(species: string, subspecies?: string): WfrpSpeciesSkillsTalentsResult;
    speciesMovement(species: string, subspecies?: string): number;
    getSystemEffects(vehicle?: boolean): Record<string, unknown>;
    find(name: string, type?: string | string[]): Promise<Item | undefined>;
    findSkill(skillName: string): Promise<Item>;
    findTalent(talentName: string): Promise<Item>;
    findExactName(name: string, type?: string | string[]): Promise<Item | undefined>;
    findBaseName(name: string, type?: string | string[]): Promise<Item | undefined>;
    extractBaseName(name: string): string;
    extractParenthesesText(name?: string, opening?: '(' | '[' | '<'): string | undefined;
    findItem(itemName: string, itemType?: string | string[]): Promise<Item | undefined>;
    nameSorter(a: { name: string }, b: { name: string }): -1 | 0 | 1;
    qualityList(type?: string | null): WfrpStringMap;
    flawList(type?: string | null): WfrpStringMap;
    allProperties(type?: string | null): WfrpStringMap;
    postSymptom(symptom: string): Promise<void>;
    postProperty(propertyText: string): Promise<void>;
    parsePropertyName(property: string): string;
    chatDataSetup(
      content: string,
      modeOverride?: string | null,
      isRoll?: boolean,
      options?: {
        forceWhisper?: string;
        alias?: string;
        flavor?: string;
      },
    ): WfrpChatData;
    matchClosest(object: WfrpStringMap, query: string, options?: { matchKeys?: boolean }): string;
    getSpeaker(speaker: Record<string, string | undefined>): Actor | undefined;
    getToken(speaker?: Record<string, string | undefined>): TokenDocument | undefined;
    allBasicSkills(): Promise<Array<Record<string, unknown>>>;
    allMoneyItems(): Promise<Array<Record<string, unknown>>>;
    alterDifficulty(difficulty: string, steps: number): string;
    handleTableClick(event: Event, target: HTMLElement): Promise<void>;
    handleConditionClick(event: Event, target: HTMLElement): void;
    handlePropertyClick(event: Event, target: HTMLElement): void;
    handleSymptomClick(event: Event, target: HTMLElement): void;
    handleRollClick(event: Event, target: HTMLElement): Promise<void>;
    handlePayClick(event: Event, target: HTMLElement): void;
    handleCreditClick(event: Event, target: HTMLElement): void;
    handleCorruptionClick(event: Event, target: HTMLElement): void;
    postCorruptionTest(strength: string | number, chatData?: Record<string, unknown>): unknown;
    handleFearClick(event: Event, target: HTMLElement): unknown;
    postFear(value?: number, name?: string): unknown;
    handleTerrorClick(event: Event, target: HTMLElement): unknown;
    handleExpClick(event: Event, target: HTMLElement): unknown;
    postTerror(value?: number, name?: string): unknown;
    postExp(amount: string | number, reason?: string): unknown;
    rollItemMacro(
      itemName: string,
      itemType: string,
      bypassData?: Record<string, unknown>,
    ): unknown;
    toggleMorrslieb(): Promise<void>;
    updateGroupAdvantage(options?: { players?: number; enemies?: number }): Promise<unknown> | void;
    logHomebrew(message: string): void;
    extractLinkLabel(link: string): string;
    mergeCareerReplacements(replacements: Record<string, Record<string, string[]>>): void;
    [key: string]: unknown;
  }
}

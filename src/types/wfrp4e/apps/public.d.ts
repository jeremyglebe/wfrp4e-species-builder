export {};

declare global {
  // Public app constructors exposed on game.wfrp4e.apps.
  interface Wfrp4eAppsApi {
    ActorSheetWFRP4eCharacter: WfrpConstructor;
    ActorSheetWFRP4eCreature: WfrpConstructor;
    ActorSheetWFRP4eNPC: WfrpConstructor;
    ActorSheetWFRP4eVehicle: WfrpConstructor;
    CharGenWfrp4e: WfrpConstructor;
    StatBlockParser: WfrpConstructor;
    BrowserWfrp4e: WfrpConstructor;
    ActorSettings: WfrpConstructor;
    WFRPActiveEffectConfig: WfrpConstructor;
    HomebrewSettings: WfrpConstructor;
    CareerSelector: WfrpConstructor;
    ItemProperties: WfrpConstructor;
    ChargenStage: WfrpConstructor;
    [key: string]: WfrpConstructor | unknown;
  }

  interface WfrpNameGeneratorApi {
    RollArray(key: string): string;
    evaluateNamePartial(fragment: string): string;
    [key: string]: unknown;
  }
}

export {};

declare global {
  interface Game {
    wfrp4e: Wfrp4eGameApi;
  }

  interface CONFIG {
    calendar: WfrpCalendarApi;
    Morrslieb: PIXI.Filter;
    MorrsliebObject: WfrpMorrsliebConfig;
    statusEffects: WfrpStatusEffectConfig[];
    wfrp4e: WfrpConfigNamespace;
  }
}

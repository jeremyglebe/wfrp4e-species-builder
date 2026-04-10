export {};

declare global {
  // Public roll/test classes exposed on game.wfrp4e.rolls.
  interface Wfrp4eRollsApi {
    TestWFRP: WfrpConstructor & { recreate?(data: unknown): unknown };
    CharacteristicTest: WfrpConstructor;
    SkillTest: WfrpConstructor;
    WeaponTest: WfrpConstructor;
    CastTest: WfrpConstructor;
    WomCastTest: WfrpConstructor;
    ChannelTest: WfrpConstructor;
    PrayerTest: WfrpConstructor;
    TraitTest: WfrpConstructor;
    [key: string]: WfrpConstructor | unknown;
  }
}

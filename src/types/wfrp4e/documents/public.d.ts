export {};

declare global {
  // Public document/model constructors exposed on game.wfrp4e.documents.
  interface Wfrp4eDocumentsApi {
    ActorWFRP4e: WfrpConstructor<Actor>;
    ItemWFRP4e: WfrpConstructor<Item>;
    GenericAspectModel: WfrpConstructor;
    [key: string]: WfrpConstructor | unknown;
  }

  interface WfrpMigrationApi {
    migrateWorld(): Promise<void> | void;
    migrateActorData?(actor: Actor): Record<string, unknown>;
    migrateItemData?(item: Item): Record<string, unknown>;
    migrateEffectData?(effect: ActiveEffect): Record<string, unknown>;
    removeLoreEffects?(data: unknown): unknown;
    [key: string]: unknown;
  }
}

export {};

declare global {
  // Composition root for the public game.wfrp4e object.
  interface Wfrp4eGameApi {
    apps: Wfrp4eAppsApi;
    documents: Wfrp4eDocumentsApi;
    rolls: Wfrp4eRollsApi;
    utility: WfrpUtilityApi;
    tables: WfrpTablesApi;
    config: Wfrp4eConfig;
    market: WfrpConstructor | Record<string, unknown>;
    audio: Record<string, unknown>;
    names: WfrpNameGeneratorApi;
    migration: WfrpMigrationApi;
    opposedHandler: WfrpConstructor | Record<string, unknown>;
    tags: WfrpTagsApi;
    trade: WfrpTradeApi;
    commands?: WfrpCommandsApi;
    postReadyPrepare: WfrpPreparedDocumentLike[];
    [key: string]: unknown;
  }

  type WfrpGame = Game & {
    wfrp4e: Wfrp4eGameApi;
  };
}

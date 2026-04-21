export {};

declare global {
  interface WfrpTablesApi {
    handleTableCommand(key?: string, options?: { modifier?: number; column?: string }): void;
    rollTable(
      tableKey: string,
      options?: WfrpTableRollOptions,
      column?: string | null,
    ): Promise<WfrpTableRollResult | string | void>;
    rollToChat(
      table: string,
      options?: WfrpTableRollOptions,
      column?: string | null,
      rollMode?: string,
    ): Promise<unknown>;
    formatChatRoll(
      table: string,
      options?: WfrpTableRollOptions,
      column?: string | null,
    ): Promise<WfrpTableRollResult | string>;
    findTable(tableKey: string, column?: string | null): RollTable | Record<string, unknown> | null;
    getHitLocTable(tableKey: string): WfrpStringMap;
    criticalCastMenu(tableKey: string): string;
    restrictedCriticalCastMenu(): string;
    [key: string]: unknown;
  }
}

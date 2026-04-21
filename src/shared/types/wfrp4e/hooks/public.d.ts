export {};

declare global {
  // Runtime services initialized by WFRP hooks and exposed via game.wfrp4e.
  interface WfrpTagsApi {
    createTags(): void;
    getPacksWithTag(tags: string | string[]): WfrpPackLike[];
    [key: string]: unknown;
  }

  interface WfrpTradeApi {
    attemptBuy(...args: unknown[]): unknown;
    [key: string]: unknown;
  }

  interface WfrpCommandsApi {
    call(command: string, ...args: unknown[]): unknown;
    [key: string]: unknown;
  }
}

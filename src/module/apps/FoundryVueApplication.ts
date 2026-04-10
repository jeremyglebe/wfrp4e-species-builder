import { createApp, type App as VueApp, type Component } from 'vue';

/**
 * Base ApplicationV2 class that encapsulates Vue mount/unmount mechanics.
 *
 * This split keeps Foundry/Vue lifecycle glue in one place so concrete
 * applications can focus on app-specific concerns.
 */
export abstract class FoundryVueApplication extends foundry.applications.api.ApplicationV2 {
  private vueApp?: VueApp<Element>;

  protected abstract readonly vueRootId: string;
  protected abstract getVueComponent(): Component;

  protected async getVueProps(): Promise<Record<string, unknown> | undefined> {
    return undefined;
  }

  protected override async _renderHTML(): Promise<string> {
    return `<div id="${this.vueRootId}"></div>`;
  }

  protected override _replaceHTML(result: string, content: HTMLElement): void {
    content.innerHTML = result;
  }

  protected override async _onRender(): Promise<void> {
    const root = this.element?.querySelector(`#${this.vueRootId}`);
    if (!root) return;

    this.unmountVueApp();

    const props = await this.getVueProps();

    this.vueApp = createApp(this.getVueComponent(), props ?? {});
    this.vueApp.mount(root);
  }

  protected override _onClose(): void {
    this.unmountVueApp();
  }

  private unmountVueApp(): void {
    if (!this.vueApp) return;

    this.vueApp.unmount();
    this.vueApp = undefined;
  }
}

import { createApp, type App as VueApp } from 'vue';
import HelloWorldApp from '../../vue/HelloWorldApp.vue';

export class HelloWorldApplication extends foundry.applications.api.ApplicationV2 {
  private vueApp?: VueApp<Element>;

  static override DEFAULT_OPTIONS = {
    id: 'hello-world-app',
    tag: 'section',
    window: {
      title: 'Hello World',
      resizable: true,
    },
    position: {
      width: 400,
      height: 300,
    },
  };

  protected override async _renderHTML(): Promise<string> {
    return /*html*/ `<div id="root" class="application"></div>`;
  }

  protected override _replaceHTML(result: string, content: HTMLElement): void {
    content.innerHTML = result;
  }

  protected override async _onRender(): Promise<void> {
    const root = this.element?.querySelector('#root');
    if (!root) return;

    if (this.vueApp) {
      this.vueApp.unmount();
      this.vueApp = undefined;
    }

    this.vueApp = createApp(HelloWorldApp);
    this.vueApp.mount(root);
  }

  protected override _onClose(): void {
    if (this.vueApp) {
      this.vueApp.unmount();
      this.vueApp = undefined;
    }
  }
}

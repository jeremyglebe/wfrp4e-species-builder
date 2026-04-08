import { HelloWorldApplication } from '../apps/HelloWorldApplication';

import AbstractSidebarTab = foundry.applications.sidebar.AbstractSidebarTab;
type Configuration = AbstractSidebarTab.Configuration;
type RenderContext = AbstractSidebarTab.RenderContext;
type RenderOptions = AbstractSidebarTab.RenderOptions;

const MODULE_ID = 'wfrp4e-species-builder';

Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing module`);
});

// Add button to sidebar
Hooks.on(
  'changeSidebarTab',
  (app: AbstractSidebarTab<RenderContext, Configuration, RenderOptions>) => {
    if (app.options.id !== 'settings') return;

    const button = document.createElement('button');
    button.textContent = 'Open Hello World App';

    button.addEventListener('click', () => {
      new HelloWorldApplication().render(true);
    });

    app.element.appendChild(button);
  },
);

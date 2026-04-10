import { SpeciesBuilderApplication } from '../apps/SpeciesBuilderApplication';

/**
 * Adds a Species Builder launcher button to the settings sidebar tab.
 */

// type aliases
import AbstractSidebarTab = foundry.applications.sidebar.AbstractSidebarTab;
type Configuration = AbstractSidebarTab.Configuration;
type RenderContext = AbstractSidebarTab.RenderContext;
type RenderOptions = AbstractSidebarTab.RenderOptions;

Hooks.on(
  'changeSidebarTab',
  (app: AbstractSidebarTab<RenderContext, Configuration, RenderOptions>) => {
    if (app.options.id !== 'settings') return;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Open Species Builder';

    button.addEventListener('click', () => {
      new SpeciesBuilderApplication().render(true);
    });

    app.element.appendChild(button);
  },
);

import { SpeciesBuilderApplication } from '../apps/SpeciesBuilderApplication';
import { NPCBuilderApplication } from '../apps/NPCBuilderApplication';

/**
 * Adds Species Builder and NPC Builder launcher buttons to the settings sidebar tab.
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

    const containerId = 'wfrp4e-builder-launchers';
    const existingContainer = app.element.querySelector(`#${containerId}`);
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create container for buttons
    const container = document.createElement('div');
    container.id = containerId;
    container.style.cssText =
      'display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;';

    // Species Builder button
    const speciesButton = document.createElement('button');
    speciesButton.type = 'button';
    speciesButton.textContent = 'Species Builder';
    speciesButton.addEventListener('click', () => {
      new SpeciesBuilderApplication().render(true);
    });

    // NPC Builder button
    const npcButton = document.createElement('button');
    npcButton.type = 'button';
    npcButton.textContent = 'NPC Builder';
    npcButton.addEventListener('click', () => {
      new NPCBuilderApplication().render(true);
    });

    container.appendChild(speciesButton);
    container.appendChild(npcButton);
    app.element.appendChild(container);
  },
);

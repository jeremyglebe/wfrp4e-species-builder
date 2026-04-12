import { SpeciesBuilderApplication } from '../apps/SpeciesBuilderApplication';
import { NPCBuilderApplication } from '../apps/NPCBuilderApplication';
import { AggregateItemBuilderApplication } from '../apps/AggregateItemBuilderApplication';
import { EffectToItemBuilderApplication } from '../apps/EffectToItemBuilderApplication';

/**
 * Adds launcher buttons to sidebar tabs:
 * - Actors tab: Species Builder, NPC Builder
 * - Items tab: Aggregate Items Builder, Effect to Item Builder
 */

// type aliases
import AbstractSidebarTab = foundry.applications.sidebar.AbstractSidebarTab;
type Configuration = AbstractSidebarTab.Configuration;
type RenderContext = AbstractSidebarTab.RenderContext;
type RenderOptions = AbstractSidebarTab.RenderOptions;

Hooks.on(
  'changeSidebarTab',
  (app: AbstractSidebarTab<RenderContext, Configuration, RenderOptions>) => {
    const tabId = app.options.id;
    if (tabId !== 'actors' && tabId !== 'items') return;

    const containerId = `wfrp4e-builder-launchers-${tabId}`;
    const existingContainer = app.element.querySelector(`#${containerId}`);
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create container for buttons
    const container = document.createElement('div');
    container.id = containerId;
    container.style.cssText =
      'display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;';

    if (tabId === 'actors') {
      const speciesButton = document.createElement('button');
      speciesButton.type = 'button';
      speciesButton.textContent = 'Species Builder';
      speciesButton.addEventListener('click', () => {
        new SpeciesBuilderApplication().render(true);
      });

      const npcButton = document.createElement('button');
      npcButton.type = 'button';
      npcButton.textContent = 'NPC Builder';
      npcButton.addEventListener('click', () => {
        new NPCBuilderApplication().render(true);
      });

      container.appendChild(speciesButton);
      container.appendChild(npcButton);
    }

    if (tabId === 'items') {
      const aggregateItemButton = document.createElement('button');
      aggregateItemButton.type = 'button';
      aggregateItemButton.textContent = 'Aggregate Items Builder';
      aggregateItemButton.addEventListener('click', () => {
        new AggregateItemBuilderApplication().render(true);
      });

      const effectToItemButton = document.createElement('button');
      effectToItemButton.type = 'button';
      effectToItemButton.textContent = 'Effect to Item Builder';
      effectToItemButton.addEventListener('click', () => {
        new EffectToItemBuilderApplication().render(true);
      });

      container.appendChild(aggregateItemButton);
      container.appendChild(effectToItemButton);
    }

    app.element.appendChild(container);
  },
);

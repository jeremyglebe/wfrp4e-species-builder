import { registerSettings } from '../settings/register-settings';
import { loadCustomSpeciesDefinitions } from '../species/load-custom-species';
import { transformSpeciesDefinitionsToWfrpConfig } from '../species/transform-species';
import { injectCustomSpeciesIntoWfrpConfig } from '../species/inject-species';
import { MODULE_ID } from '../species/types';
import { SpeciesBuilderApplication } from '../apps/SpeciesBuilderApplication';

// type aliases
import AbstractSidebarTab = foundry.applications.sidebar.AbstractSidebarTab;
type Configuration = AbstractSidebarTab.Configuration;
type RenderContext = AbstractSidebarTab.RenderContext;
type RenderOptions = AbstractSidebarTab.RenderOptions;

Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing module`);

  registerSettings();

  const customSpeciesDefinitions = loadCustomSpeciesDefinitions();

  if (customSpeciesDefinitions.length > 0) {
    const transformedConfig = transformSpeciesDefinitionsToWfrpConfig(customSpeciesDefinitions);

    injectCustomSpeciesIntoWfrpConfig(transformedConfig);

    console.log(`${MODULE_ID} | Injected ${customSpeciesDefinitions.length} custom species`);
  } else {
    console.log(`${MODULE_ID} | No custom species definitions found`);
  }
});

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

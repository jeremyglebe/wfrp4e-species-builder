# Foundry Module Architecture

## Purpose

This project is a Foundry VTT module for WFRP4e tools. It contains multiple builders and utilities, including the Species Builder and NPC Builder.

The architecture is designed around clear separation between:

- pure feature logic
- Foundry integration
- shared state
- Vue UI
- reusable types/utilities
- development documentation

---

## Top-Level Structure

```
src/
  docs/
  functions/
  module/
  shared/
  state/
  view/
```

---

## Layer Responsibilities

## functions/

Pure feature logic.

This layer contains stateless, reusable logic for the module’s tools. Code here should not know about Vue, Pinia, or Foundry.

Rules:

- No `game`
- No `foundry`
- No `Actor.create`
- No `fromUuid`
- No Pinia stores
- No Vue imports
- Prefer input → output functions

Examples:

```
functions/
  npc-builder/
  species-builder/
  shared/
```

Possible responsibilities:

- XP calculations
- career data interpretation
- species config transformation
- trappings consolidation
- random trait selection
- actor data shaping
- import/export conversion

---

## module/

Foundry bridge code.

This layer connects the module to Foundry VTT and WFRP4e.

Rules:

- This is where Foundry APIs belong
- Converts Foundry Documents into plain data
- Converts plain data into Foundry Documents
- Owns hooks, app launching, settings registration, and document lookup

Examples:

```
module/
  hooks/
  apps/
  services/
```

Responsibilities:

- registering hooks
- registering settings
- launching ApplicationV2 windows
- resolving UUIDs
- reading folders
- creating actors/items/tables
- injecting species into WFRP config at `init`

---

## state/

Application state.

This layer owns active builder state using Pinia.

Rules:

- Stores are the source of truth for in-progress work
- State may call pure functions
- State should not contain heavy feature logic
- State should not directly depend on Foundry APIs
- Persistence is delegated to module services

Examples:

```
state/
  stores/
    npc-builder-store.ts
    species-builder-store.ts
```

Responsibilities:

- active NPC draft
- active species draft
- selected species/subspecies
- active NPC Builder tab
- settings currently loaded for a builder
- unsaved edits
- UI-relevant working state

---

## view/

Vue UI.

This layer contains user-facing components.

Rules:

- Vue components live here
- Components read/write state through Pinia
- Components call functions for logic when needed
- Components should avoid direct Foundry document access
- CSS may live in Vue files unless shared

Examples:

```
view/
  apps/
    npc-builder/
    species-builder/
  components/
  modals/
  styles/
```

Responsibilities:

- builder UIs
- reusable UI components
- tabs
- forms
- modals/subviews
- drag/drop UI wrappers
- display formatting

---

## shared/

Cross-cutting types and utilities.

This layer contains code that is not specific to one feature.

Rules:

- Do not use as a junk drawer
- Only put code here if multiple layers/features benefit from it

Examples:

```
shared/
  types/
  utils/
  wfrp4e/
  species-builder/
  npc-builder/
```

Responsibilities:

- shared TypeScript types
- generic helpers
- minimal WFRP type declarations
- shared constants
- plain utility functions

---

## docs/

Project knowledge.

This folder stores development notes and architectural documentation.

Examples:

```
docs/
  architecture.md
  foundry-hooks.md
  release-process.md
  wfrp-species-config.md
  npc-builder-xp-rules.md
```

Purpose:

- record Foundry quirks
- document WFRP discoveries
- preserve implementation decisions
- explain development workflows

---

## Dependency Direction

Preferred dependency flow:

```
view → state → functions
view → module (through explicit bridge APIs only)
module → functions
module → state (only for initialization/persistence)
state → functions
shared → imported by anyone
functions → shared only
```

Avoid:

```
functions → module
functions → state
functions → view
state → view
```

---

## Data Flow

Typical UI interaction:

```
User Input (View)
      ↓
State Update (Pinia)
      ↓
Domain Logic (functions)
      ↓
Updated State
      ↓
View Reacts
```

Typical Foundry interaction:

```
Vue requests action
      ↓
Store prepares plain data
      ↓
Module service converts data to Foundry operation
      ↓
Foundry document is created/updated
```

---

## Persistence Model

State and persistence are separate.

Stores own active working state.
Module services own persistence.

Example:

```
state/species-builder-store.ts
  owns active species data

module/services/settings-service.ts
  loads/saves species data from world settings
```

Settings services should not be treated as the active source of truth.

---

## Feature Pattern

Each feature should generally have:

```
functions/<feature>/
  pure logic

state/stores/<feature>-store.ts
  working state

module/services/<feature>-service.ts
  Foundry bridge

view/apps/<feature>/
  UI
```

Example:

```
functions/species-builder/
  transform-species.ts
  import-actor-as-species.ts

state/stores/species-builder-store.ts

module/services/species-builder-service.ts
  load/save settings
  inject into WFRP config
  resolve actor imports

view/apps/species-builder/
  SpeciesBuilderApp.vue
  SpeciesDetailsSection.vue
  SubspeciesEditor.vue
```

---

## Design Rules

### 1. Pure logic stays pure

If code can be written without Foundry or Vue, it belongs in `functions/`.

### 2. Foundry access is isolated

Only `module/` should call Foundry APIs directly.

### 3. State owns in-progress work

Stores track what the user is building or editing.

### 4. UI should stay thin

Vue components should coordinate interactions, not own major feature logic.

### 5. Shared code must earn its place

Only move code to `shared/` when it is genuinely reused.

### 6. Documentation is part of development

If a Foundry or WFRP behavior takes time to understand, document it.

---

## Current Major Features

### Species Builder

Purpose:

- edit custom WFRP species through UI
- store species in world settings
- inject species into WFRP config at `init`

Architecture notes:

- editor data is stored as cohesive species objects
- WFRP config is treated as an output format
- transform logic belongs in `functions/species-builder`
- injection belongs in `module`

---

### NPC Builder

Purpose:

- rapidly build WFRP NPC actors from base actors and careers
- support deeper customization through tabs

Architecture notes:

- careers are treated as data sources
- NPC draft state lives in Pinia
- XP, trappings, traits, and build data are calculated explicitly
- final actor creation belongs in `module`

---

## Future Features

Potential future features should follow the same layering:

- actor → species import
- JSON import/export
- RollTable generation
- scripted trait/effect helpers
- innate casting helpers
- batch NPC generation

Each should be implemented as:

```
plain data model
→ pure functions
→ state integration
→ Foundry bridge
→ Vue UI
```

---

## Rule of Thumb

When deciding where code belongs:

- Calculates something → `functions/`
- Talks to Foundry → `module/`
- Stores active work → `state/`
- Renders UI → `view/`
- Shared across features → `shared/`
- Took effort to learn → `docs/`

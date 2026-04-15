# WFRP4e Species Builder – Feature Planning Document

## Purpose

This document tracks remaining core features, UI improvements, and advanced (“hacky”) extensions for the Species Builder module. It is intended to guide development toward a complete, user-friendly replacement for world script–based species configuration.

---

# 1. Core Feature Coverage (Against WFRP Config)

## Status: ⚠️ Likely Incomplete

### Verify Support For:

- [ ] Characteristics (including rolls and fixed values)
- [ ] Movement
- [ ] Fate / Resilience
- [ ] Wounds (base + roll)
- [ ] Species Skills (including random selection logic)
- [ ] Species Talents (including random talents)
- [ ] Traits
- [ ] Size
- [ ] Languages
- [ ] XP / Advances (if applicable)
- [ ] Subspecies inheritance behavior
- [ ] Proper injection into `CONFIG.WFRP4E.species`

### Likely Missing / Needs Review:

- [ ] Random selection logic for skills/talents (full parity)
- [ ] Correct formatting for traits (string vs structured)
- [ ] Any edge-case config fields used by system internals

---

# 2. Data Model Improvements

## Subspecies Inheritance (Major UX Upgrade)

Current:

- Override entire lists OR inherit entirely

Target:

- [ ] Visually show inherited values
- [ ] Allow per-item removal (checkbox or “remove inherited”)
- [ ] Allow additions without full override
- [ ] Track diff instead of full override

---

# 3. Drag & Drop System Improvements

## Current

- Drop zones per list

## Target (Character Sheet Style)

- [ ] Entire editor becomes drop zone
- [ ] Drop routed by document type:
  - Skill → skills list
  - Talent → talents list
  - Trait → traits list
  - Spell → (future support)

- [ ] Optional visual drop zones:
  - Hidden by default
  - Highlight on drag hover

## Improvements

- [ ] Deduplicate dropped items
- [ ] Handle compendium + world items
- [ ] Optional toast/log feedback

---

# 4. UI Improvements

## Lists (Skills / Talents / Traits)

- [ ] Replace text inputs with:
  - list display
  - removable items (X button)

- [ ] Drag & drop = primary input
- [ ] Manual entry fallback:
  - inline input + enter to submit

- [ ] Validation:
  - red highlight if item not found
  - tooltip or message for invalid entries

---

## Traits with Data (Advanced)

- [ ] Special UI for:
  - Weapon
  - Horns
  - Natural Attacks

- [ ] Editable fields:
  - Damage
  - Qualities
  - Description overrides

---

# 5. ID Editing Fix (Completed)

- [x] Draft-based ID editing
- [x] Commit on save only
- [x] Preserve selection after rename

---

# 6. Built-in Species Editing

## Goal

Allow editing of core WFRP species without breaking base data.

### Plan:

- [ ] Detect base species from system config
- [ ] Convert to internal format ONLY when edited
- [ ] Store overrides separately
- [ ] Merge at injection stage

---

# 7. Table Integration (Major Feature)

## Character Creation Tables

- [ ] Species Selection Table
- [ ] Career Table per species

### Implementation

- [ ] Create RollTables in world
- [ ] Ensure correct keys/naming
- [ ] Auto-manage tables via editor

---

## Additional Tables

- [ ] Hair table
- [ ] Eye color table
- [ ] Names table

### UI

- [ ] Simple editor for entries
- [ ] Optional weighting
- [ ] Generate preview

---

# 8. “Hacky” Feature Layer (System Extensions)

These rely on scripted traits/effects.

## Implementation Pattern

- Hidden trait added automatically
- Trait contains:
  - Active Effect
  - Script

- Not visible in trait list

---

## Planned Features

### Species-Specific Wound Calculation

- [ ] Inject custom formula
- [ ] Override default wounds

---

### Random Traits (Not Supported Natively)

- [ ] Add system similar to random talents
- [ ] Define roll logic
- [ ] Inject via script trait

---

### Innate Casting System

- [ ] Assign spells to species
- [ ] Override casting skill
- [ ] Modify Language (Magick) characteristic
- [ ] Optional passive casting ability

---

# 9. Quick Select Features

## Common Traits/Talents

- [ ] Night Vision
- [ ] Small
- [ ] Large
- [ ] Hardy
- [ ] Fear

### UI

- [ ] Checkboxes or dropdown
- [ ] Auto-add/remove from lists

---

# 10. Import / Export

- [ ] Export full configuration as JSON
- [ ] Import JSON into builder
- [ ] Validate imported data
- [ ] Version compatibility handling

---

# 11. Validation System

- [ ] Validate:
  - talents
  - skills
  - traits

- [ ] Show inline errors
- [ ] Prevent invalid saves (optional toggle)

---

# 12. Quality of Life

- [ ] Duplicate species
- [ ] Duplicate subspecies
- [ ] Confirm on delete
- [ ] Unsaved changes warning
- [ ] Save success feedback

---

# 13. Future Considerations

- [ ] Spell support in species
- [ ] Career integration deeper linking
- [ ] Localization support
- [ ] Export to Foundry package/module

---

# Development Priority Suggestion

## Phase 1 (Finish Core)

- Validate config completeness
- Improve lists UI
- Improve drag/drop (global drop zone)

## Phase 2 (Usability)

- Inheritance system
- Built-in species editing
- Validation system

## Phase 3 (Power Features)

- Table integration
- Hacky feature layer
- Quick select traits

## Phase 4 (Polish)

- Import/export
- QoL features
- UX refinement

---

# Notes

- Avoid overengineering UI early
- Focus on correct data + injection first
- Treat “hacky” features as first-class UI features
- Keep everything scoped and predictable within Foundry constraints

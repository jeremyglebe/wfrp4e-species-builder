# WFRP4e Species Builder

A Foundry VTT module that enables **custom species creation for Warhammer Fantasy Roleplay 4e** through a user-friendly interface, without requiring world scripts.

This module injects custom species directly into the WFRP4e system config during initialization, allowing them to appear in character generation alongside core species.

---

## Features (Planned)

- Create and edit custom species through a UI
- World-shared species definitions (no per-user setup)
- Integration with WFRP4e character generation
- Import / export species definitions (future)
- Validation and error feedback (future)

---

## Development Setup

### Prerequisites

- Node.js (v18+ recommended)
- A local Foundry VTT installation
- A WFRP4e world for testing

---

### 1. Clone the Repository

```bash
git clone <REPOSITORY_URL>
cd <REPOSITORY_DIRECTORY>
```

Replace `<REPOSITORY_URL>` and `<REPOSITORY_DIRECTORY>` with the repository-specific values.

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Local Build Output

This project supports building directly into a Foundry modules folder for a fast development workflow.

Create a file named:

.env.local

in the project root.

Add the following:

```env
FOUNDRY_MODULE_PATH=C:/Users/YOUR_USER/AppData/Local/FoundryVTT/Data/modules/wfrp4e-species-builder
```

Replace the path with the local Foundry modules directory.

This file is ignored by git and should **not** be committed.

If this variable is not set, the project will build into a local `build/` folder instead.

---

### 4. Run Development Build (Watch Mode)

```bash
npm run dev
```

This command will:

- Continuously rebuild the module when files change
- Output directly into the configured Foundry modules folder

---

### 5. Enable the Module in Foundry

1. Launch Foundry
2. Enable **WFRP4e Species Builder** in the target world
3. Open the browser console
4. Reload the world

Expected console output:

```text
wfrp4e-species-builder | Initializing module
```

---

## Development Workflow

Typical loop:

1. Edit code  
2. Vite rebuilds automatically  
3. Reload Foundry (F5)  
4. Test changes  

Note: Foundry does not reliably support full hot module replacement. Reloading is expected.

---

## Build for Distribution

```bash
npm run build
```

Outputs a production build.

For releases:

- package the build output as `module.zip`
- upload it alongside `module.json` to a GitHub Release
- ensure `manifest` and `download` URLs in `module.json` point to the release assets

---

## Project Structure

```text
src/
  module/
    index.ts
    hooks/
    settings/
    species/
    apps/
  vue/
styles/
static/
module.json
vite.config.ts
```

---

## Notes

- Custom species are stored in **world settings**
- Species are injected into WFRP4e during the **init hook**
- A **world reload is required** after modifying species

---

## License

Unlicensed (all rights reserved)

// WFRP type map:
// - core: shared primitives and species domain model types.
// - apps: public app constructors exposed under game.wfrp4e.apps.
// - documents: public document/model constructors and migration-facing APIs.
// - hooks: runtime services initialized by hooks (tags, commands, trade).
// - rolls: public roll/test constructors under game.wfrp4e.rolls.
// - system: config object shape plus utility and table APIs.
// - game: composition root for game.wfrp4e.
// - foundry: global Game/CONFIG augmentation points.
/// <reference path="./core/index.d.ts" />
/// <reference path="./apps/index.d.ts" />
/// <reference path="./documents/index.d.ts" />
/// <reference path="./hooks/index.d.ts" />
/// <reference path="./rolls/index.d.ts" />
/// <reference path="./system/index.d.ts" />
/// <reference path="./game/index.d.ts" />
/// <reference path="./foundry/index.d.ts" />

export {};

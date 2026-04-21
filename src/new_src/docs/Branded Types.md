# Branded Types

## What Are Branded Types?

TypeScript's type system is *structural* — two types are considered compatible if they share the same shape. This means that two types which are structurally identical are, from TypeScript's perspective, interchangeable:

```ts
type Meters = number;
type Seconds = number;

function travel(distance: Meters, time: Seconds) { ... }

const dist: Meters = 100;
const time: Seconds = 30;

travel(time, dist); // No error! TypeScript is fine with this.
```

A **branded type** (also called a *nominal type* or *opaque type*) solves this by attaching a unique phantom property to a base type. The property exists only in the type system — it has no runtime value — but it makes the type structurally distinct from all other types, even those with the same base:

```ts
type Meters = number & { readonly __brand: 'Meters' };
type Seconds = number & { readonly __brand: 'Seconds' };

function travel(distance: Meters, time: Seconds) { ... }

const dist = 100 as Meters;
const time = 30 as Seconds;

travel(time, dist); // Type error — arguments are in the wrong order!
```

Because `Meters` and `Seconds` now have different `__brand` values, TypeScript can tell them apart even though both are fundamentally `number`.

---

## `Brand` Utility Type

The core building block lives in [shared/types/utils/Brand.ts](../shared/types/utils/Brand.ts):

```ts
export type Brand<T, B extends string> = T & { readonly __brand: B; readonly __baseType: T };
```

Two phantom properties are added:

| Property | Purpose |
|---|---|
| `__brand` | Holds the unique brand string, making the type nominally distinct. |
| `__baseType` | Records the unwrapped base type `T` so helper utilities can reference it without extra generics. |

### Defining a Branded Type

```ts
// Use a private local type alias for the brand string.
// This prevents outside code from forging the brand by accident.
type __brand = 'DiceString';
type DiceString = Brand<string, __brand>;
```

The local `__brand` alias is a useful convention: it keeps the brand string from leaking into autocomplete and makes it obvious that the string is an implementation detail.

---

## Helper Function Types

`Brand.ts` also exports three helper function types that describe common operations for a branded type:

### `MakeBrandFunc`

```ts
export type MakeBrandFunc<BrandType extends Brand<unknown, string>> = (
  value: BrandType['__baseType'],
) => BrandType;
```

A function that takes a raw base value, validates it (typically by throwing on failure), and returns it as the branded type. The `['__baseType']` lookup is why `__baseType` exists on the `Brand` definition — it lets the generic resolve the unwrapped type automatically.

### `AssertBrandFunc`

```ts
export type AssertBrandFunc<BrandType extends Brand<unknown, string>> = (
  value: unknown,
) => asserts value is BrandType;
```

A TypeScript *assertion function*. If the value fails validation it throws; otherwise TypeScript narrows the value's type in the surrounding scope.

### `IsBrandFunc`

```ts
export type IsBrandFunc<BrandType extends Brand<unknown, string>> = (
  value: unknown,
) => value is BrandType;
```

A TypeScript *type guard*. Returns `true`/`false` and narrows the type inside conditional branches.

---

## The `BrandClass` Pattern

Standard branded type patterns usually provide only the bare type plus a few standalone functions. This codebase extends that pattern with the `BrandClass` type:

```ts
export type BrandClass<BrandType extends Brand<unknown, string>> = MakeBrandFunc<BrandType> & {
  assert: AssertBrandFunc<BrandType>;
  is: IsBrandFunc<BrandType>;
};
```

A `BrandClass` is a **callable function** (the make function) that also carries `.assert()` and `.is()` as static methods — merged directly onto the function object via `Object.assign`. This gives each branded type a single named export that behaves like a class:

| Usage | What it does |
|---|---|
| `DiceString(value)` | Validates and returns the value as a `DiceString`, throwing on failure. |
| `DiceString.is(value)` | Returns `true` if valid; narrows type inside `if` blocks. |
| `DiceString.assert(value)` | Throws if invalid; narrows type after the call. |

The concrete pattern looks like this (from [DiceString.ts](../shared/types/utils/DiceString.ts)):

```ts
const DiceString: BrandClass<DiceString> = Object.assign<
  MakeBrandFunc<DiceString>,
  { assert: AssertBrandFunc<DiceString>; is: IsBrandFunc<DiceString> }
>(
  (value: string) => {
    DiceString.assert(value);
    return value;
  },
  {
    assert(value: unknown): asserts value is DiceString {
      if (DiceString.is(value)) return;
      throw new TypeError(`Value is not a valid DiceString: ${value}`);
    },
    is(value: unknown): value is DiceString {
      // ... validation logic ...
    },
  },
);
```

All validation logic lives in `.is()`. The make function and `.assert()` both delegate to it, so there is exactly one place to maintain.

---

## Usage Examples

```ts
function rollDice(formula: DiceString) {
  console.log(`Rolling: ${formula}`);
}

// Direct construction — throws if the string is not a valid dice formula
const formula = DiceString('2d6+3');
rollDice(formula); // ✓

// Type guard — narrows inside the branch
if (DiceString.is(userInput)) {
  rollDice(userInput); // userInput is DiceString here ✓
} else {
  console.error('Not a dice formula');
}

// Assertion — narrows everything after this line, throws if invalid
DiceString.assert(userInput);
rollDice(userInput); // ✓

// A plain string is not assignable to DiceString
rollDice(userInput); // ✗ Type error before the assert above
```

---

## Name Collision with Foundry VTT Types

The `fvtt-types` package (League of Foundry Developers) exports its own `Brand` utility:

```ts
// fvtt-types version
export type Brand<BaseType, BrandName extends string> = BaseType & Branded<BrandName>;
// where Branded<BrandName> is a class with a real private #brand field
```

This is structurally different from the local version (which uses a plain readonly property and adds `__baseType`). Both types are named `Brand`, so **a bare `import type { Brand } from '...'` can silently resolve to the wrong one** depending on the import path.

> **Warning:** Project code should import `Brand` (and related helpers) explicitly from the local path:
>
> ```ts
> import type { Brand, BrandClass } from '@/new_src/shared/types/utils/Brand';
> ```
>
> Project code should not rely on ambient or auto-imported `Brand` from `fvtt-types` unless explicitly interacting with Foundry types.

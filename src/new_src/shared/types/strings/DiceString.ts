import type { Brand, BrandClass, BrandFunc, BrandMethods } from '../Brand';

type __brand = 'DiceString';
type DiceString = Brand<string, __brand>;

// What is a DiceString?
// Dicestrings are strings which can be validated to ensure that they are in the format of a dice formula.
// Examples of valid dice formulas include:
// - "2d6"
// - "1d20+5"
// - "3d4-2"
// - "1d100+3d6-4"
//
// Dice formulas, in this system, are also allowed to start with a number
// - "10+2d6" is a valid dice formula, and is equivalent to "2d6+10".
// Dice formulas *must*, however, contain at least one dice term (e.g. "2d6") in order to be considered a valid dice formula.

const DiceString: BrandClass<DiceString> = Object.assign<
  BrandFunc<DiceString>,
  BrandMethods<DiceString>
>(
  // making a DiceString from a string is as simple as asserting it matches the format, then returning it as a DiceString
  (value: string) => {
    DiceString.assert(value);
    return value;
  },
  // merge this object into the function object, creating static methods on the function itself
  {
    // `assert` can simply call `is` and then throw if it returns false
    assert(value: unknown): asserts value is DiceString {
      if (DiceString.is(value)) {
        return;
      }
      throw new TypeError(`Value is not a valid DiceString: ${value}`);
    },
    // all of the real validation logic goes here- everything else just depends on it
    is(value: unknown): value is DiceString {
      // if the value isn't a string, it definitely isn't a DiceString
      if (typeof value !== 'string') {
        return false;
      }

      // regex strings for matching terms
      const rMatchDiceTerm = /^\d+d\d+$/;
      const rMatchIntegerTerm = /^\d+$/;
      const rMatchOperatorOrParen = /^[+\-()]$/;

      // helpers for testing terms
      const isDiceTerm = (term: string) => rMatchDiceTerm.test(term);
      const isIntegerTerm = (term: string) => rMatchIntegerTerm.test(term);
      const isOperatorOrParen = (term: string) => rMatchOperatorOrParen.test(term);

      // helper for creating a capture group regex out of another regex
      const rCaptured = (r: RegExp) => new RegExp(`(${r.source})`);

      // Break the string up into an array of terms,
      // which can be dice terms, integer terms, operators, or parentheses.
      const terms = value
        // by capturing the operators and parentheses, split knows to include them in the results
        .split(rCaptured(rMatchOperatorOrParen))
        // trim each term, removing accidental whitespace
        .map((term) => term.trim())
        // remove empty terms, which can occur if there is extra whitespace around operators
        .filter((term) => term.length > 0);

      // Track whether there is at least one dice term- required to be a DiceString
      let hasDiceTerm = false;

      // Process each term, testing that it meets one of the required formats.
      for (const term of terms) {
        if (isDiceTerm(term)) {
          // If a Dice Term is found, flag that the minimum has been met
          hasDiceTerm = true;
        } else if (!isIntegerTerm(term) && !isOperatorOrParen(term)) {
          // If the first block is skipped, it isn't a dice term.
          // If this block has been entered, it also isn't an integer, operator, or parenthesis.
          // Therefore, this is not a valid DiceString.
          return false;
        }
      }
      // There weren't any invalid terms found by this point.
      // But the function still needs to confirm that there was at least one dice term.
      // So it returns based on whether a dice term was ever flagged as found.
      return hasDiceTerm;
    },
  },
);

export { DiceString };

const _example_usage = (strarg: string) => {
  function do_something_with_string(str: string) {
    console.log(`Doing something with a string: ${str}`);
  }

  function do_something_with_dice(formula: DiceString) {
    console.log(`Rolling some dice with the formula: ${formula}`);
  }

  // Argument is a string :)
  do_something_with_string(strarg);

  // Argument is a string :(
  // do_something_with_dice(strarg); // Type error

  // Creating a DiceString directly
  const good_dice_string = DiceString('2d6+3');
  // const bad_dice_string = DiceString('hello world'); // throws an error
  do_something_with_dice(good_dice_string);

  // Branching logic via the .is() method
  if (DiceString.is(strarg)) {
    // strarg is now a DiceString
    do_something_with_dice(strarg);
  } else {
    // strarg is still an ordinary string
    do_something_with_string(strarg);
  }

  // Asserting a string to be a DiceString
  DiceString.assert(strarg); // errors if strarg doesn't validate
  // If the above line doesn't error, strarg is now a DiceString
  do_something_with_dice(strarg);
};

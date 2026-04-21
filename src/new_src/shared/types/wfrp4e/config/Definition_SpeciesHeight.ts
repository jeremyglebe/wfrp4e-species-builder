export interface Definition_SpeciesHeight {
  readonly die: string; // the die to roll for height (e.g. "2D10")
  readonly feet: number; // the base height's feet component
  readonly inches: number; // the base height's inches component

  // a height of 5'2"+1D10" would be represented as:
  // die: "1D10", feet: 5, inches: 2
}

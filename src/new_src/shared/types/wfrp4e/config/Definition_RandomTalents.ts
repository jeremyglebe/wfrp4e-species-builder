export interface Definition_RandomTalents {
  // number of random talents from the standard random talents table
  readonly talents: number;
  // now any key followed by a number for specific random talent tables
  readonly [key: string]: number;
}

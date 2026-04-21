export interface Definition_RandomTalents {
  // number of random talents from the standard random talents table
  talents: number;
  // now any key followed by a number for specific random talent tables
  [key: string]: number;
}

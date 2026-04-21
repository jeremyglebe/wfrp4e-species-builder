export interface RandomTalentsEntry {
  count: number; // the number of random talents to generate
  tableKey?: string; // the key of the table to roll for random talents (e.g. "custom-talents-table")
  useDefaultTable?: boolean; // inidicates to use the system's default talent table; tableKey is ignored if this is true

  // if useDefaultTable is undefined and tableKey is also undefined, the module should act as though useDefaultTable is true
  // if useDefaultTable is *false* and tableKey is undefined, the module should throw an error
}

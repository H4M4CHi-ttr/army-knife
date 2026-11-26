import type { CsvDiffInput } from "./csv-key-diff";

export const CSV_KEY_DIFF_SAMPLE: CsvDiffInput = {
  before: { text: "id,name,legacy\n001,Ada,x\n002,Lin,y", format: "csv" },
  after: { text: "id,name,region\n003,Jo,EU\n001,Ada Lovelace,UK", format: "csv" },
  keys: ["id"],
};

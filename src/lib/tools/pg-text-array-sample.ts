export const PG_TEXT_ARRAY_SAMPLE = String.raw`{"a,b",NULL,"NULL","","a\"b","c\\d","日本語"}`;
export const PG_TEXT_ARRAY_SAMPLE_VALUES = ["a,b", null, "NULL", "", 'a"b', "c\\d", "日本語"] as const;
export const PG_TEXT_ARRAY_SAMPLE_JSON = JSON.stringify(PG_TEXT_ARRAY_SAMPLE_VALUES, null, 2);

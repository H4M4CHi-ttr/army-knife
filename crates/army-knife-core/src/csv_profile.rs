use std::collections::{BTreeMap, BTreeSet, HashSet};

use regex::Regex;
use serde::Serialize;

use crate::{
    EngineError, MAX_COLUMNS, MAX_ROWS, MAX_UNIQUE_PER_COLUMN, MAX_UNIQUE_TOTAL, shortened,
};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CsvColumnProfile {
    index: usize,
    name: String,
    empty: usize,
    unique: usize,
    unique_capped: bool,
    inferred_type: &'static str,
    types: BTreeMap<&'static str, usize>,
    samples: Vec<String>,
    #[serde(skip)]
    seen: HashSet<String>,
}

impl CsvColumnProfile {
    fn new(index: usize, name: String, missing_before: usize) -> Self {
        Self {
            index,
            name: shortened(&name, 120).0,
            empty: missing_before,
            unique: 0,
            unique_capped: false,
            inferred_type: "empty",
            types: ["boolean", "integer", "decimal", "date", "text"]
                .map(|key| (key, 0))
                .into_iter()
                .collect(),
            samples: Vec::new(),
            seen: HashSet::new(),
        }
    }

    fn observe(&mut self, value: &str, decimal: &Regex, unique_total: &mut usize) {
        if value.is_empty() {
            self.empty += 1;
            return;
        }
        *self.types.entry(classify(value, decimal)).or_default() += 1;
        if !self.seen.contains(value) {
            if self.samples.len() < 3 {
                let sample = shortened(value, 120).0;
                if !self.samples.contains(&sample) {
                    self.samples.push(sample);
                }
            }
            if self.seen.len() < MAX_UNIQUE_PER_COLUMN && *unique_total < MAX_UNIQUE_TOTAL {
                self.seen.insert(value.to_owned());
                *unique_total += 1;
            } else {
                self.unique_capped = true;
            }
        }
    }

    fn finish(&mut self) {
        self.unique = self.seen.len();
        let kinds: Vec<&str> = self
            .types
            .iter()
            .filter(|(_, count)| **count > 0)
            .map(|(kind, _)| *kind)
            .collect();
        self.inferred_type = match kinds.as_slice() {
            [] => "empty",
            [kind] => kind,
            ["decimal", "integer"] => "decimal",
            _ => "mixed",
        };
        self.seen.clear();
        self.seen.shrink_to_fit();
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CsvResult {
    rows: usize,
    columns: usize,
    ragged_rows: usize,
    duplicate_headers: Vec<String>,
    profiles: Vec<CsvColumnProfile>,
    preview: Vec<Vec<String>>,
    truncated_preview: bool,
}

pub(crate) fn profile(
    input: &str,
    delimiter: u8,
    header: bool,
    trim: bool,
) -> Result<CsvResult, EngineError> {
    let text = input.strip_prefix('\u{feff}').unwrap_or(input);
    validate_quotes(text, delimiter)?;
    let mut reader = csv::ReaderBuilder::new()
        .delimiter(delimiter)
        .has_headers(header)
        .flexible(true)
        .trim(if trim {
            csv::Trim::All
        } else {
            csv::Trim::None
        })
        .from_reader(text.as_bytes());

    let mut profiles = Vec::new();
    let mut duplicate_headers = BTreeSet::new();
    let mut expected_width = None;
    if header {
        let headers = reader
            .headers()
            .map_err(|error| EngineError::new("INVALID_CSV", error.to_string()))?;
        ensure_columns(headers.len())?;
        expected_width = Some(headers.len());
        let mut names = HashSet::new();
        for (index, value) in headers.iter().enumerate() {
            let name = if value.is_empty() {
                format!("#{}", index + 1)
            } else {
                value.to_owned()
            };
            if !names.insert(name.clone()) {
                duplicate_headers.insert(name.clone());
            }
            profiles.push(CsvColumnProfile::new(index, name, 0));
        }
    }

    let decimal = Regex::new(r"^[+-]?(?:[0-9]+\.[0-9]*|\.[0-9]+|[0-9]+)(?:[eE][+-]?[0-9]+)?$")
        .map_err(|_| {
            EngineError::new("INTERNAL_ERROR", "Number classifier could not initialize.")
        })?;
    let mut rows = 0;
    let mut ragged_rows = 0;
    let mut unique_total = 0;
    let mut preview = Vec::new();

    for record in reader.records() {
        let record = record.map_err(|error| EngineError::new("INVALID_CSV", error.to_string()))?;
        if rows == MAX_ROWS {
            return Err(EngineError::new(
                "TOO_MANY_ROWS",
                "CSV supports at most 100,000 data records.",
            ));
        }
        ensure_columns(record.len())?;
        let width = *expected_width.get_or_insert(record.len());
        if record.len() != width {
            ragged_rows += 1;
        }
        while profiles.len() < record.len() {
            let index = profiles.len();
            profiles.push(CsvColumnProfile::new(
                index,
                format!("#{}", index + 1),
                rows,
            ));
        }
        for (index, column) in profiles.iter_mut().enumerate() {
            column.observe(record.get(index).unwrap_or(""), &decimal, &mut unique_total);
        }
        if preview.len() < 12 {
            preview.push(record.iter().map(|value| shortened(value, 120).0).collect());
        }
        rows += 1;
    }

    for column in &mut profiles {
        column.finish();
    }
    Ok(CsvResult {
        rows,
        columns: profiles.len(),
        ragged_rows,
        duplicate_headers: duplicate_headers
            .into_iter()
            .map(|name| shortened(&name, 120).0)
            .collect(),
        profiles,
        preview,
        truncated_preview: rows > 12,
    })
}

fn ensure_columns(columns: usize) -> Result<(), EngineError> {
    if columns > MAX_COLUMNS {
        Err(EngineError::new(
            "TOO_MANY_COLUMNS",
            "CSV supports at most 256 columns.",
        ))
    } else {
        Ok(())
    }
}

/// The csv crate intentionally tolerates malformed quotes. Reject them explicitly so
/// a missing final quote never quietly turns many rows into one successful record.
fn validate_quotes(text: &str, delimiter: u8) -> Result<(), EngineError> {
    #[derive(Clone, Copy)]
    enum State {
        Start,
        Plain,
        Quoted,
        AfterQuote,
    }
    let mut state = State::Start;
    for (offset, byte) in text.bytes().enumerate() {
        let separator = byte == delimiter || byte == b'\n' || byte == b'\r';
        state = match (state, byte, separator) {
            (State::Start, b'"', _) => State::Quoted,
            (State::Start, _, true) => State::Start,
            (State::Start, _, false) => State::Plain,
            (State::Plain, b'"', _) => {
                return Err(EngineError::new(
                    "INVALID_CSV",
                    format!("Quote inside an unquoted field near byte {offset}."),
                ));
            }
            (State::Plain, _, true) => State::Start,
            (State::Plain, _, false) => State::Plain,
            (State::Quoted, b'"', _) => State::AfterQuote,
            (State::Quoted, _, _) => State::Quoted,
            (State::AfterQuote, b'"', _) => State::Quoted,
            (State::AfterQuote, _, true) => State::Start,
            (State::AfterQuote, _, false) => {
                return Err(EngineError::new(
                    "INVALID_CSV",
                    format!("Unexpected text after a closing quote near byte {offset}."),
                ));
            }
        };
    }
    if matches!(state, State::Quoted) {
        Err(EngineError::new(
            "INVALID_CSV",
            "Quoted field was not closed before end of input.",
        ))
    } else {
        Ok(())
    }
}

fn classify(value: &str, decimal: &Regex) -> &'static str {
    if value.eq_ignore_ascii_case("true") || value.eq_ignore_ascii_case("false") {
        return "boolean";
    }
    let unsigned = value.strip_prefix(['+', '-']).unwrap_or(value);
    if !unsigned.is_empty() && unsigned.bytes().all(|byte| byte.is_ascii_digit()) {
        return "integer";
    }
    if valid_date(value) {
        return "date";
    }
    if decimal.is_match(value) {
        return "decimal";
    }
    "text"
}

fn valid_date(value: &str) -> bool {
    let bytes = value.as_bytes();
    if bytes.len() != 10 || bytes[4] != b'-' || bytes[7] != b'-' {
        return false;
    }
    if !bytes
        .iter()
        .enumerate()
        .all(|(i, byte)| i == 4 || i == 7 || byte.is_ascii_digit())
    {
        return false;
    }
    let number = |part: &[u8]| {
        part.iter()
            .fold(0_u32, |n, byte| n * 10 + u32::from(byte - b'0'))
    };
    let year = number(&bytes[..4]);
    let month = number(&bytes[5..7]);
    let day = number(&bytes[8..]);
    let leap = year.is_multiple_of(4) && (!year.is_multiple_of(100) || year.is_multiple_of(400));
    let days = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if leap => 29,
        2 => 28,
        _ => return false,
    };
    year > 0 && day > 0 && day <= days
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn quoted_delimiters_newlines_and_escaped_quotes() {
        let result = profile(
            "name,note\r\n\"A,B\",\"line1\nline2\"\r\nC,\"say \"\"hi\"\"\"\r\n",
            b',',
            true,
            false,
        )
        .unwrap();
        assert_eq!(result.rows, 2);
        assert_eq!(result.columns, 2);
        assert_eq!(result.preview[0], ["A,B", "line1\nline2"]);
        assert_eq!(result.preview[1][1], "say \"hi\"");
        assert_eq!(result.ragged_rows, 0);
    }

    #[test]
    fn missing_extra_and_duplicate_columns_are_explicit() {
        let result = profile("id,id\n1\n2,3,4", b',', true, false).unwrap();
        assert_eq!(result.rows, 2);
        assert_eq!(result.columns, 3);
        assert_eq!(result.ragged_rows, 2);
        assert_eq!(result.duplicate_headers, ["id"]);
        assert_eq!(result.profiles[1].empty, 1);
        assert_eq!(result.profiles[2].empty, 1);
        assert_eq!(result.profiles[2].types["integer"], 1);
    }

    #[test]
    fn headerless_data_bom_and_whitespace_option() {
        let result = profile("\u{feff} 1 ; x \n 2 ; \n", b';', false, true).unwrap();
        assert_eq!(result.rows, 2);
        assert_eq!(result.profiles[0].name, "#1");
        assert_eq!(result.profiles[0].types["integer"], 2);
        assert_eq!(result.profiles[1].empty, 1);
        let untrimmed = profile("x\n \n", b',', true, false).unwrap();
        assert_eq!(untrimmed.profiles[0].empty, 0);
        assert_eq!(untrimmed.profiles[0].types["text"], 1);
    }

    #[test]
    fn inference_handles_mixed_numbers_and_real_calendar_dates() {
        let result = profile("n,date,bool\n9007199254740993,2024-02-29,TRUE\n.2,2023-02-29,false\n1e9999,2026-10-11,yes", b',', true, false).unwrap();
        assert_eq!(result.profiles[0].inferred_type, "decimal");
        assert_eq!(result.profiles[1].types["date"], 2);
        assert_eq!(result.profiles[1].types["text"], 1);
        assert_eq!(result.profiles[2].inferred_type, "mixed");
    }

    #[test]
    fn malformed_quotes_are_errors() {
        for value in ["x\n\"unterminated", "x\nab\"cd", "x\n\"abc\"tail"] {
            assert_eq!(
                profile(value, b',', true, false).unwrap_err().code,
                "INVALID_CSV"
            );
        }
    }

    #[test]
    fn exact_unique_count_at_cap_is_not_marked_approximate() {
        let values = (0..MAX_UNIQUE_PER_COLUMN)
            .map(|n| n.to_string())
            .collect::<Vec<_>>()
            .join("\n");
        let exact = profile(&values, b',', false, false).unwrap();
        assert_eq!(exact.profiles[0].unique, MAX_UNIQUE_PER_COLUMN);
        assert!(!exact.profiles[0].unique_capped);
        let bounded = profile(&format!("{values}\nnew\n0"), b',', false, false).unwrap();
        assert_eq!(bounded.profiles[0].unique, MAX_UNIQUE_PER_COLUMN);
        assert!(bounded.profiles[0].unique_capped);
        assert_eq!(bounded.rows, MAX_UNIQUE_PER_COLUMN + 2);
    }

    #[test]
    fn unique_storage_is_bounded_across_all_columns() {
        let text = (0..4_002)
            .map(|n| {
                (0..25)
                    .map(|c| format!("{n}:{c}"))
                    .collect::<Vec<_>>()
                    .join(",")
            })
            .collect::<Vec<_>>()
            .join("\n");
        let result = profile(&text, b',', false, false).unwrap();
        assert_eq!(
            result
                .profiles
                .iter()
                .map(|column| column.unique)
                .sum::<usize>(),
            MAX_UNIQUE_TOTAL
        );
        assert!(result.profiles.iter().all(|column| column.unique_capped));
    }

    #[test]
    fn rows_and_columns_have_hard_bounds() {
        let rows = "x\n".repeat(MAX_ROWS + 1);
        assert_eq!(
            profile(&rows, b',', false, false).unwrap_err().code,
            "TOO_MANY_ROWS"
        );
        let columns = std::iter::repeat_n("x", MAX_COLUMNS + 1)
            .collect::<Vec<_>>()
            .join(",");
        assert_eq!(
            profile(&columns, b',', true, false).unwrap_err().code,
            "TOO_MANY_COLUMNS"
        );
    }

    #[test]
    fn empty_and_header_only_csv_are_valid() {
        assert_eq!(profile("", b',', true, false).unwrap().columns, 0);
        let result = profile("a,b", b',', true, false).unwrap();
        assert_eq!(result.rows, 0);
        assert_eq!(result.columns, 2);
        assert!(
            result
                .profiles
                .iter()
                .all(|column| column.inferred_type == "empty")
        );
    }

    #[test]
    fn display_headers_are_bounded_but_duplicate_detection_uses_full_text() {
        let long_name = "名".repeat(200);
        let result = profile(&format!("{long_name},{long_name}\n1,2"), b',', true, false).unwrap();
        assert_eq!(result.duplicate_headers.len(), 1);
        assert_eq!(result.duplicate_headers[0].chars().count(), 121);
        assert_eq!(result.profiles[0].name.chars().count(), 121);
        assert!(result.profiles[0].name.ends_with('…'));
    }
}

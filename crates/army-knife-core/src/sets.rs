use std::collections::HashSet;

use serde::{Deserialize, Serialize};

use crate::{EngineError, MAX_ROWS};

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) enum SetMode {
    Intersection,
    Union,
    LeftOnly,
    RightOnly,
    SymmetricDifference,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SetsResult {
    mode: SetMode,
    left_lines: usize,
    right_lines: usize,
    left_unique: usize,
    right_unique: usize,
    left_duplicates: usize,
    right_duplicates: usize,
    count: usize,
    items: Vec<String>,
}

struct NormalizedSet {
    lines: usize,
    duplicates: usize,
    keys: HashSet<String>,
    items: Vec<String>,
}

fn comparison_key(value: &str, case_insensitive: bool) -> String {
    if case_insensitive {
        value.to_lowercase()
    } else {
        value.to_owned()
    }
}

fn normalize(
    text: &str,
    trim: bool,
    case_insensitive: bool,
    ignore_empty: bool,
    remaining_rows: usize,
) -> Result<NormalizedSet, EngineError> {
    let mut normalized = NormalizedSet {
        lines: 0,
        duplicates: 0,
        keys: HashSet::new(),
        items: Vec::new(),
    };
    for line in text.lines() {
        if normalized.lines == remaining_rows {
            return Err(EngineError::new(
                "TOO_MANY_ROWS",
                "Both sets combined support at most 100,000 lines.",
            ));
        }
        normalized.lines += 1;
        let value = if trim { line.trim() } else { line };
        if ignore_empty && value.is_empty() {
            continue;
        }
        let key = comparison_key(value, case_insensitive);
        if normalized.keys.insert(key) {
            normalized.items.push(value.to_owned());
        } else {
            normalized.duplicates += 1;
        }
    }
    Ok(normalized)
}

pub(crate) fn analyze(
    left: &str,
    right: &str,
    mode: SetMode,
    trim: bool,
    case_insensitive: bool,
    ignore_empty: bool,
) -> Result<SetsResult, EngineError> {
    let left = normalize(left, trim, case_insensitive, ignore_empty, MAX_ROWS)?;
    let right = normalize(
        right,
        trim,
        case_insensitive,
        ignore_empty,
        MAX_ROWS - left.lines,
    )?;
    let present = |set: &NormalizedSet, value: &str| {
        set.keys.contains(&comparison_key(value, case_insensitive))
    };
    let items = match mode {
        SetMode::Intersection => left
            .items
            .iter()
            .filter(|value| present(&right, value))
            .cloned()
            .collect(),
        SetMode::Union => left
            .items
            .iter()
            .chain(right.items.iter().filter(|value| !present(&left, value)))
            .cloned()
            .collect(),
        SetMode::LeftOnly => left
            .items
            .iter()
            .filter(|value| !present(&right, value))
            .cloned()
            .collect(),
        SetMode::RightOnly => right
            .items
            .iter()
            .filter(|value| !present(&left, value))
            .cloned()
            .collect(),
        SetMode::SymmetricDifference => left
            .items
            .iter()
            .filter(|value| !present(&right, value))
            .chain(right.items.iter().filter(|value| !present(&left, value)))
            .cloned()
            .collect::<Vec<_>>(),
    };

    Ok(SetsResult {
        mode,
        left_lines: left.lines,
        right_lines: right.lines,
        left_unique: left.items.len(),
        right_unique: right.items.len(),
        left_duplicates: left.duplicates,
        right_duplicates: right.duplicates,
        count: items.len(),
        items,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sets(left: &str, right: &str, mode: SetMode) -> SetsResult {
        analyze(left, right, mode, true, false, true).unwrap()
    }

    #[test]
    fn all_operations_preserve_input_order_and_remove_duplicates() {
        let left = "c\na\nc\nb\n";
        let right = "b\nd\na\nd\n";
        assert_eq!(
            sets(left, right, SetMode::Union).items,
            ["c", "a", "b", "d"]
        );
        assert_eq!(sets(left, right, SetMode::Intersection).items, ["a", "b"]);
        assert_eq!(sets(left, right, SetMode::LeftOnly).items, ["c"]);
        assert_eq!(sets(left, right, SetMode::RightOnly).items, ["d"]);
        assert_eq!(
            sets(left, right, SetMode::SymmetricDifference).items,
            ["c", "d"]
        );
        let result = sets(left, right, SetMode::Union);
        assert_eq!(result.left_duplicates, 1);
        assert_eq!(result.right_duplicates, 1);
    }

    #[test]
    fn trimming_unicode_lowercase_and_empty_options_are_independent() {
        let result = analyze(
            "  Äpfel \r\n\nTOKYO\n東京\n",
            "äpfel\ntokyo\n大阪",
            SetMode::Intersection,
            true,
            true,
            true,
        )
        .unwrap();
        assert_eq!(result.items, ["Äpfel", "TOKYO"]);
        assert_eq!(result.left_lines, 4);
        assert_eq!(result.left_unique, 3);
        let with_empty =
            analyze("a\n\n", "\n", SetMode::Intersection, false, false, false).unwrap();
        assert_eq!(with_empty.items, [""]);
        assert!(
            analyze(" a", "a", SetMode::Intersection, false, false, true)
                .unwrap()
                .items
                .is_empty()
        );
    }

    #[test]
    fn full_unicode_case_folding_is_not_silently_claimed() {
        let result = analyze("Straße", "STRASSE", SetMode::Intersection, true, true, true).unwrap();
        assert!(result.items.is_empty());
    }

    #[test]
    fn large_ids_are_never_converted_to_numbers() {
        let result = sets(
            "9007199254740992\n9007199254740993",
            "9007199254740993",
            SetMode::LeftOnly,
        );
        assert_eq!(result.items, ["9007199254740992"]);
    }

    #[test]
    fn combined_row_limit_prevents_double_sized_workloads() {
        let left = "a\n".repeat(MAX_ROWS / 2);
        let right = "b\n".repeat(MAX_ROWS / 2 + 1);
        assert_eq!(
            analyze(&left, &right, SetMode::Union, true, false, true)
                .unwrap_err()
                .code,
            "TOO_MANY_ROWS"
        );
        assert_eq!(sets("", "", SetMode::Union).count, 0);
    }
}

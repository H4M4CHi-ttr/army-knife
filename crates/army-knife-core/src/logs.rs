use std::collections::{BTreeMap, HashMap};

use regex::{Regex, RegexBuilder};
use serde::Serialize;

use crate::{EngineError, MAX_REGEX_BYTES, MAX_ROWS, shortened};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LogFrequency {
    text: String,
    count: usize,
    shortened: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LogsResult {
    total_lines: usize,
    matched_lines: usize,
    empty_lines: usize,
    levels: BTreeMap<&'static str, usize>,
    unique_lines: usize,
    top_lines: Vec<LogFrequency>,
    preview: Vec<String>,
    truncated_preview: bool,
}

pub(crate) fn analyze(
    text: &str,
    pattern: &str,
    case_insensitive: bool,
) -> Result<LogsResult, EngineError> {
    if pattern.len() > MAX_REGEX_BYTES {
        return Err(EngineError::new(
            "REGEX_TOO_LARGE",
            "Regex must be at most 4,096 UTF-8 bytes.",
        ));
    }
    let filter = if pattern.is_empty() {
        None
    } else {
        Some(
            RegexBuilder::new(pattern)
                .case_insensitive(case_insensitive)
                .size_limit(2 * 1024 * 1024)
                .dfa_size_limit(2 * 1024 * 1024)
                .nest_limit(64)
                .build()
                .map_err(|error| EngineError::new("INVALID_REGEX", error.to_string()))?,
        )
    };
    // A heuristic, not a parser for a specific logging framework. The first whole
    // English level token determines the bucket. Blank matching lines are "other".
    let level_pattern = Regex::new(
        r"(?i)(?:^|[^a-z])(trace|debug|info|warn(?:ing)?|error|fatal|critical)(?:[^a-z]|$)",
    )
    .map_err(|_| EngineError::new("INTERNAL_ERROR", "Level classifier could not initialize."))?;
    let mut levels: BTreeMap<&'static str, usize> =
        ["trace", "debug", "info", "warn", "error", "fatal", "other"]
            .map(|level| (level, 0))
            .into_iter()
            .collect();
    let mut total_lines = 0;
    let mut matched_lines = 0;
    let mut empty_lines = 0;
    let mut counts: HashMap<&str, (usize, usize)> = HashMap::new();
    let mut preview = Vec::new();

    for (index, line) in text.lines().enumerate() {
        if index == MAX_ROWS {
            return Err(EngineError::new(
                "TOO_MANY_ROWS",
                "Logs support at most 100,000 lines.",
            ));
        }
        total_lines += 1;
        let empty = line.trim().is_empty();
        if empty {
            empty_lines += 1;
        }
        if filter.as_ref().is_some_and(|regex| !regex.is_match(line)) {
            continue;
        }
        matched_lines += 1;
        let level = level_pattern
            .captures(line)
            .and_then(|captures| captures.get(1))
            .map(|value| match value.as_str().to_ascii_lowercase().as_str() {
                "trace" => "trace",
                "debug" => "debug",
                "info" => "info",
                "warn" | "warning" => "warn",
                "error" => "error",
                "fatal" | "critical" => "fatal",
                _ => "other",
            })
            .unwrap_or("other");
        *levels.entry(level).or_default() += 1;
        if !empty {
            counts.entry(line).or_insert((0, index)).0 += 1;
        }
        if preview.len() < 200 {
            preview.push(shortened(line, 500).0);
        }
    }
    let unique_lines = counts.len();
    let mut ranked: Vec<_> = counts.into_iter().collect();
    // First appearance breaks ties, so HashMap's randomized iteration never leaks
    // into the output. Unique lines are bounded by MAX_ROWS.
    ranked.sort_unstable_by(|left, right| {
        right
            .1
            .0
            .cmp(&left.1.0)
            .then_with(|| left.1.1.cmp(&right.1.1))
    });
    let top_lines = ranked
        .into_iter()
        .take(20)
        .map(|(line, (count, _))| {
            let (text, shortened) = shortened(line, 500);
            LogFrequency {
                text,
                count,
                shortened,
            }
        })
        .collect();

    Ok(LogsResult {
        total_lines,
        matched_lines,
        empty_lines,
        levels,
        unique_lines,
        top_lines,
        preview,
        truncated_preview: matched_lines > 200,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_levels_and_exact_repeated_lines() {
        let text = "[INFO] start\r\n[ERROR] failed\r\n[ERROR] failed\r\nwarning disk\r\ncritical stop\r\n\r\ninformation only\r\n";
        let result = analyze(text, "", false).unwrap();
        assert_eq!(result.total_lines, 7);
        assert_eq!(result.matched_lines, 7);
        assert_eq!(result.empty_lines, 1);
        assert_eq!(result.unique_lines, 5);
        assert_eq!(result.levels["info"], 1);
        assert_eq!(result.levels["error"], 2);
        assert_eq!(result.levels["warn"], 1);
        assert_eq!(result.levels["fatal"], 1);
        assert_eq!(result.levels["other"], 2);
        assert_eq!(result.top_lines[0].text, "[ERROR] failed");
        assert_eq!(result.top_lines[0].count, 2);
        assert_eq!(result.top_lines[1].text, "[INFO] start");
    }

    #[test]
    fn regex_filter_and_level_totals_use_matching_lines_only() {
        let result = analyze(
            "INFO 日本\nerror ネット\nERROR disk\nDEBUG x\n",
            "error",
            true,
        )
        .unwrap();
        assert_eq!(result.total_lines, 4);
        assert_eq!(result.matched_lines, 2);
        assert_eq!(result.levels["error"], 2);
        assert_eq!(result.levels["info"], 0);
        assert_eq!(result.preview, ["error ネット", "ERROR disk"]);
    }

    #[test]
    fn unsupported_and_oversized_regexes_fail_explicitly() {
        for pattern in ["(?=error)", r"(error)\1", "["] {
            assert_eq!(
                analyze("error", pattern, false).unwrap_err().code,
                "INVALID_REGEX"
            );
        }
        assert_eq!(
            analyze("", &"a".repeat(MAX_REGEX_BYTES + 1), false)
                .unwrap_err()
                .code,
            "REGEX_TOO_LARGE"
        );
        assert_eq!(
            analyze("", "a{100000000}", false).unwrap_err().code,
            "INVALID_REGEX"
        );
    }

    #[test]
    fn a_backtracking_trap_remains_a_bounded_regular_expression() {
        let text = format!("{}!", "a".repeat(100_000));
        let result = analyze(&text, "^(a+)+$", false).unwrap();
        assert_eq!(result.matched_lines, 0);
    }

    #[test]
    fn preview_is_bounded_without_truncating_counts() {
        let result = analyze(&"INFO x\n".repeat(205), "", false).unwrap();
        assert_eq!(result.matched_lines, 205);
        assert_eq!(result.preview.len(), 200);
        assert!(result.truncated_preview);
        assert_eq!(result.top_lines[0].count, 205);
    }

    #[test]
    fn line_limit_applies_even_when_filter_matches_nothing() {
        assert_eq!(
            analyze(&"a\n".repeat(MAX_ROWS + 1), "z", false)
                .unwrap_err()
                .code,
            "TOO_MANY_ROWS"
        );
        assert_eq!(analyze("", "", false).unwrap().total_lines, 0);
    }
}

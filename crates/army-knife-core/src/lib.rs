//! Deterministic, local-only processing. The module has no network or persistence APIs.

mod csv_profile;
mod logs;
mod sets;

use serde::{Deserialize, Serialize};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::wasm_bindgen;

pub(crate) const MAX_INPUT_BYTES: usize = 16 * 1024 * 1024;
pub(crate) const MAX_ROWS: usize = 100_000;
pub(crate) const MAX_COLUMNS: usize = 256;
pub(crate) const MAX_UNIQUE_PER_COLUMN: usize = 10_000;
pub(crate) const MAX_UNIQUE_TOTAL: usize = 100_000;
pub(crate) const MAX_REGEX_BYTES: usize = 4_096;

#[derive(Debug, Serialize)]
pub(crate) struct EngineError {
    code: &'static str,
    message: String,
}

impl EngineError {
    pub(crate) fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(tag = "operation", rename_all = "lowercase", deny_unknown_fields)]
enum Request {
    Csv {
        text: String,
        delimiter: String,
        header: bool,
        trim: bool,
    },
    Logs {
        text: String,
        pattern: String,
        #[serde(rename = "caseInsensitive")]
        case_insensitive: bool,
    },
    Sets {
        left: String,
        right: String,
        mode: sets::SetMode,
        trim: bool,
        #[serde(rename = "caseInsensitive")]
        case_insensitive: bool,
        #[serde(rename = "ignoreEmpty")]
        ignore_empty: bool,
    },
}

#[derive(Serialize)]
#[serde(tag = "operation", rename_all = "lowercase")]
enum Output {
    Csv(csv_profile::CsvResult),
    Logs(logs::LogsResult),
    Sets(sets::SetsResult),
}

#[derive(Serialize)]
#[serde(untagged)]
enum Envelope {
    Success { ok: bool, result: Output },
    Failure { ok: bool, error: EngineError },
}

fn process(request: Request) -> Result<Output, EngineError> {
    match request {
        Request::Csv {
            text,
            delimiter,
            header,
            trim,
        } => {
            ensure_input_size(text.len())?;
            let delimiter = match delimiter.as_str() {
                "," => b',',
                "\t" => b'\t',
                ";" => b';',
                "|" => b'|',
                _ => {
                    return Err(EngineError::new(
                        "INVALID_REQUEST",
                        "CSV delimiter must be comma, tab, semicolon, or pipe.",
                    ));
                }
            };
            csv_profile::profile(&text, delimiter, header, trim).map(Output::Csv)
        }
        Request::Logs {
            text,
            pattern,
            case_insensitive,
        } => {
            ensure_input_size(text.len().saturating_add(pattern.len()))?;
            logs::analyze(&text, &pattern, case_insensitive).map(Output::Logs)
        }
        Request::Sets {
            left,
            right,
            mode,
            trim,
            case_insensitive,
            ignore_empty,
        } => {
            ensure_input_size(left.len().saturating_add(right.len()))?;
            sets::analyze(&left, &right, mode, trim, case_insensitive, ignore_empty)
                .map(Output::Sets)
        }
    }
}

fn ensure_input_size(bytes: usize) -> Result<(), EngineError> {
    if bytes > MAX_INPUT_BYTES {
        Err(EngineError::new(
            "INPUT_TOO_LARGE",
            "Combined UTF-8 input must be at most 16 MiB.",
        ))
    } else {
        Ok(())
    }
}

pub(crate) fn shortened(text: &str, limit: usize) -> (String, bool) {
    let mut chars = text.chars();
    let mut result: String = chars.by_ref().take(limit).collect();
    let was_shortened = chars.next().is_some();
    if was_shortened {
        result.push('…');
    }
    (result, was_shortened)
}

/// Sole JS boundary. Every expected input failure is returned as a structured envelope.
/// JSON's escaping can expand an input character to six bytes, hence the outer bound.
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub fn run(request_json: &str) -> String {
    let result = if request_json.len() > MAX_INPUT_BYTES * 6 + 4096 {
        Err(EngineError::new(
            "INPUT_TOO_LARGE",
            "Request exceeds the input limit.",
        ))
    } else {
        serde_json::from_str::<Request>(request_json)
            .map_err(|error| EngineError::new("INVALID_REQUEST", error.to_string()))
            .and_then(process)
    };
    let envelope = match result {
        Ok(result) => Envelope::Success { ok: true, result },
        Err(error) => Envelope::Failure { ok: false, error },
    };
    serde_json::to_string(&envelope).unwrap_or_else(|_| {
        r#"{"ok":false,"error":{"code":"INTERNAL_ERROR","message":"Result serialization failed."}}"#
            .into()
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{Value, json};

    fn request(value: Value) -> Value {
        serde_json::from_str(&run(&value.to_string())).expect("valid response JSON")
    }

    #[test]
    fn malformed_and_unknown_requests_have_stable_errors() {
        for raw in ["{", "null", r#"{"operation":"network"}"#] {
            let response: Value = serde_json::from_str(&run(raw)).unwrap();
            assert_eq!(response["ok"], false);
            assert_eq!(response["error"]["code"], "INVALID_REQUEST");
        }
        let response = request(json!({
            "operation": "csv", "text": "a", "delimiter": ",",
            "header": true, "trim": false, "unexpected": true
        }));
        assert_eq!(response["error"]["code"], "INVALID_REQUEST");
    }

    #[test]
    fn invalid_delimiter_is_rejected_without_panicking() {
        let response = request(json!({
            "operation": "csv", "text": "a", "delimiter": "💥",
            "header": true, "trim": false
        }));
        assert_eq!(response["error"]["code"], "INVALID_REQUEST");
    }

    #[test]
    fn input_limit_counts_utf8_bytes() {
        let response = request(json!({
            "operation": "sets", "left": "あ".repeat(MAX_INPUT_BYTES / 3 + 1),
            "right": "", "mode": "union", "trim": false,
            "caseInsensitive": false, "ignoreEmpty": true
        }));
        assert_eq!(response["error"]["code"], "INPUT_TOO_LARGE");
    }

    #[test]
    fn result_has_operation_tag_and_keeps_large_ids_as_text() {
        let response = request(json!({
            "operation": "csv", "text": "id\n9007199254740993\n18446744073709551615",
            "delimiter": ",", "header": true, "trim": false
        }));
        assert_eq!(response["ok"], true);
        assert_eq!(response["result"]["operation"], "csv");
        assert_eq!(
            response["result"]["profiles"][0]["samples"][0],
            "9007199254740993"
        );
        assert_eq!(response["result"]["profiles"][0]["types"]["integer"], 2);
    }

    #[test]
    fn text_shortening_respects_unicode_boundaries() {
        assert_eq!(shortened("a日本🙂b", 3), ("a日本…".into(), true));
        assert_eq!(shortened("🙂", 3), ("🙂".into(), false));
    }
}

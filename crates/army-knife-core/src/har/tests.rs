use super::*;
use serde_json::{Value, json};

fn entry(url: &str, status: u16, time: f64) -> Value {
    json!({
        "request": {"method": "GET", "url": url},
        "response": {"status": status, "headersSize": 100, "bodySize": 400,
            "content": {"mimeType": "application/json; charset=utf-8", "size": 4000}},
        "time": time,
    })
}

fn document(entries: Vec<Value>) -> String {
    json!({"log": {"version": "1.2", "entries": entries}}).to_string()
}

fn report(entries: Vec<Value>) -> HarResult {
    analyze(&document(entries)).expect("valid HAR")
}

#[test]
fn profiles_responses_without_substituting_decoded_content_or_tls_timings() {
    let first = entry("https://API.example.test/a", 200, 80.5);
    let mut second = entry("https://api.example.test:8443/b", 500, 300.25);
    second["response"]["bodySize"] = json!(300);
    second["response"]["content"]["mimeType"] = json!("Application/JSON");
    second["timings"] = json!({"ssl": 40, "connect": 40, "send": 1, "wait": 250, "receive": 9.25});
    let mut cached = entry("https://static.example.test/a.css", 304, 20.0);
    cached["response"]["headersSize"] = json!(50);
    cached["response"]["bodySize"] = json!(0);
    cached["response"]["content"]["size"] = json!(90_000);
    cached["response"]["content"]["mimeType"] = json!("text/css");
    let unknown = json!({"request": {"method": "GET", "url": "data:text/plain,local"},
        "response": {"status": 0, "headersSize": -1, "bodySize": 0}});

    let result = report(vec![first, second, cached, unknown]);
    assert_eq!(result.requests, 4);
    assert_eq!(result.http_errors, 1);
    assert_eq!(result.unknown_status_requests, 1);
    assert_eq!(result.response_transfer.known_bytes, "950");
    assert_eq!(result.response_transfer.known_entries, 3);
    assert_eq!(result.response_transfer.unknown_entries, 1);
    assert_eq!(result.timing.known_requests, 3);
    assert_eq!(result.timing.unknown_requests, 1);
    assert_eq!(result.timing.total_ms, 400.75);
    assert_eq!(result.timing.average_ms, Some(400.75 / 3.0));
    assert_eq!(result.timing.max_ms, Some(300.25));
    assert_eq!(
        result
            .statuses
            .iter()
            .map(|value| value.status)
            .collect::<Vec<_>>(),
        [Some(200), Some(304), Some(500), None]
    );
    assert_eq!(result.hosts[0].key.as_deref(), Some("api.example.test"));
    assert_eq!(result.hosts[0].requests, 2);
    assert_eq!(result.hosts[0].http_errors, 1);
    assert_eq!(result.hosts[0].response_transfer.known_bytes, "900");
    assert_eq!(
        result.mime_types[0].key.as_deref(),
        Some("application/json")
    );
    assert_eq!(result.mime_types[0].requests, 2);
    assert_eq!(
        result
            .slowest
            .iter()
            .map(|row| row.entry_index)
            .collect::<Vec<_>>(),
        [1, 0, 2]
    );
    assert_eq!(result.slowest[0].transfer_bytes.as_deref(), Some("400"));
}

#[test]
fn unknown_sizes_and_timings_remain_distinct_from_measured_zero() {
    let mut unknown_header = entry("https://example.test/1", 200, 0.0);
    unknown_header["response"]["headersSize"] = json!(-1);
    unknown_header["response"]["_transferSize"] = json!(777);
    unknown_header.as_object_mut().unwrap().remove("time");
    unknown_header["timings"] = json!({"send": 1, "wait": 2, "receive": 3});
    let mut unknown_body = entry("https://example.test/2", 200, 0.0);
    unknown_body["response"]["bodySize"] = Value::Null;
    unknown_body["time"] = Value::Null;
    let missing = json!({"request":{"url":"https://example.test/3","method":"GET"},"response":{}});
    let mut zero = entry("https://example.test/4", 200, 0.0);
    zero["response"]["headersSize"] = json!(0);
    zero["response"]["bodySize"] = json!(0);
    let result = report(vec![unknown_header, unknown_body, missing, zero]);
    assert_eq!(result.response_transfer.known_bytes, "0");
    assert_eq!(result.response_transfer.known_entries, 1);
    assert_eq!(result.response_transfer.unknown_entries, 3);
    assert_eq!(result.timing.known_requests, 1);
    assert_eq!(result.timing.unknown_requests, 3);
    assert_eq!(result.timing.average_ms, Some(0.0));
    assert_eq!(result.slowest.len(), 1);
    assert_eq!(result.slowest[0].entry_index, 3);
    assert_eq!(result.slowest[0].transfer_bytes.as_deref(), Some("0"));
}

#[test]
fn handles_an_empty_capture_without_nan_averages_or_invented_groups() {
    let result = report(vec![]);
    assert_eq!(result.requests, 0);
    assert_eq!(result.response_transfer.known_bytes, "0");
    assert_eq!(result.response_transfer.unknown_entries, 0);
    assert_eq!(result.timing.total_ms, 0.0);
    assert!(result.timing.average_ms.is_none());
    assert!(result.timing.max_ms.is_none());
    assert!(result.statuses.is_empty());
    assert!(result.hosts.is_empty());
    assert!(result.mime_types.is_empty());
    assert!(result.slowest.is_empty());
}

#[test]
fn distinguishes_http_errors_from_unrecorded_statuses() {
    let mut entries: Vec<_> = [100, 199, 200, 399, 400, 599, 0]
        .into_iter()
        .map(|status| entry("https://example.test/", status, 0.0))
        .collect();
    let mut missing = entry("https://example.test/missing", 200, 0.0);
    missing["response"]
        .as_object_mut()
        .unwrap()
        .remove("status");
    entries.push(missing);
    let mut null = entry("https://example.test/null", 200, 0.0);
    null["response"]["status"] = Value::Null;
    entries.push(null);
    let result = report(entries);
    assert_eq!(result.http_errors, 2);
    assert_eq!(result.unknown_status_requests, 3);
    assert_eq!(result.statuses.last().unwrap().status, None);
    assert_eq!(result.statuses.last().unwrap().requests, 3);
}

#[test]
fn preserves_byte_counts_above_js_safe_integer_and_u64_total_ranges() {
    let mut first = entry("https://example.test/", 200, 1.0);
    first["response"]["headersSize"] = json!(1);
    first["response"]["bodySize"] = json!(u64::MAX);
    let mut second = first.clone();
    second["response"]["headersSize"] = json!(u64::MAX);
    let result = report(vec![first, second]);
    assert_eq!(result.response_transfer.known_bytes, "55340232221128654846");
    assert_eq!(
        result.slowest[0].transfer_bytes.as_deref(),
        Some("18446744073709551616")
    );
    assert_eq!(
        result.slowest[1].transfer_bytes.as_deref(),
        Some("36893488147419103230")
    );
    let serialized = serde_json::to_value(result).unwrap();
    assert!(serialized["responseTransfer"]["knownBytes"].is_string());
}

#[test]
fn exact_decimal_and_exponent_sizes_do_not_round_fractional_or_large_values() {
    for (raw, expected) in [
        ("9007199254740993.0", Some(9_007_199_254_740_993_u128)),
        ("1.8446744073709551615e19", Some(u128::from(u64::MAX))),
        ("2.5e1", Some(25)),
        ("0.0", Some(0)),
        ("-0", Some(0)),
        ("-1.000e0", None),
    ] {
        let number: Box<RawValue> = serde_json::from_str(raw).unwrap();
        assert_eq!(byte_number(Some(&number)), Ok(expected), "{raw}");
    }
    for raw in [
        "0.999999999999999999",
        "-1.000000000000000001",
        "18446744073709551616",
        "1e400",
        "-2",
        "1.5",
        "1e-9999",
    ] {
        let number: Box<RawValue> = serde_json::from_str(raw).unwrap();
        assert!(byte_number(Some(&number)).is_err(), "{raw}");
    }
}

#[test]
fn canonicalizes_idn_ipv6_and_ports_and_accepts_bom_without_network_access() {
    let input = format!(
        "\u{feff}{}",
        document(vec![
            entry("https://例え.テスト/path", 200, 1.0),
            entry("https://[2001:0db8:0:0:0:0:0:1]:8443/path", 200, 1.0),
            entry("file:///local/sample.txt", 200, 1.0),
        ])
    );
    let result = analyze(&input).unwrap();
    assert_eq!(
        result.hosts[0].key.as_deref(),
        Some("xn--r8jz45g.xn--zckzah")
    );
    assert_eq!(result.hosts[1].key.as_deref(), Some("[2001:db8::1]"));
    assert_eq!(result.hosts[2].key, None);
}

#[test]
fn skips_sensitive_unused_fields_and_removes_credentials_from_display_urls() {
    let mut value = entry(
        "https://user:SECRET_PASSWORD@example.test/a?keep=query#fragment",
        200,
        0.0,
    );
    value["request"]["headers"] = json!([{"name":"Authorization","value":"SECRET_HEADER"}]);
    value["request"]["cookies"] = json!([{"name":"session","value":"SECRET_COOKIE"}]);
    value["request"]["postData"] = json!({"text":"SECRET_REQUEST_BODY"});
    value["response"]["content"]["text"] = json!("SECRET_RESPONSE_BODY");
    value["_privateExtension"] = json!({"details":[{"content":"SECRET_EXTENSION"}]});
    let result = report(vec![value]);
    assert_eq!(result.slowest[0].url, "https://example.test/a?keep=query");
    let text = serde_json::to_string(&result).unwrap();
    assert!(!text.contains("SECRET"));
    assert!(!text.contains("fragment"));
}

#[test]
fn limits_ranked_output_but_aggregates_every_group_with_stable_ties() {
    let entries: Vec<_> = (0..25)
        .map(|index| {
            let mut value = entry(&format!("https://z{index}.example.test/"), 200, 10.0);
            value["response"]["content"]["mimeType"] = json!(format!("application/x-{index}"));
            value
        })
        .collect();
    let result = report(entries);
    assert_eq!(result.requests, 25);
    assert_eq!(result.response_transfer.known_bytes, "12500");
    assert_eq!(result.host_count, 25);
    assert_eq!(result.mime_type_count, 25);
    assert_eq!(result.omitted_hosts, 5);
    assert_eq!(result.omitted_mime_types, 5);
    assert_eq!(result.hosts.len(), 20);
    assert_eq!(result.mime_types.len(), 20);
    assert_eq!(result.slowest.len(), 20);
    for index in 0..20 {
        assert_eq!(result.slowest[index].entry_index, index);
        assert_eq!(
            result.hosts[index].key.as_deref(),
            Some(format!("z{index}.example.test").as_str())
        );
    }
}

#[test]
fn later_slow_requests_and_frequent_hosts_displace_lower_ranks() {
    let mut entries: Vec<_> = (0..25)
        .map(|index| {
            entry(
                &format!("https://x{index}.example.test/"),
                200,
                index as f64,
            )
        })
        .collect();
    entries.push(entry("https://x24.example.test/again", 500, 30.0));
    let result = report(entries);
    assert_eq!(result.hosts[0].key.as_deref(), Some("x24.example.test"));
    assert_eq!(result.hosts[0].requests, 2);
    assert_eq!(result.hosts[0].http_errors, 1);
    assert_eq!(result.slowest[0].entry_index, 25);
    assert_eq!(result.slowest[1].entry_index, 24);
    assert_eq!(result.slowest.last().unwrap().entry_index, 6);
}

#[test]
fn rejects_malformed_shapes_and_unsupported_versions() {
    for raw in [
        "{",
        "null",
        "[]",
        "{}",
        r#"{"log":null}"#,
        r#"{"log":{"version":"1.2"}}"#,
        r#"{"log":{"version":"1.2","entries":{}}}"#,
        r#"{"log":{"entries":[]}}"#,
        r#"{"log":{"version":"1.1","entries":[]}}"#,
        r#"{"log":{"version":"2.0","entries":[]}}"#,
    ] {
        assert_eq!(analyze(raw).unwrap_err().code, "INVALID_HAR", "{raw}");
    }
    for value in [
        json!(null),
        json!({}),
        json!({"request":{},"response":{}}),
        json!({"request":{"url":"relative/path","method":"GET"},"response":{}}),
        json!({"request":{"url":"https://example.test","method":"GET invalid"},"response":{}}),
    ] {
        assert_eq!(
            analyze(&document(vec![value])).unwrap_err().code,
            "INVALID_HAR"
        );
    }
}

#[test]
fn rejects_wrong_types_negative_sizes_fractional_statuses_and_invalid_time() {
    for (pointer, invalid) in [
        ("/response/headersSize", json!(-2)),
        ("/response/bodySize", json!(0.5)),
        ("/response/bodySize", json!("400")),
        (
            "/response/bodySize",
            json!({"$serde_json::private::Number": "400"}),
        ),
        ("/response/status", json!(-1)),
        ("/response/status", json!(200.5)),
        ("/response/status", json!(99)),
        ("/response/status", json!(600)),
        ("/time", json!(-1)),
        ("/time", json!("2.5")),
        ("/time", json!(u64::MAX)),
        ("/response/content", json!([])),
    ] {
        let mut value = entry("https://example.test/", 200, 10.0);
        *value.pointer_mut(pointer).unwrap() = invalid;
        assert_eq!(
            analyze(&document(vec![value])).unwrap_err().code,
            "INVALID_HAR",
            "{pointer}"
        );
    }
}

#[test]
fn rejects_nonfinite_numbers_instead_of_serializing_nan_or_infinity() {
    let base = document(vec![entry("https://example.test/", 200, 5.0)]);
    for raw in ["NaN", "Infinity", "-Infinity", "1e400", "-1e400"] {
        let text = base.replace("\"time\":5.0", &format!("\"time\":{raw}"));
        assert_ne!(text, base);
        assert_eq!(analyze(&text).unwrap_err().code, "INVALID_HAR", "{raw}");
    }
}

#[test]
fn bounds_field_lengths_and_shortens_display_urls() {
    let mut value = entry(
        &format!("https://example.test/{}", "a".repeat(1_000)),
        200,
        1.0,
    );
    let result = report(vec![value.clone()]);
    assert!(result.slowest[0].url_shortened);
    assert_eq!(result.slowest[0].url.chars().count(), 501);
    assert!(result.slowest[0].url.ends_with('…'));
    value["request"]["url"] = json!(format!(
        "https://example.test/{}",
        "a".repeat(MAX_URL_BYTES)
    ));
    assert_eq!(
        analyze(&document(vec![value])).unwrap_err().code,
        "INVALID_HAR"
    );
    for (pointer, max) in [
        ("/request/method", MAX_METHOD_BYTES),
        ("/response/content/mimeType", MAX_MIME_BYTES),
    ] {
        let mut value = entry("https://example.test/", 200, 0.0);
        *value.pointer_mut(pointer).unwrap() = json!("x".repeat(max + 1));
        assert_eq!(
            analyze(&document(vec![value])).unwrap_err().code,
            "INVALID_HAR"
        );
    }
}

#[test]
fn accepts_100000_entries_and_rejects_the_next_one_while_streaming() {
    let minimal = r#"{"request":{"url":"https://x.test/","method":"GET"},"response":{}}"#;
    let entries = vec![minimal; MAX_ROWS].join(",");
    let text = format!(r#"{{"log":{{"version":"1.2","entries":[{entries}]}}}}"#);
    assert_eq!(analyze(&text).unwrap().requests, MAX_ROWS);
    let too_many = format!(r#"{{"log":{{"version":"1.2","entries":[{entries},{minimal}]}}}}"#);
    assert_eq!(analyze(&too_many).unwrap_err().code, "TOO_MANY_ROWS");
}

#[test]
fn enforces_the_utf8_input_limit_before_parsing() {
    let huge = "あ".repeat(crate::MAX_INPUT_BYTES / 3 + 1);
    assert_eq!(analyze(&huge).unwrap_err().code, "INPUT_TOO_LARGE");
}

#[test]
fn rejects_duplicate_selected_fields_instead_of_accepting_conflicting_results() {
    let raw = r#"{"log":{"version":"1.2","entries":[{"request":{"method":"GET","url":"https://example.test/"},"response":{"status":200,"status":500}}]}}"#;
    assert_eq!(analyze(raw).unwrap_err().code, "INVALID_HAR");
}

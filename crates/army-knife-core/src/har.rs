//! HAR 1.2 performance summaries. Recorded URLs are parsed as data, never fetched.
//! Reference: https://www.softwareishard.com/blog/har-12-spec/
//! Only the fields needed for analysis are retained; cookies, bodies, and headers
//! are skipped by serde. This is an analyzer, not a complete HAR schema validator.

use std::collections::BTreeMap;
use std::fmt;

use serde::de::{self, IgnoredAny, SeqAccess, Visitor};
use serde::{Deserialize, Deserializer, Serialize};
use serde_json::value::RawValue;
use url::Url;

use crate::{EngineError, MAX_ROWS, ensure_input_size, shortened};

const MAX_GROUPS: usize = 20;
const MAX_SLOWEST: usize = 20;
const MAX_URL_BYTES: usize = 65_536;
const MAX_METHOD_BYTES: usize = 64;
const MAX_MIME_BYTES: usize = 1_024;
const MAX_SAFE_INTEGER: f64 = 9_007_199_254_740_991.0;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HarByteSummary {
    known_bytes: String,
    known_entries: usize,
    unknown_entries: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HarTimingSummary {
    known_requests: usize,
    unknown_requests: usize,
    total_ms: f64,
    average_ms: Option<f64>,
    max_ms: Option<f64>,
}

#[derive(Debug, Serialize)]
pub(crate) struct HarStatusCount {
    status: Option<u16>,
    requests: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HarGroup {
    key: Option<String>,
    requests: usize,
    http_errors: usize,
    response_transfer: HarByteSummary,
    timing: HarTimingSummary,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HarSlowRequest {
    entry_index: usize,
    method: String,
    url: String,
    url_shortened: bool,
    host: Option<String>,
    status: Option<u16>,
    mime_type: Option<String>,
    time_ms: f64,
    transfer_bytes: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HarResult {
    requests: usize,
    http_errors: usize,
    unknown_status_requests: usize,
    response_transfer: HarByteSummary,
    timing: HarTimingSummary,
    statuses: Vec<HarStatusCount>,
    hosts: Vec<HarGroup>,
    mime_types: Vec<HarGroup>,
    host_count: usize,
    mime_type_count: usize,
    omitted_hosts: usize,
    omitted_mime_types: usize,
    slowest: Vec<HarSlowRequest>,
}

#[derive(Deserialize)]
struct HarDocument {
    log: HarLog,
}

#[derive(Deserialize)]
struct HarLog {
    version: String,
    #[serde(deserialize_with = "analyze_entries")]
    entries: Analysis,
}

#[derive(Deserialize)]
struct HarEntry {
    time: Option<Box<RawValue>>,
    request: RequestDetails,
    response: ResponseDetails,
}

#[derive(Deserialize)]
struct RequestDetails {
    method: String,
    url: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResponseDetails {
    status: Option<Box<RawValue>>,
    headers_size: Option<Box<RawValue>>,
    body_size: Option<Box<RawValue>>,
    content: Option<ContentDetails>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ContentDetails {
    mime_type: Option<String>,
}

#[derive(Default)]
struct ByteAccumulator {
    known_bytes: u128,
    known_entries: usize,
    unknown_entries: usize,
}

impl ByteAccumulator {
    fn observe(&mut self, bytes: Option<u128>) {
        if let Some(bytes) = bytes {
            // Each component fits u64 and there are at most 100,000 entries.
            // Their sum is bounded well below u128::MAX and is serialized as text.
            self.known_bytes += bytes;
            self.known_entries += 1;
        } else {
            self.unknown_entries += 1;
        }
    }

    fn finish(self) -> HarByteSummary {
        HarByteSummary {
            known_bytes: self.known_bytes.to_string(),
            known_entries: self.known_entries,
            unknown_entries: self.unknown_entries,
        }
    }
}

#[derive(Default)]
struct TimingAccumulator {
    known_requests: usize,
    unknown_requests: usize,
    total_ms: f64,
    correction: f64,
    max_ms: Option<f64>,
}

impl TimingAccumulator {
    fn observe(&mut self, time: Option<f64>) {
        if let Some(time) = time {
            self.known_requests += 1;
            // Compensated addition keeps fractional milliseconds useful in long traces.
            let corrected = time - self.correction;
            let next = self.total_ms + corrected;
            self.correction = (next - self.total_ms) - corrected;
            self.total_ms = next;
            self.max_ms = Some(self.max_ms.map_or(time, |previous| previous.max(time)));
        } else {
            self.unknown_requests += 1;
        }
    }

    fn finish(self) -> HarTimingSummary {
        HarTimingSummary {
            known_requests: self.known_requests,
            unknown_requests: self.unknown_requests,
            total_ms: self.total_ms,
            average_ms: (self.known_requests > 0)
                .then(|| self.total_ms / self.known_requests as f64),
            max_ms: self.max_ms,
        }
    }
}

#[derive(Default)]
struct GroupAccumulator {
    first_index: usize,
    requests: usize,
    http_errors: usize,
    transfer: ByteAccumulator,
    timing: TimingAccumulator,
}

impl GroupAccumulator {
    fn observe(&mut self, index: usize, error: bool, bytes: Option<u128>, time: Option<f64>) {
        if self.requests == 0 {
            self.first_index = index;
        }
        self.requests += 1;
        self.http_errors += usize::from(error);
        self.transfer.observe(bytes);
        self.timing.observe(time);
    }

    fn finish(self, key: Option<String>) -> HarGroup {
        HarGroup {
            key,
            requests: self.requests,
            http_errors: self.http_errors,
            response_transfer: self.transfer.finish(),
            timing: self.timing.finish(),
        }
    }
}

#[derive(Default)]
struct Analysis {
    requests: usize,
    http_errors: usize,
    transfer: ByteAccumulator,
    timing: TimingAccumulator,
    statuses: BTreeMap<Option<u16>, usize>,
    // At most two keys per entry, each bounded by its field limit and the total
    // 16 MiB input limit. These maps retain metadata, never full HAR entries.
    hosts: BTreeMap<Option<String>, GroupAccumulator>,
    mime_types: BTreeMap<Option<String>, GroupAccumulator>,
    slowest: Vec<HarSlowRequest>,
}

impl Analysis {
    fn observe(&mut self, entry: HarEntry) -> Result<(), EngineError> {
        let index = self.requests;
        let invalid = |message: &str| invalid_entry(index, message);
        if entry.request.url.len() > MAX_URL_BYTES {
            return Err(invalid("request.url exceeds 65,536 UTF-8 bytes."));
        }
        if entry.request.method.is_empty()
            || entry.request.method.len() > MAX_METHOD_BYTES
            || !entry.request.method.bytes().all(is_http_token)
        {
            return Err(invalid(
                "request.method must be an HTTP token of 1–64 ASCII bytes.",
            ));
        }
        let mut url = Url::parse(&entry.request.url)
            .map_err(|_| invalid("request.url must be a valid absolute URL."))?;
        let host = url.host_str().map(str::to_ascii_lowercase);
        let mime_type = match entry.response.content.and_then(|content| content.mime_type) {
            Some(value) => {
                if value.len() > MAX_MIME_BYTES {
                    return Err(invalid(
                        "response.content.mimeType exceeds 1,024 UTF-8 bytes.",
                    ));
                }
                let media_type = value.split(';').next().unwrap_or("").trim();
                (!media_type.is_empty()).then(|| media_type.to_ascii_lowercase())
            }
            None => None,
        };
        let status = status_number(entry.response.status.as_deref()).map_err(invalid)?;
        let time = duration_number(entry.time.as_deref()).map_err(invalid)?;
        let headers = byte_number(entry.response.headers_size.as_deref()).map_err(|_| {
            invalid("response.headersSize must be a nonnegative integer, -1, or null.")
        })?;
        let body = byte_number(entry.response.body_size.as_deref()).map_err(|_| {
            invalid("response.bodySize must be a nonnegative integer, -1, or null.")
        })?;
        let transfer = headers.zip(body).map(|(headers, body)| headers + body);
        let error = status.is_some_and(|status| (400..=599).contains(&status));

        self.requests += 1;
        self.http_errors += usize::from(error);
        self.transfer.observe(transfer);
        self.timing.observe(time);
        *self.statuses.entry(status).or_default() += 1;
        self.hosts
            .entry(host.clone())
            .or_default()
            .observe(index, error, transfer, time);
        self.mime_types
            .entry(mime_type.clone())
            .or_default()
            .observe(index, error, transfer, time);

        if let Some(time) = time {
            let enters_top = self.slowest.len() < MAX_SLOWEST
                || self.slowest.last().is_some_and(|last| time > last.time_ms);
            if enters_top {
                // Passwords/usernames and fragments are not needed to locate a slow
                // resource. Keep query strings as recorded; all output stays local.
                let _ = url.set_username("");
                let _ = url.set_password(None);
                url.set_fragment(None);
                let (url, url_shortened) = shortened(url.as_str(), 500);
                self.slowest.push(HarSlowRequest {
                    entry_index: index,
                    method: entry.request.method,
                    url,
                    url_shortened,
                    host,
                    status,
                    mime_type,
                    time_ms: time,
                    transfer_bytes: transfer.map(|bytes| bytes.to_string()),
                });
                self.slowest.sort_by(|left, right| {
                    right
                        .time_ms
                        .total_cmp(&left.time_ms)
                        .then_with(|| left.entry_index.cmp(&right.entry_index))
                });
                self.slowest.truncate(MAX_SLOWEST);
            }
        }
        Ok(())
    }

    fn finish(self) -> HarResult {
        let unknown_status_requests = self.statuses.get(&None).copied().unwrap_or(0);
        let mut statuses: Vec<_> = self
            .statuses
            .into_iter()
            .map(|(status, requests)| HarStatusCount { status, requests })
            .collect();
        statuses.sort_by_key(|group| group.status.unwrap_or(u16::MAX));
        let host_count = self.hosts.len();
        let mime_type_count = self.mime_types.len();
        HarResult {
            requests: self.requests,
            http_errors: self.http_errors,
            unknown_status_requests,
            response_transfer: self.transfer.finish(),
            timing: self.timing.finish(),
            statuses,
            hosts: top_groups(self.hosts),
            mime_types: top_groups(self.mime_types),
            host_count,
            mime_type_count,
            omitted_hosts: host_count.saturating_sub(MAX_GROUPS),
            omitted_mime_types: mime_type_count.saturating_sub(MAX_GROUPS),
            slowest: self.slowest,
        }
    }
}

fn top_groups(groups: BTreeMap<Option<String>, GroupAccumulator>) -> Vec<HarGroup> {
    let mut groups: Vec<_> = groups.into_iter().collect();
    groups.sort_by(|(_, left), (_, right)| {
        right
            .requests
            .cmp(&left.requests)
            .then_with(|| left.first_index.cmp(&right.first_index))
    });
    groups
        .into_iter()
        .take(MAX_GROUPS)
        .map(|(key, group)| group.finish(key))
        .collect()
}

fn invalid_entry(index: usize, message: &str) -> EngineError {
    EngineError::new("INVALID_HAR", format!("HAR entry {}: {message}", index + 1))
}

fn is_http_token(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || b"!#$%&'*+-.^_`|~".contains(&byte)
}

fn byte_number(value: Option<&RawValue>) -> Result<Option<u128>, ()> {
    let Some(value) = value else {
        return Ok(None);
    };
    // RawValue preserves the literal JSON token and its type, including exponent
    // and decimal forms. Never round sizes through f64 or coerce JSON objects.
    let raw = value.get();
    if raw.len() > 128
        || !raw
            .as_bytes()
            .first()
            .is_some_and(|byte| byte.is_ascii_digit() || *byte == b'-')
    {
        return Err(());
    }
    let negative = raw.starts_with('-');
    let unsigned = raw.strip_prefix('-').unwrap_or(raw);
    let (mantissa, exponent) = match unsigned.find(['e', 'E']) {
        Some(index) => (
            &unsigned[..index],
            unsigned[index + 1..].parse::<i32>().map_err(|_| ())?,
        ),
        None => (unsigned, 0),
    };
    let fractional_digits = mantissa
        .find('.')
        .map_or(0, |index| mantissa.len() - index - 1);
    let digits = mantissa.replace('.', "");
    let significant = digits.trim_start_matches('0');
    if significant.is_empty() {
        return Ok(Some(0));
    }
    let scale = exponent.checked_sub(fractional_digits as i32).ok_or(())?;
    let amount = if scale >= 0 {
        if significant.len() + scale as usize > 20 {
            return Err(());
        }
        significant.parse::<u128>().map_err(|_| ())? * 10_u128.pow(scale as u32)
    } else {
        let tail = scale.unsigned_abs() as usize;
        if tail >= significant.len()
            || !significant.as_bytes()[significant.len() - tail..]
                .iter()
                .all(|byte| *byte == b'0')
        {
            return Err(());
        }
        significant[..significant.len() - tail]
            .parse::<u128>()
            .map_err(|_| ())?
    };
    if amount > u128::from(u64::MAX) {
        return Err(());
    }
    if negative {
        if amount == 1 { Ok(None) } else { Err(()) }
    } else {
        Ok(Some(amount))
    }
}

fn status_number(value: Option<&RawValue>) -> Result<Option<u16>, &'static str> {
    let status = byte_number(value)
        .map_err(|_| "response.status must be 0, an integer from 100 to 599, or null.")?;
    match status {
        None if value.is_none() => Ok(None),
        Some(0) => Ok(None),
        Some(value) if (100..=599).contains(&value) => Ok(Some(value as u16)),
        _ => Err("response.status must be 0, an integer from 100 to 599, or null."),
    }
}

fn duration_number(value: Option<&RawValue>) -> Result<Option<f64>, &'static str> {
    let Some(value) = value else {
        return Ok(None);
    };
    let value = value
        .get()
        .parse::<f64>()
        .ok()
        .filter(|value| value.is_finite() && (0.0..=MAX_SAFE_INTEGER).contains(value))
        .ok_or("time must be finite, nonnegative milliseconds no greater than 9007199254740991.")?;
    Ok(Some(if value == 0.0 { 0.0 } else { value }))
}

fn analyze_entries<'de, D>(deserializer: D) -> Result<Analysis, D::Error>
where
    D: Deserializer<'de>,
{
    struct EntriesVisitor;
    impl<'de> Visitor<'de> for EntriesVisitor {
        type Value = Analysis;
        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a HAR log.entries array")
        }
        fn visit_seq<A>(self, mut entries: A) -> Result<Self::Value, A::Error>
        where
            A: SeqAccess<'de>,
        {
            let mut analysis = Analysis::default();
            loop {
                if analysis.requests == MAX_ROWS {
                    if entries.next_element::<IgnoredAny>()?.is_some() {
                        return Err(de::Error::custom(
                            "TOO_MANY_ROWS: HAR supports at most 100,000 entries.",
                        ));
                    }
                    break;
                }
                let Some(entry) = entries.next_element::<HarEntry>()? else {
                    break;
                };
                analysis
                    .observe(entry)
                    .map_err(|error| de::Error::custom(error.message))?;
            }
            Ok(analysis)
        }
    }
    deserializer.deserialize_seq(EntriesVisitor)
}

pub(crate) fn analyze(text: &str) -> Result<HarResult, EngineError> {
    ensure_input_size(text.len())?;
    let text = text.strip_prefix('\u{feff}').unwrap_or(text);
    let document: HarDocument = serde_json::from_str(text).map_err(|error| {
        let message = error.to_string();
        let code = if message.starts_with("TOO_MANY_ROWS:") {
            "TOO_MANY_ROWS"
        } else {
            "INVALID_HAR"
        };
        EngineError::new(code, format!("Invalid HAR: {message}"))
    })?;
    if document.log.version != "1.2" {
        return Err(EngineError::new(
            "INVALID_HAR",
            "Expected HAR log.version to be \"1.2\".",
        ));
    }
    Ok(document.log.entries.finish())
}

#[cfg(test)]
mod tests;

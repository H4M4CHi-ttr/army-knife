import { describe, expect, it } from "vite-plus/test";
import { ACCEPT_LIMITS, formatAcceptQuality, previewHttpAccept } from "./http-accept";
import { ACCEPT_SAMPLE, ACCEPT_OFFERS_SAMPLE } from "./http-accept-sample";
const run = (accept: string, offers = "text/plain", absent = false) => previewHttpAccept(accept, offers, absent);
const quality = (accept: string, offers = "text/plain") => run(accept, offers).offers[0]!.quality;

describe("HTTP Accept bounded negotiation model", () => {
  it("evaluates offers before ranking, excludes specific q=0, uses offered-order ties", () => {
    const report = run(ACCEPT_SAMPLE, ACCEPT_OFFERS_SAMPLE);
    expect(report.offers.map(o => [o.quality, o.governingRanges, o.reason])).toEqual([
      [0, [2], "excluded"], [500, [1], "matched"], [800, [4], "matched"], [1000, [3], "matched"], [100, [5], "matched"],
    ]);
    expect(report.rankedOfferIndexes).toEqual([4, 3, 2, 5]); expect(report.selectedOfferIndex).toBe(4);
    expect(run("*/*", "text/plain\napplication/json").rankedOfferIndexes).toEqual([1, 2]);
    expect(run("text/plain;q=0, */*", "text/plain").selectedOfferIndex).toBeNull();
  });
  it("distinguishes absent, present-empty, whitespace and unmatched values", () => {
    expect(run("", "text/plain", true).offers[0]).toMatchObject({ quality: 1000, reason: "absent", governingRanges: [] });
    expect(run("\nBAD".repeat(9000), "text/plain", true).ranges).toEqual([]);
    for (const value of ["", " \t", ",,", "image/png"]) {
      expect(run(value).offers[0]).toMatchObject({ quality: 0, reason: "unmatched", governingRanges: [] });
      expect(run(value).selectedOfferIndex).toBeNull();
    }
  });
  it("follows most specific matching type, then matching parameter count, before q", () => {
    const report = run('text/*;q=0.3, text/plain;q=0.7, text/plain;format=flowed, text/plain;format=fixed;q=0.4, */*;q=0.5',
      'text/plain;format=flowed\ntext/plain\ntext/html\nimage/jpeg\ntext/plain;format=fixed');
    expect(report.offers.map(o => o.quality)).toEqual([1000, 700, 300, 500, 400]);
    expect(quality('text/*;a=b;c=d;q=1, text/plain;q=0.1', 'text/plain;a=b;c=d')).toBe(100);
    expect(quality('text/plain;q=1, text/plain;a=b;q=0, */*', 'text/plain;a=b;x=y')).toBe(0);
  });
  it("unquotes parameters, treats charset case-insensitively, other values literally, accepts q anywhere", () => {
    expect(quality('TEXT/PLAIN;Q=0.123;CHARSET="UTF-8"', 'Text/Plain;charset=utf-8')).toBe(123);
    expect(quality('text/plain;profile="a\\\"b;c,d\\\\e"', 'text/plain;PROFILE="a\\\"b;c,d\\\\e";extra=ok')).toBe(1000);
    expect(quality('text/plain;profile="X"', 'text/plain;profile=x')).toBe(0);
    expect(quality('text/plain;charset=utf8', 'text/plain;charset=utf-8')).toBe(0);
    expect(quality('text/plain;charset=utf-8')).toBe(0);
    expect(quality('text/plain;x=""', 'text/plain;x=""')).toBe(1000);
    expect(quality('text/plain;__proto__=x', 'text/plain;__proto__=x')).toBe(1000);
    expect(quality('text/plain;q=0.3;format=flowed', 'text/plain;format=flowed')).toBe(300);
    expect(quality('application/json', 'application/problem+json')).toBe(0);
  });
  it("rejects conflicting equally specific weights without arbitrarily resolving a tie", () => {
    for (const header of ['text/plain;q=0.1, text/plain;q=0.2', 'text/plain;a=b;q=0.1, text/plain;c=d;q=0.2'])
      expect(() => run(header, 'text/plain;a=b;c=d')).toThrow('ACCEPT_AMBIGUOUS');
    expect(run('text/plain;q=0.1, TEXT/PLAIN;q=0.100').offers[0]!.governingRanges).toEqual([1, 2]);
    expect(quality('text/*;q=0.1,text/*;q=0.2,text/plain;q=0.3')).toBe(300);
  });
  it.each(['0', '0.', '0.0', '0.00', '0.000', '0.001', '0.01', '0.1', '0.999', '1', '1.', '1.0', '1.00', '1.000'])("accepts exact q grammar %s", value => {
    expect(quality(`text/plain;q=${value}`)).toBe(Math.round(Number(value) * 1000));
  });
  it("round-trips all 1,001 exact weights without floating-point quality calculation", () => {
    for (let q = 0; q <= 1000; q++) expect(quality(`text/plain;q=${formatAcceptQuality(q)}`)).toBe(q);
  });
  it.each(['.5', '00', '01', '1.001', '0.0000', '1.0000', '-0', '+1', '2', '1e0', 'NaN', '"0.5"'])("rejects invalid q %s", value => {
    expect(() => quality(`text/plain;q=${value}`)).toThrow('ACCEPT_QUALITY');
  });
  it.each(['Accept: text/plain', 'text /plain', 'text/ plain', 'text/plain; a =b', 'text/plain;a= b', 'text/plain;flag', 'text/plain;a=', 'text/plain;a="unclosed', 'text/plain;a="x"tail', 'text/plain;a=a\\b', 'text/plain\n', 'text/plain\r\n', 'text/plain;v="\u007f"', 'text/plain;v="é"', 'text/plain;v="\u0000"', 'text/plain;v="x\\"'])("rejects unsupported/malformed ASCII input %j", value => {
    expect(() => run(value)).toThrow('ACCEPT_SYNTAX');
  });
  it.each(['text/plain;q=1;Q=1', 'text/plain;a=x;A=x'])("rejects duplicate parameters %s", value => {
    expect(() => run(value)).toThrow('ACCEPT_DUPLICATE');
  });
  it.each(['*/json', 'application/*+json', 'te*xt/plain'])("rejects unsupported wildcards %s", value => {
    expect(() => run(value)).toThrow('ACCEPT_WILDCARD');
  });
  it("rejects wildcard/weighted offers, blank offers, bare CR and combined offered values", () => {
    expect(() => run('*/*', '*/*')).toThrow('ACCEPT_WILDCARD');
    expect(() => run('*/*', 'text/*')).toThrow('ACCEPT_WILDCARD');
    expect(() => run('*/*', 'text/plain;q=1')).toThrow('ACCEPT_QUALITY');
    expect(() => run('*/*', ' \t\n')).toThrow('ACCEPT_OFFERS');
    for (const value of ['text/plain\rimage/png', 'text/plain, image/png', 'Content-Type: text/plain'])
      expect(() => run('*/*', value)).toThrow('ACCEPT_SYNTAX');
  });
  it("keeps recorded order, ignores bounded empty slots and accepts CRLF offer separators", () => {
    const report = run(', text/plain;;q=0.7; , , */* ,', '\r\n text/plain\r\n\t\r\nimage/png\r\n');
    expect(report.emptyAcceptSlots).toBe(3); expect(report.emptyOfferLines).toBe(3);
    expect(report.offers.map(o => o.source)).toEqual(['text/plain', 'image/png']);
    expect(report.ranges.map(r => r.index)).toEqual([1, 2]);
    expect(report.rankedOfferIndexes).toEqual([2, 1]);
  });
  it("enforces raw byte limits before trimming, also when data is only whitespace", () => {
    const padded = 'text/plain' + ' '.repeat(ACCEPT_LIMITS.bytes - 10);
    expect(run(padded, padded).offers).toHaveLength(1);
    expect(() => run(padded + ' ')).toThrow(expect.objectContaining({ code: 'INPUT_TOO_LARGE' }));
    expect(() => run('*/*', padded + ' ')).toThrow(expect.objectContaining({ code: 'INPUT_TOO_LARGE' }));
    expect(() => run(' '.repeat(8193))).toThrow(expect.objectContaining({ code: 'INPUT_TOO_LARGE' }));
    expect(() => run('é'.repeat(4097))).toThrow(expect.objectContaining({ code: 'INPUT_TOO_LARGE' }));
    expect(() => run('*/*', 'é'.repeat(4097))).toThrow(expect.objectContaining({ code: 'INPUT_TOO_LARGE' }));
  });
  it("enforces range, offer, parameter and empty-slot limits at exact boundaries", () => {
    expect(run(Array(32).fill('text/plain').join(',')).ranges).toHaveLength(32);
    expect(() => run(Array(33).fill('text/plain').join(','))).toThrow('ACCEPT_LIMIT');
    expect(run('*/*', Array(32).fill('text/plain').join('\n')).offers).toHaveLength(32);
    expect(() => run('*/*', Array(33).fill('text/plain').join('\n'))).toThrow('ACCEPT_LIMIT');
    expect(run('text/plain' + ','.repeat(63)).emptyAcceptSlots).toBe(63);
    expect(() => run('text/plain' + ','.repeat(64))).toThrow('ACCEPT_LIMIT');
    expect(run('*/*', 'text/plain' + '\n'.repeat(63)).emptyOfferLines).toBe(63);
    expect(() => run('*/*', 'text/plain' + '\n'.repeat(64))).toThrow('ACCEPT_LIMIT');
    const params = Array.from({ length: 16 }, (_, i) => `;p${i}=x`).join('');
    expect(run('text/plain' + params).ranges[0]!.parameters).toHaveLength(16);
    expect(() => run('text/plain' + params + ';q=1')).toThrow('ACCEPT_LIMIT');
    expect(() => run('*/*', 'text/plain' + params + ';x=y')).toThrow('ACCEPT_LIMIT');
    expect(run('text/plain' + ';'.repeat(31)).ranges).toHaveLength(1);
    expect(() => run('text/plain' + ';'.repeat(32))).toThrow('ACCEPT_LIMIT');
  });
  it("never interprets inert quoted values or emits input in fixed-code errors", () => {
    const source = 'text/plain;profile="<script>PRIVATE_ACCEPT_4819</script>"';
    expect(run(source, source).offers[0]!.source).toBe(source);
    try { run('PRIVATE_ACCEPT_4819: bad'); } catch (error) { expect(String(error)).toBe('ToolError: ACCEPT_SYNTAX'); }
  });
});

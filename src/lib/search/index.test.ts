import { describe, expect, it } from "vite-plus/test";
import { tools, type ToolId } from "../catalog";
import { messages } from "../../i18n";
import { createToolSearch, searchLabel, searchTools } from "./index";
import { searchIntents } from "./intents";

type Case = readonly [language: keyof typeof searchIntents, query: string, expected: ToolId];

const examples: readonly Case[] = [
  ["ja", "ブラウザの通信が遅い", "har"],
  ["ja", "本番環境と開発環境の設定", "env"],
  ["ja", "URLのクエリパラメータを編集", "url"],
  ["ja", "PostgreSQLのクエリのボトルネック", "explain"],
  ["ja", "CSVデータの空欄", "csv"],
  ["ja", "見えない変な文字", "unicode"],
  ["en", "slow browser network requests", "har"],
  ["en", "missing environment variables", "env"],
  ["en", "pretty print and format JSON", "json-format"],
  ["en", "intersection union and difference of sets", "sets"],
  ["en", "IP address range", "cidr"],
  ["en", "hidden characters in pasted text", "unicode"],
  ["zh-CN", "浏览器网络请求缓慢", "har"],
  ["zh-CN", "缺失的环境变量", "env"],
  ["zh-CN", "修改网址的查询参数", "url"],
  ["zh-CN", "查看PostgreSQL执行计划", "explain"],
  ["zh-CN", "CSV数据中的空值", "csv"],
  ["zh-CN", "两个列表的共同项目", "sets"],
  ["zh-TW", "瀏覽器網路請求緩慢", "har"],
  ["zh-TW", "遺漏的環境變數", "env"],
  ["zh-TW", "新增或移除URL參數", "url"],
  ["zh-TW", "查看PostgreSQL執行計畫", "explain"],
  ["zh-TW", "兩份清單的共同項目", "sets"],
  ["zh-TW", "檢查文字與背景顏色的可讀性", "contrast"],
  ["ko", "브라우저 네트워크 요청이 느린", "har"],
  ["ko", "누락된 환경 변수를", "env"],
  ["ko", "두 목록의 공통 항목", "sets"],
  ["ko", "IPv6 네트워크 접두사", "cidr"],
  ["ko", "JSON 문자열을 보기 좋게", "json-format"],
  ["ko", "글자와 배경색의 가독성", "contrast"],
];

function oldSearch(query: string, language: Case[0]) {
  const pack = messages[language] as Readonly<Record<string, string>>;
  const words = query.toLowerCase().trim().split(/\s+/);
  return tools.filter((tool) => {
    const haystack =
      (pack["tool." + tool.id + ".name"] ?? "") + " " +
      (pack["tool." + tool.id + ".description"] ?? "") + " " + tool.keywords;
    return words.every((word) => haystack.toLowerCase().includes(word));
  });
}

describe("local multilingual intent search", () => {
  it("indexes both flat and vue-i18n nested message keys", () => {
    expect(searchLabel({ "tool.har.name": "Network Wizard" }, "tool.har.name")).toBe("Network Wizard");
    expect(searchLabel({ tool: { har: { name: "Network Wizard" } } }, "tool.har.name")).toBe("Network Wizard");
    const search = createToolSearch(tools, [{
      language: "future", labels: { tool: { har: { name: "Network Wizard" } } }, intents: {},
    }]);
    expect(search("Network Wizard")[0]?.id).toBe("har");
  });

  it("has a complete intent pack for every published UI locale and tool", () => {
    expect(Object.keys(searchIntents).sort()).toEqual(["en", "ja", "ko", "zh-CN", "zh-TW"]);
    for (const pack of Object.values(searchIntents)) {
      expect(Object.keys(pack).sort()).toEqual(tools.map((tool) => tool.id).sort());
      for (const phrases of Object.values(pack)) {
        expect(phrases.length).toBeGreaterThanOrEqual(2);
        for (const phrase of phrases) expect(phrase.trim()).not.toBe("");
      }
    }
  });

  it.each(examples)("%s: %s => %s", (_language, query, expected) => {
    expect(searchTools(query)[0]?.id).toBe(expected);
  });

  it("compares top-1 and top-3 recall with the previous locale-only substring search", () => {
    const oldRanks = examples.map(([lang, query, expected]) =>
      oldSearch(query, lang).findIndex((tool) => tool.id === expected),
    );
    const newRanks = examples.map(([, query, expected]) =>
      searchTools(query).findIndex((tool) => tool.id === expected),
    );
    const recall = (ranks: readonly number[], k: number) =>
      ranks.filter((rank) => rank >= 0 && rank < k).length / ranks.length;
    console.info(
      "Intent search fixture (n=" + examples.length + "): " +
      "old R@1=" + recall(oldRanks, 1).toFixed(3) +
      " R@3=" + recall(oldRanks, 3).toFixed(3) +
      "; new R@1=" + recall(newRanks, 1).toFixed(3) +
      " R@3=" + recall(newRanks, 3).toFixed(3),
    );
    expect(recall(newRanks, 1)).toBeGreaterThanOrEqual(0.9);
    expect(recall(newRanks, 3)).toBeGreaterThanOrEqual(0.95);
    expect(recall(newRanks, 3)).toBeGreaterThan(recall(oldRanks, 3));
  });

  it("does not surface disabled tools and keeps the empty-query catalog order", () => {
    const enabled = tools.filter((tool) => !tool.devtoys);
    expect(searchTools("pretty print JSON", enabled).some((tool) => tool.id === "json-format"))
      .toBe(false);
    expect(searchTools("common items in two lists", enabled).some((tool) => tool.id === "sets"))
      .toBe(false);
    expect(searchTools("", enabled)).toEqual(enabled);
  });

  it("normalizes full-width text and matches multiple writing systems", () => {
    expect(searchTools("ＵＲＬのクエリパラメータを編集")[0]?.id).toBe("url");
    expect(searchTools("IPアドレスの範囲")[0]?.id).toBe("cidr");
    expect(searchTools("제로폭 문자")[0]?.id).toBe("unicode");
  });

  it("indexes a sixth language without changing the search engine or existing packs", () => {
    const spanish = createToolSearch(tools, [{
      language: "es",
      labels: {},
      intents: { har: ["buscar peticiones HTTP lentas"] },
    }]);
    expect(spanish("buscar peticiones HTTP lentas")[0]?.id).toBe("har");
    expect(spanish("")).toEqual(tools);
    const russian = createToolSearch(tools, [{
      language: "ru",
      labels: {},
      intents: {
        har: ["найти медленные сетевые запросы"],
        env: ["сравнить переменные окружения"],
      },
    }]);
    expect(russian("сетевые запросы")[0]?.id).toBe("har");
    expect(russian("переменные окружения")[0]?.id).toBe("env");
    expect(searchTools("ブラウザの通信が遅い")[0]?.id).toBe("har");
  });

  it("keeps queries in-memory; unrelated text does not match HAR", () => {
    searchTools("private query PRIVATE_INPUT_EXAMPLE");
    expect(searchTools("")).toHaveLength(tools.length);
    expect(searchTools("unrelated kumquat pineapple astronomy").some((tool) => tool.id === "har"))
      .toBe(false);
  });
});

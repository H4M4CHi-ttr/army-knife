import { describe, expect, it } from "vite-plus/test";
import { searchTools } from "./index";
describe("CIDR aggregation search", () => {
  it.each(["CIDR aggregation", "CIDR集約", "CIDR 网段聚合", "CIDR 網段彙整", "CIDR 대역 집약"])("finds exact union workflow: %s", query => {
    expect(searchTools(query)[0]?.id).toBe("cidr-aggregate");
  });
  it("keeps the existing single-prefix calculator for generic CIDR lookup", () => {
    expect(searchTools("CIDR")[0]?.id).toBe("cidr");
  });
});

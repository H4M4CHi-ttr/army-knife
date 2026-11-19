import { describe, expect, it } from "vite-plus/test";
import { searchTools } from "./index";

describe("Git branch catalogue search", () => {
  it.each(["Git branch name", "Gitブランチ名", "Git 分支名", "Git 브랜치명"])("finds the dedicated branch tool: %s", query => {
    expect(searchTools(query)[0]?.id).toBe("git-branch");
  });
  it.each([
    ["保留相同欄位名稱重複出現的網址參數", "url"],
    ["첫 번째 명단에는 있지만 두 번째에는 없는 이름 찾기", "sets"],
  ])("does not intercept unrelated existing intent: %s", (query, expected) => {
    expect(searchTools(query!)[0]?.id).toBe(expected);
  });
});

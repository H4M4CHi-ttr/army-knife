import { describe, expect, it } from "vite-plus/test";
import { applySymbolicMode, calculateUmask, describeMode, parseOctalMode } from "./chmod";
import { ToolError } from "./errors";

describe("chmod modes", () => {
  it.each<[number, string, string]>([
    [0o0000, "0000", "---------"],
    [0o0644, "0644", "rw-r--r--"],
    [0o0755, "0755", "rwxr-xr-x"],
    [0o4755, "4755", "rwsr-xr-x"],
    [0o2755, "2755", "rwxr-sr-x"],
    [0o1777, "1777", "rwxrwxrwt"],
    [0o4644, "4644", "rwSr--r--"],
    [0o2644, "2644", "rw-r-Sr--"],
    [0o1644, "1644", "rw-r--r-T"],
    [0o7000, "7000", "--S--S--T"],
    [0o7777, "7777", "rwsrwsrwt"],
  ])("describes %s with permissions and special-bit casing", (mode, octal, symbolic) => {
    expect(describeMode(mode)).toEqual({ mode, octal, symbolic });
  });

  it("round-trips every twelve-bit mode with a fixed four-digit representation", () => {
    for (let mode = 0; mode <= 0o7777; mode += 1) {
      const description = describeMode(mode);
      expect(description.octal).toHaveLength(4);
      expect(description.symbolic).toHaveLength(9);
      expect(parseOctalMode(description.octal)).toBe(mode);
      expect(applySymbolicMode(mode, "a+rr").mode).toBe(mode | 0o444);
    }
  });

  it("allows only outer whitespace and three or four octal digits", () => {
    expect(parseOctalMode("644")).toBe(0o644);
    expect(parseOctalMode("\n 4755 \t")).toBe(0o4755);
    expect(parseOctalMode(`${" ".repeat(12)}0644`)).toBe(0o644);
  });

  it.each([
    "",
    " ",
    "64",
    "00000",
    "0o644",
    "+644",
    "-644",
    "888",
    "6 44",
    "0644\n755",
    "６４４",
    "644\0",
    `${" ".repeat(13)}0644`,
  ])("rejects invalid or oversized octal input: %s", (input) => {
    expect(() => parseOctalMode(input)).toThrow(
      expect.objectContaining({ code: "CHMOD_INVALID_MODE" }),
    );
  });

  it.each([-1, 0o10000, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "validates numeric mode arguments before bitwise operations: %s",
    (mode) => {
      expect(() => describeMode(mode)).toThrow("CHMOD_INVALID_MODE");
      expect(() => applySymbolicMode(mode, "a+r")).toThrow("CHMOD_INVALID_MODE");
    },
  );
});

describe("explicit symbolic chmod", () => {
  it("applies comma-separated clauses sequentially and confines them to selected classes", () => {
    expect(applySymbolicMode(0o0644, "u+x,g-w,o=").octal).toBe("0740");
    expect(applySymbolicMode(0o0000, "a+r,u+w,g+x,o-r").octal).toBe("0650");
    expect(applySymbolicMode(0o0777, "u=rw,g=r,o=r").octal).toBe("0644");
    expect(applySymbolicMode(0o0000, "u+r,u-r").octal).toBe("0000");
    expect(applySymbolicMode(0o0000, "u-r,u+r").octal).toBe("0400");
    expect(applySymbolicMode(0o0000, " \tug+rw,o+r\n").octal).toBe("0664");
    expect(applySymbolicMode(0o0000, "uuga+rrwwxx").octal).toBe("0777");
  });

  it("changes setuid/setgid only for u/g and sticky only for o", () => {
    expect(applySymbolicMode(0o0755, "u+s").octal).toBe("4755");
    expect(applySymbolicMode(0o0755, "g+s").octal).toBe("2755");
    expect(applySymbolicMode(0o0755, "o+t").octal).toBe("1755");
    expect(applySymbolicMode(0o0755, "a+s,a+t").octal).toBe("7755");
    expect(applySymbolicMode(0o7777, "u-s,g-s,o-t").octal).toBe("0777");
    expect(applySymbolicMode(0o0644, "o+s,u+t,g+t").octal).toBe("0644");
    expect(applySymbolicMode(0o0644, "a+st").symbolic).toBe("rwSr-Sr-T");
  });

  it("clears selected ordinary and special bits for files with =, including an empty right side", () => {
    expect(applySymbolicMode(0o7777, "u=rw").octal).toBe("3677");
    expect(applySymbolicMode(0o7777, "g=r").octal).toBe("5747");
    expect(applySymbolicMode(0o7777, "o=r").octal).toBe("6774");
    expect(applySymbolicMode(0o7777, "a=").octal).toBe("0000");
    expect(applySymbolicMode(0o7777, "u=,g=,o=").octal).toBe("0000");
    expect(applySymbolicMode(0o0000, "u=rwxs,g=rxs,o=rxt").octal).toBe("7755");
  });

  it("preserves unmentioned directory setuid/setgid with = and clears sticky", () => {
    expect(applySymbolicMode(0o7777, "a=rw", true).octal).toBe("6666");
    expect(applySymbolicMode(0o7777, "u=rw", true).octal).toBe("7677");
    expect(applySymbolicMode(0o7777, "g=r", true).octal).toBe("7747");
    expect(applySymbolicMode(0o7777, "o=r", true).octal).toBe("6774");
    expect(applySymbolicMode(0o7777, "a=", true).octal).toBe("6000");
    expect(applySymbolicMode(0o7777, "a=rw,u-s,g-s", true).octal).toBe("0666");
    expect(applySymbolicMode(0o0000, "u=s,g=s,o=t", true).octal).toBe("7000");
    expect(applySymbolicMode(0o7777, "a=t", true).octal).toBe("7000");
    expect(applySymbolicMode(0o7777, "a=s", true).octal).toBe("6000");
  });

  it.each([
    "",
    " \t",
    "+r",
    "=rw",
    "u+",
    "g-",
    "u+r,",
    ",u+r",
    "u+r,,g+r",
    "u +r",
    "u+ r",
    "u+r, g+r",
    "u+X",
    "u=g",
    "g+u",
    "o+g",
    "u+r-w",
    "u++r",
    "u==r",
    "u=r+w",
    "U+r",
    "b+r",
    "u+R",
    "u+rx\0",
    "u+ｒ",
    "u+r\ng+r",
    "ｕ+r",
  ])("rejects expressions outside the documented subset: %s", (expression) => {
    expect(() => applySymbolicMode(0o0644, expression)).toThrow(
      expect.objectContaining({ code: "CHMOD_INVALID_SYMBOLIC" }),
    );
  });

  it("accepts exact byte/clause limits and rejects oversized raw Unicode or padding", () => {
    expect(applySymbolicMode(0, `u+${"r".repeat(254)}`).octal).toBe("0400");
    expect(applySymbolicMode(0, Array<string>(32).fill("u+r").join(",")).octal).toBe("0400");
    for (const expression of [
      `u+${"r".repeat(255)}`,
      "あ".repeat(86),
      `${" ".repeat(254)}u+r`,
      Array<string>(33).fill("u+r").join(","),
    ]) {
      expect(() => applySymbolicMode(0, expression)).toThrow(
        expect.objectContaining({ code: "CHMOD_SYMBOLIC_LIMIT" }),
      );
    }
    expect(() => applySymbolicMode(0, "あ".repeat(85))).toThrow("CHMOD_INVALID_SYMBOLIC");
  });
});

describe("umask creation defaults", () => {
  it.each([
    ["022", "022", "0644", "0755"],
    ["0027", "027", "0640", "0750"],
    ["777", "777", "0000", "0000"],
    ["000", "000", "0666", "0777"],
    ["111", "111", "0666", "0666"],
    [" \n027\t ", "027", "0640", "0750"],
  ])(
    "applies %s to 0666 regular-file and 0777 directory defaults",
    (input, mask, file, directory) => {
      const result = calculateUmask(input);
      expect(result.mask).toBe(mask);
      expect(result.file).toEqual(describeMode(Number.parseInt(file, 8)));
      expect(result.directory).toEqual(describeMode(Number.parseInt(directory, 8)));
    },
  );

  it.each([
    "",
    "22",
    "00022",
    "1022",
    "7022",
    "0o022",
    "888",
    "+022",
    "-022",
    "0 22",
    "０２２",
    "022\0",
    `${" ".repeat(14)}022`,
  ])("rejects special bits, invalid masks and excessive raw length: %s", (input) => {
    expect(() => calculateUmask(input)).toThrow(
      expect.objectContaining({ code: "CHMOD_INVALID_UMASK" }),
    );
  });
});

it("returns stable ToolError codes without echoing private input", () => {
  for (const [run, code] of [
    [() => parseOctalMode("private-octal-input"), "CHMOD_INVALID_MODE"],
    [() => applySymbolicMode(0, "private-symbolic-input"), "CHMOD_INVALID_SYMBOLIC"],
    [() => calculateUmask("private-umask-input"), "CHMOD_INVALID_UMASK"],
    [() => applySymbolicMode(0, "private".repeat(40)), "CHMOD_SYMBOLIC_LIMIT"],
  ] as const) {
    let error: unknown;
    try {
      run();
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ToolError);
    expect(error).toMatchObject({ code, message: code, detail: "" });
  }
});

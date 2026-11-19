import { describe, expect, it } from "vite-plus/test";
import { inspectRedisSlots, REDIS_SLOTS_LIMITS } from "./redis-slots";

const inspect = (keys: string[]) => inspectRedisSlots(JSON.stringify(keys));
describe("Redis Cluster UTF-8 hash slots", () => {
  it("matches the published XMODEM check and known Redis slots", () => {
    expect(inspect(["123456789"]).keys[0]).toEqual({
      key: "123456789", keyBytes: 9, hashTag: null, hashedBytes: 9, crc16: "31c3", slot: 12739,
    });
    expect(inspect(["foo", "bar"]).keys.map(k => k.slot)).toEqual([12182, 5061]);
  });
  it("uses only the first brace pair, including empty and nested pairs", () => {
    const keys = ["{user1000}.following", "{user1000}.followers", "foo{}{bar}", "foo{{bar}}zap", "foo{bar}{zap}", "}x{bar}", "{open", "{}", ""];
    const r = inspect(keys);
    expect(r.keys.map(k => k.hashTag)).toEqual(["user1000", "user1000", null, "{bar", "bar", "bar", null, null, null]);
    expect(r.keys[0]!.slot).toBe(3443); expect(r.keys[1]!.slot).toBe(3443);
    expect(r.keys[2]!.crc16).not.toBe(inspect(["bar"]).keys[0]!.crc16);
    expect(r.keys.at(-1)).toMatchObject({ key: "", keyBytes: 0, hashedBytes: 0, crc16: "0000", slot: 0 });
  });
  it("preserves key order, duplicates, distinct slots and boolean states", () => {
    expect(inspect(["a{x}", "b{x}", "a{x}"])).toMatchObject({ distinctSlots: 1, sameSlot: true });
    expect(inspect(["foo", "bar"])).toMatchObject({ distinctSlots: 2, sameSlot: false });
    expect(inspect(["one"])).toMatchObject({ distinctSlots: 1, sameSlot: true });
    expect(inspect([" a ", "a", " a "]).keys.map(k => k.key)).toEqual([" a ", "a", " a "]);
  });
  it("preserves Unicode scalars, controls and normalization differences", () => {
    const keys = ["日本語", "😀", "é", "e\u0301", "a\u0000b", "a\rb", "a\nb", "\ufeffx", "𝄞{😀}z"];
    const r = inspect(keys);
    expect(r.keys.map(k => k.key)).toEqual(keys);
    expect(r.keys.map(k => k.keyBytes)).toEqual([9, 4, 2, 3, 3, 3, 3, 4, 11]);
    expect(r.keys[2]!.crc16).not.toBe(r.keys[3]!.crc16);
    expect(r.keys.at(-1)).toMatchObject({ hashTag: "😀", hashedBytes: 4 });
    expect(JSON.stringify(r)).toContain("\\u0000");
  });
  it.each(["", "[", "[\"x\",]", "\ufeff[\"a\"]", "[NaN]", "[\"a\n\"]"])("rejects malformed JSON atomically: %s", input => {
    expect(() => inspectRedisSlots(input)).toThrowError("REDIS_SLOTS_JSON");
  });
  it.each(["null", "{}", "\"a\"", "[1]", "[null]", "[true]", "[[\"x\"]]", "[\"x\",{}]"])("accepts only a string array: %s", input => {
    expect(() => inspectRedisSlots(input)).toThrowError("REDIS_SLOTS_SHAPE");
  });
  it("rejects lone surrogates both raw and JSON-escaped without disclosing input", () => {
    for (const input of ['["\\ud800"]', '["\\udfff"]', '["x\\ud800y"]', '["\ud800"]']) {
      expect(() => inspectRedisSlots(input)).toThrowError("REDIS_SLOTS_UNICODE");
    }
    expect(() => inspect(["\ud800\udc00"])).not.toThrow();
  });
  it("enforces exact raw UTF-8 and decoded key-byte limits before producing output", () => {
    const exact = '["a"]' + " ".repeat(8192 - 5);
    expect(inspectRedisSlots(exact).keys).toHaveLength(1);
    expect(() => inspectRedisSlots(exact + " ")).toThrowError(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(() => inspectRedisSlots('["界"]' + " ".repeat(8192 - 5))).toThrowError(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(inspect(["😀".repeat(256)]).keys[0]!.keyBytes).toBe(1024);
    expect(() => inspect(["😀".repeat(256) + "a"])).toThrowError("REDIS_SLOTS_KEY_LIMIT");
    expect(inspectRedisSlots('["' + "\\u0061".repeat(1024) + '"]').keys[0]!.keyBytes).toBe(1024);
    expect(() => inspectRedisSlots('["' + "\\u0061".repeat(1025) + '"]')).toThrowError("REDIS_SLOTS_KEY_LIMIT");
  });
  it("requires 1–128 keys and returns every accepted row in bounded JSON", () => {
    expect(() => inspect([])).toThrowError("REDIS_SLOTS_COUNT");
    const r = inspect(Array.from({ length: 128 }, (_, i) => "key{" + i + "}"));
    expect(r.keys).toHaveLength(128);
    expect(new TextEncoder().encode(JSON.stringify(r, null, 2)).length).toBeLessThanOrEqual(REDIS_SLOTS_LIMITS.outputBytes);
    expect(() => inspect(Array(129).fill("x"))).toThrowError("REDIS_SLOTS_COUNT");
  });
});

// Expected CRCs generated independently with Python binascii.crc_hqx(bytes, 0).
const pythonVectors: [string, string, number][] = [
  [
    "\u65e5\u672c\u8a9e",
    "31f4",
    12788
  ],
  [
    "\ud83d\ude00",
    "cb8f",
    2959
  ],
  [
    "\u00e9",
    "67c4",
    10180
  ],
  [
    "e\u0301",
    "a20b",
    8715
  ],
  [
    "a\u0000b",
    "e0bf",
    8383
  ],
  [
    "a\rb",
    "96e3",
    5859
  ],
  [
    "a\nb",
    "0f74",
    3956
  ],
  [
    "\ufeffx",
    "afa6",
    12198
  ],
  [
    "\ud834\udd1e{\ud83d\ude00}z",
    "cb8f",
    2959
  ],
  [
    "3\\Qt1\"2SbSxq4J2XTj~Et,7n3i}",
    "835f",
    863
  ],
  [
    "Pp64E+e4/r#2Fz'O",
    "ffc5",
    16325
  ],
  [
    ",&S'?A3*=g\\ tIJK+PVULvjDlU^\\$q`Nn3,-9?Mke_vr=z?",
    "4801",
    2049
  ],
  [
    "::Y^)A|r5JFCv[\\~g{-}Utd[j0f1o_,t(zw",
    "f5cf",
    13775
  ],
  [
    "Vi@u/6a4F",
    "725a",
    12890
  ],
  [
    "=f$@pYra[<C`G%\"jRVOi)K%{p%Iq3Q\"XFH5&y",
    "7808",
    14344
  ],
  [
    "b7P4XM2v=YS[_$R ]TV@MgQ2ymg)d[<I?z'C",
    "f160",
    12640
  ],
  [
    "le4uK&6 G?\"6]_9g\"%N115W\"{TdMkZj/c/[~x;A<MHTulk=3=",
    "29cb",
    10699
  ],
  [
    "umOM:db6\"JH#{ZtaUbD>:H",
    "8263",
    611
  ],
  [
    "$P6F.? 3Mafq5% z?;",
    "71c4",
    12740
  ],
  [
    "s4lchZ'SI^#Ep.'Ws\\5~|DzgR-!8S`jLN",
    "a6be",
    9918
  ],
  [
    "E@e8IlWg6UP!rSD",
    "5eb0",
    7856
  ],
  [
    "1uA&1x*A=F.o)b#1eG8!wvOds|x`F'1",
    "4716",
    1814
  ],
  [
    "f+6eT6Wy2-",
    "d4ac",
    5292
  ],
  [
    "v4/_uo&u<]Tb'> :mQ[&>j)w.=_B8AqkGL#RYXN}+g2|7qpNDvh~^y",
    "7a0a",
    14858
  ],
  [
    "Y48MwCV{(cE7Ry&]?lc343Gx6n>8Ya%H8*0",
    "2c66",
    11366
  ],
  [
    "Ipd>9*FV?2pu)b:\\_r;}~X4pYX@'p",
    "6de0",
    11744
  ],
  [
    "*WSN#uiX]e,y[{gHJhIyp&*~,J*Ww",
    "fdf9",
    15865
  ],
  [
    "f_.\"aoekgUEv2oUDC^Q^Ay%SY(7Szc3P{kvk,At[UT.L34?/R_'",
    "442d",
    1069
  ],
  [
    "Ea;bA+}r-$>18k>,c2MSb+lP-ANr.e}G~",
    "93a6",
    5030
  ],
  [
    "f]Yt{]b)tYD0ml",
    "dc2d",
    7213
  ],
  [
    "7bH!GDQ:I>( >eA04hO{Z0x#W.NdK7%9ZI*{][hw)MP(*Lr==QQ/l\\a",
    "0abf",
    2751
  ],
  [
    "Z5Zofpp)9 ]o{9KB",
    "6ac7",
    10951
  ],
  [
    "xL{)tfo[|wR]eMW|?fHj4<~I",
    "5789",
    6025
  ],
  [
    "%Uey=pw",
    "2e90",
    11920
  ],
  [
    "\")M?\\r7DP^LN^nc{GxYm.|{Z1:oym+@",
    "3ad2",
    15058
  ],
  [
    "T?p$Oio^<+_*Okj| \"FAEZG\"aTXv3l0i>",
    "5b01",
    6913
  ],
  [
    "Q?KD;Rz5je~f+QVt|Th_k8r`9oF!>SNeh+",
    "d1a4",
    4516
  ],
  [
    "Oarp#7b*db'dgT;Z|*Hb",
    "a366",
    9062
  ],
  [
    "6#`wL=<o!@Q$qx$YypUe|JPR@@]p%c@0sqG'w",
    "ed3b",
    11579
  ],
  [
    "Q+Qm9X~T0''N#0vx/",
    "debe",
    7870
  ],
  [
    ".Vt ):U*[b<G[C8<rucM[mXVtngNX=}",
    "9e45",
    7749
  ],
  [
    "Lf49p^Y=",
    "2c84",
    11396
  ],
  [
    "n vD])/5nD1:n2B,Bf02uoqth",
    "92b9",
    4793
  ],
  [
    "0.wjtt;k)H:GPG&abhR%;rkS-Gw@9p^0xp'Y|z4fw+F0#]\"S7G(",
    "fb8c",
    15244
  ],
  [
    "lRe0TaT+<!DE[",
    "c622",
    1570
  ],
  [
    "TykdC$7.adQtr[o9%mD(%Cr~*cSo",
    "0f80",
    3968
  ],
  [
    "JFT:Bsd92Tcp8X23Ot?]`sb}KLt4yW\"jz/T&ksx/",
    "4bf3",
    3059
  ],
  [
    ";E3nbh3ta[R`w_w32w1prYieSpT,q/_hJp6By",
    "c4af",
    1199
  ],
  [
    "/,\"4[,:iM<pxs.L}QJ}|ffLa4,4 n-RK4h;e",
    "08c7",
    2247
  ],
  [
    "G{#[lw1^_aWe.13V2+:dcqK",
    "1d19",
    7449
  ],
  [
    "_JPt\";}`+zo+.j4rwyb@ka\"\"y|7=Jg{\\i4i!?uG&hbER84qx2.w>.SJl",
    "fc23",
    15395
  ],
  [
    "Vx_X*'+olGOky=Nl[9B{)y-\\^nRaH07I)[UvT",
    "c376",
    886
  ],
  [
    "!\\R,RQDs",
    "825d",
    605
  ],
  [
    "!w7TPz",
    "2452",
    9298
  ],
  [
    "!8{\"I/Augr1U42~p6g=</z:7M3zFd&,\\'2q%zVc",
    "86ea",
    1770
  ],
  [
    "[0-sum8zN<'jcV.Qz|C,d5I6sK=?AY^^)..Z?`<>q(X!lULp}H)@l",
    "e174",
    8564
  ],
  [
    "V)8}({(}~$c(l&#!5",
    "a56a",
    9578
  ]
];
it("matches independent Python vectors including Unicode and arbitrary braces", () => {
  for (const [key, crc16, slot] of pythonVectors) expect(inspect([key]).keys[0]).toMatchObject({ crc16, slot });
});
